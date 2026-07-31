<?php

function DDM_Service($postdata = null)
{
    return DDM_Service_declarationItems($postdata);
}

function DDM_Service_tokens($postdata = null)
{
    $enrollmentId = DDM_enrollmentId();
    DDM_updateDeviceState($enrollmentId, [
        "ddm.tokens" => DDM_normalizeBody($postdata),
        "ddm.lastTokenUpdate" => time(),
        "ddm.enabled" => true,
    ]);

    return [
        "SyncTokens" => DDM_synchronizationTokensForEnrollment($enrollmentId),
    ];
}

function DDM_Service_declarationItems($postdata = null)
{
    $enrollmentId = DDM_enrollmentId();
    DDM_updateDeviceState($enrollmentId, [
        "ddm.lastDeclarationItemsRequest" => time(),
        "ddm.enabled" => true,
    ]);

    return DDM_declarationItemsForEnrollment($enrollmentId);
}

function DDM_Service_status($postdata = null)
{
    global $MDMDDMDeviceState, $MDMDDMStatusReports;

    $enrollmentId = DDM_enrollmentId();
    $body = DDM_normalizeBody($postdata);
    $report = [
        "enrollmentId" => $enrollmentId,
        "receivedAt" => time(),
        "body" => $body,
        "raw" => is_string($postdata) ? $postdata : null,
    ];
    $MDMDDMStatusReports->insertOne($report);

    $existingState = $MDMDDMDeviceState->findOne(["enrollmentId" => $enrollmentId]);
    $existingState = $existingState ? DDM_toArray($existingState) : [];
    $reportedItems = DDM_toArray($body["StatusItems"] ?? []);
    $currentStatus = DDM_toArray($existingState["ddm"]["currentStatus"] ?? []);
    if (!empty($body["FullReport"])) {
        $currentStatus = is_array($reportedItems) ? $reportedItems : [];
    } elseif (is_array($reportedItems)) {
        $currentStatus = array_replace($currentStatus, $reportedItems);
    }

    DDM_updateDeviceState($enrollmentId, [
        "ddm.lastStatusAt" => time(),
        "ddm.lastStatus" => $body,
        "ddm.currentStatus" => $currentStatus,
        "ddm.statusErrors" => DDM_toArray($body["Errors"] ?? []),
        "ddm.lastReportWasFull" => (bool)($body["FullReport"] ?? false),
        "ddm.enabled" => true,
    ]);

    // Apple requires a 200 response with an empty body for status reports.
    http_response_code(200);
    header("Content-Length: 0");
    exit;
}

function DDM_Service_declaration($type, $identifier, $postdata = null)
{
    global $MDMDDMDeclarations;

    $declaration = $MDMDDMDeclarations->findOne([
        "category" => DDM_manifestCategory($type),
        "identifier" => rawurldecode($identifier),
        "active" => true,
    ]);

    if (!$declaration) {
        http_response_code(404);
        return ["error" => "Declaration not found"];
    }

    return DDM_publicDeclaration($declaration);
}

function DDM_Service_profile($profileId, $token)
{
    global $MDMDDMDeclarations;

    $expectedToken = DDM_profileDownloadToken($profileId);
    $declaration = $MDMDDMDeclarations->findOne([
        "sourceType" => "profile",
        "sourceId" => $profileId,
        "active" => true,
    ]);
    if (!$declaration || !hash_equals($expectedToken, (string)$token)) {
        http_response_code(404);
        return ["error" => "Profile not found"];
    }

    return Profiles_downloadXML($profileId);
}

function DDM_Admin_summary($userinfo)
{
    global $MDMdevices, $MDMDDMDeclarations, $MDMDDMDeviceState, $MDMDDMStatusReports;

    $states = [];
    foreach ($MDMDDMDeviceState->find() as $state) {
        $stateArray = DDM_toArray($state);
        foreach ([$stateArray["enrollmentId"] ?? null, $stateArray["udid"] ?? null] as $stateId) {
            if ($stateId) {
                $states[(string)$stateId] = $stateArray;
            }
        }
    }

    $devices = [];
    foreach ($MDMdevices->find([], ["projection" => [
        "udid" => 1, "DeviceName" => 1, "Model" => 1, "ModelName" => 1, "ProductName" => 1,
        "OSVersion" => 1, "enrollment_status" => 1, "IsSupervised" => 1, "lastCheckin" => 1,
    ]]) as $device) {
        $deviceArray = DDM_toArray($device);
        $udid = (string)($deviceArray["udid"] ?? "");
        if ($udid === "") {
            continue;
        }
        $devices[] = DDM_deviceOverview($deviceArray, $states[$udid] ?? null);
    }
    usort($devices, function ($left, $right) {
        if (($left["support"]["supported"] ?? false) !== ($right["support"]["supported"] ?? false)) {
            return ($left["support"]["supported"] ?? false) ? -1 : 1;
        }
        return strcasecmp($left["name"] ?? "", $right["name"] ?? "");
    });

    $supported = array_values(array_filter($devices, function ($device) {
        return $device["support"]["supported"] ?? false;
    }));
    $active = array_values(array_filter($devices, function ($device) {
        return ($device["phase"]["key"] ?? "") === "active";
    }));
    $attention = array_values(array_filter($devices, function ($device) {
        return in_array($device["phase"]["key"] ?? "", ["waiting", "syncing", "stale", "error"], true);
    }));

    $requiredDeclarations = [
        "tds.management.status.v1",
        "tds.management.server-capabilities.v1",
        "tds.activation.standard.v1",
    ];
    $readyDeclarations = 0;
    foreach ($requiredDeclarations as $identifier) {
        if ($MDMDDMDeclarations->findOne(["identifier" => $identifier, "active" => true])) {
            $readyDeclarations++;
        }
    }
    $transportSeen = count(array_filter($devices, function ($device) {
        return !empty($device["state"]["lastTokenUpdate"]);
    })) > 0;

    $setupSteps = [
        ["key" => "transport", "title" => "MicroMDM declaration service", "complete" => $transportSeen, "detail" => $transportSeen ? "A managed device has reached the token endpoint." : "Start MicroMDM with the declaration service URL below."],
        ["key" => "declarations", "title" => "Core declarations", "complete" => $readyDeclarations === count($requiredDeclarations), "detail" => $readyDeclarations === count($requiredDeclarations) ? "Server capabilities, status subscriptions and activation are ready." : "Run Prepare declarations to create the required system declarations."],
        ["key" => "device", "title" => "Supported device connected", "complete" => count($active) > 0, "detail" => count($active) > 0 ? count($active) . " device(s) are reporting declarative status." : "Choose a supported enrolled device and request DDM setup."],
    ];

    return [
        "serviceUrl" => "https://" . $GLOBALS["hostName"] . "/TDSapi/core/v1/ddm",
        "recommendedMicroMdmFlag" => "-dm https://" . $GLOBALS["hostName"] . "/TDSapi/core/v1/ddm/",
        "counts" => [
            "devices" => count($devices),
            "supportedDevices" => count($supported),
            "ddmEnabledDevices" => count($active),
            "attentionDevices" => count($attention),
            "declarations" => $MDMDDMDeclarations->countDocuments(),
            "activeDeclarations" => $MDMDDMDeclarations->countDocuments(["active" => true]),
            "statusReports" => $MDMDDMStatusReports->countDocuments(),
        ],
        "setup" => ["complete" => count(array_filter($setupSteps, function ($step) { return $step["complete"]; })) === count($setupSteps), "steps" => $setupSteps],
        "devices" => $devices,
        "recentDeclarations" => DDM_recentDeclarations(8),
    ];
}

function DDM_Admin_declarations($userinfo)
{
    return [
        "declarations" => DDM_recentDeclarations(250),
    ];
}

function DDM_Admin_subscriptions($userinfo)
{
    return [
        "catalog" => DDM_statusCatalog(),
        "selected" => DDM_selectedStatusItems(),
        "declarationIdentifier" => "tds.management.status.v1",
    ];
}

function DDM_Admin_saveSubscriptions($postdata, $userinfo)
{
    $items = $postdata["items"] ?? [];
    if (!is_array($items)) {
        return ["error" => "items must be an array"];
    }

    $cleanItems = [];
    foreach ($items as $item) {
        $item = trim((string)$item);
        if ($item !== "" && !in_array($item, $cleanItems)) {
            $cleanItems[] = $item;
        }
    }

    DDM_ensureManagementDeclaration($cleanItems);
    DDM_ensureServerCapabilitiesDeclaration();
    DDM_ensureActivationDeclaration();

    return [
        "success" => true,
        "selected" => $cleanItems,
        "declarationsToken" => DDM_declarationsTokenForEnrollment("global"),
        "updatedAt" => time(),
    ];
}

function DDM_Admin_deviceState($udid, $userinfo)
{
    global $MDMdevices, $MDMDDMDeviceState, $MDMDDMStatusReports;

    $device = $MDMdevices->findOne(["udid" => $udid]);
    $deviceArray = $device ? DDM_toArray($device) : ["udid" => $udid];

    $state = $MDMDDMDeviceState->findOne([
        '$or' => [
            ["enrollmentId" => $udid],
            ["udid" => $udid],
        ],
    ]);

    $enrollmentId = $state["enrollmentId"] ?? $udid;
    $statusCursor = $MDMDDMStatusReports->find(
        ["enrollmentId" => $enrollmentId],
        [
            "limit" => 10,
            "sort" => ["receivedAt" => -1],
        ]
    );

    $reports = [];
    foreach ($statusCursor as $report) {
        $reports[] = [
            "receivedAt" => $report["receivedAt"] ?? null,
            "body" => $report["body"] ?? [],
        ];
    }

    $stateArray = $state ? DDM_toArray($state) : null;
    return [
        "udid" => $udid,
        "overview" => DDM_deviceOverview($deviceArray, $stateArray),
        "state" => DDM_simplifyState($stateArray),
        "statusSnapshot" => DDM_statusSnapshot($stateArray),
        "monitoring" => DDM_monitoringItems(),
        "subscriptionCatalog" => DDM_statusCatalog(),
        "selectedSubscriptions" => DDM_selectedStatusItems(),
        "declarations" => DDM_recentDeclarations(250),
        "statusReports" => $reports,
    ];
}

function DDM_Admin_sync($postdata, $userinfo)
{
    $profileCount = DDM_syncProfiles();
    $appCount = DDM_syncApps();
    DDM_ensureManagementDeclaration();
    DDM_ensureServerCapabilitiesDeclaration();
    DDM_ensureActivationDeclaration();

    return [
        "success" => true,
        "profilesSynced" => $profileCount,
        "appsSynced" => $appCount,
        "managementDeclaration" => true,
        "syncedAt" => time(),
    ];
}

function DDM_Admin_enableDevice($udid, $postdata, $userinfo)
{
    global $MDMdevices;

    $device = $MDMdevices->findOne(["udid" => $udid]);
    if (!$device) {
        http_response_code(404);
        return ["success" => false, "error" => "Device not found"];
    }
    $deviceArray = DDM_toArray($device);
    $support = DDM_deviceSupport($deviceArray);
    if (!$support["supported"]) {
        http_response_code(400);
        return ["success" => false, "error" => $support["reason"], "support" => $support];
    }
    if (isset($deviceArray["enrollment_status"]) && !$deviceArray["enrollment_status"]) {
        http_response_code(400);
        return ["success" => false, "error" => "This device is not currently enrolled.", "support" => $support];
    }

    DDM_ensureManagementDeclaration();
    DDM_ensureServerCapabilitiesDeclaration();
    DDM_ensureActivationDeclaration();
    $uuid = createProfileUUID();
    $xml = DDM_declarativeManagementCommand($uuid, $udid);
    $result = Core_sendDeviceCommandV2RawData($udid, $uuid, $xml);

    $success = is_array($result) && !isset($result["error"]) && (($result["status"] ?? "") !== "failed");
    DDM_updateDeviceState($udid, [
        "udid" => $udid,
        "ddm.enableCommandUUID" => $uuid,
        "ddm.enableCommandSentAt" => time(),
        "ddm.requestedBy" => $userinfo["GeneratedUID"] ?? null,
        "ddm.enableCommandSucceeded" => $success,
        "ddm.enableCommandError" => $success ? null : ($result["error"] ?? "The command could not be queued."),
    ]);

    return [
        "success" => $success,
        "commandUUID" => $uuid,
        "support" => $support,
        "result" => $result,
    ];
}

function DDM_declarationItemsForEnrollment($enrollmentId)
{
    global $MDMDDMDeclarations;

    $cursor = $MDMDDMDeclarations->find(["active" => true]);
    $items = [
        "Activations" => [],
        "Configurations" => [],
        "Assets" => [],
        "Management" => [],
    ];

    foreach ($cursor as $declaration) {
        $category = $declaration["category"] ?? DDM_categoryForType($declaration["type"] ?? "");
        if (!isset($items[$category])) {
            $items[$category] = [];
        }

        $items[$category][] = [
            "Identifier" => $declaration["identifier"],
            "ServerToken" => $declaration["serverToken"],
        ];
    }

    return [
        "Declarations" => $items,
        "DeclarationsToken" => DDM_declarationsTokenForEnrollment($enrollmentId),
    ];
}

function DDM_syncProfiles()
{
    global $MDMProfiles;
    global $MDMDDMDeclarations;

    $count = 0;
    $MDMDDMDeclarations->updateMany(
        ["sourceType" => "profile", "active" => true],
        ['$set' => ["active" => false, "updatedAt" => time()]]
    );
    $profiles = $MDMProfiles->find();
    foreach ($profiles as $profile) {
        if (!isset($profile["PayloadUUID"])) {
            continue;
        }

        $payload = [
            "ProfileURL" => "https://" . $GLOBALS["hostName"] . "/TDSapi/core/v1/ddm/profile/" . $profile["PayloadUUID"] . "/" . DDM_profileDownloadToken($profile["PayloadUUID"]),
        ];

        DDM_upsertDeclaration([
            "identifier" => "tds.profile." . $profile["PayloadUUID"],
            "type" => "com.apple.configuration.legacy",
            "category" => "Configurations",
            "payload" => $payload,
            "sourceType" => "profile",
            "sourceId" => $profile["PayloadUUID"],
            "active" => true,
        ]);
        $count++;
    }

    return $count;
}

function DDM_syncApps()
{
    global $MDMApps;
    global $MDMDDMDeclarations;

    $count = 0;
    $MDMDDMDeclarations->updateMany(
        ["sourceType" => "app", "active" => true],
        ['$set' => ["active" => false, "updatedAt" => time()]]
    );
    $apps = $MDMApps->find();
    foreach ($apps as $app) {
        if (!isset($app["_id"]) || !isset($app["CFBundleIdentifier"])) {
            continue;
        }

        $appId = (string)$app["_id"];
        if (($app["lifecycleState"] ?? "active") !== "active") {
            continue;
        }

        $payload = [
            "ManifestURL" => "https://" . $GLOBALS["hostName"] . "/TDSapi/v1/system/apps/download/" . $appId,
            "InstallBehavior" => [
                "Install" => "Required",
            ],
        ];

        DDM_upsertDeclaration([
            "identifier" => "tds.app." . $appId,
            "type" => "com.apple.configuration.app.managed",
            "category" => "Configurations",
            "payload" => $payload,
            "sourceType" => "app",
            "sourceId" => $appId,
            "active" => true,
        ]);
        $count++;
    }

    return $count;
}

function DDM_ensureManagementDeclaration($statusItems = null)
{
    if ($statusItems === null) {
        $statusItems = DDM_selectedStatusItems();
    }

    DDM_upsertDeclaration([
        "identifier" => "tds.management.status.v1",
        "type" => "com.apple.configuration.management.status-subscriptions",
        "category" => "Configurations",
        "payload" => [
            "StatusItems" => array_map(function ($item) {
                return ["Name" => $item];
            }, $statusItems),
        ],
        "sourceType" => "system",
        "sourceId" => "status-subscriptions",
        "active" => true,
    ]);
}

function DDM_ensureServerCapabilitiesDeclaration()
{
    DDM_upsertDeclaration([
        "identifier" => "tds.management.server-capabilities.v1",
        "type" => "com.apple.management.server-capabilities",
        "category" => "Management",
        "payload" => [
            "Version" => "1.0",
            "SupportedFeatures" => new stdClass(),
        ],
        "sourceType" => "system",
        "sourceId" => "server-capabilities",
        "active" => true,
    ]);
}

function DDM_ensureActivationDeclaration()
{
    global $MDMDDMDeclarations;

    $configurationIdentifiers = [];
    $cursor = $MDMDDMDeclarations->find([
        "active" => true,
        "category" => "Configurations",
        // App and profile declarations need an explicit device assignment model.
        // Activating every synced declaration would install everything everywhere.
        "sourceType" => "system",
    ]);
    foreach ($cursor as $configuration) {
        if (!empty($configuration["identifier"])) {
            $configurationIdentifiers[] = (string)$configuration["identifier"];
        }
    }
    sort($configurationIdentifiers, SORT_STRING);

    DDM_upsertDeclaration([
        "identifier" => "tds.activation.standard.v1",
        "type" => "com.apple.activation.simple",
        "category" => "Activations",
        "payload" => [
            "StandardConfigurations" => array_values(array_unique($configurationIdentifiers)),
        ],
        "sourceType" => "system",
        "sourceId" => "standard-activation",
        "active" => true,
    ]);
}

function DDM_upsertDeclaration($declaration)
{
    global $MDMDDMDeclarations;

    $payload = $declaration["payload"] ?? [];
    $token = hash("sha256", json_encode([
        "type" => $declaration["type"],
        "identifier" => $declaration["identifier"],
        "payload" => $payload,
    ]));

    $document = [
        "identifier" => $declaration["identifier"],
        "type" => $declaration["type"],
        "category" => $declaration["category"] ?? DDM_categoryForType($declaration["type"]),
        "payload" => $payload,
        "serverToken" => $token,
        "sourceType" => $declaration["sourceType"] ?? "manual",
        "sourceId" => $declaration["sourceId"] ?? null,
        "active" => $declaration["active"] ?? true,
        "updatedAt" => time(),
    ];

    $existing = $MDMDDMDeclarations->findOne(["identifier" => $document["identifier"]]);
    if ($existing) {
        $MDMDDMDeclarations->updateOne(
            ["identifier" => $document["identifier"]],
            ['$set' => $document]
        );
        return;
    }

    $document["createdAt"] = time();
    $MDMDDMDeclarations->insertOne($document);
}

function DDM_publicDeclaration($declaration)
{
    return [
        "Type" => $declaration["type"],
        "Identifier" => $declaration["identifier"],
        "ServerToken" => $declaration["serverToken"],
        "Payload" => $declaration["payload"] ?? [],
    ];
}

function DDM_categoryForType($type)
{
    if (strpos($type, "com.apple.activation.") === 0) {
        return "Activations";
    }
    if (strpos($type, "com.apple.asset.") === 0) {
        return "Assets";
    }
    if (strpos($type, "com.apple.management.") === 0) {
        return "Management";
    }
    return "Configurations";
}

function DDM_manifestCategory($pathType)
{
    $map = [
        "activation" => "Activations",
        "asset" => "Assets",
        "configuration" => "Configurations",
        "management" => "Management",
    ];
    return $map[strtolower((string)$pathType)] ?? "Unknown";
}

function DDM_profileDownloadToken($profileId)
{
    $secret = (string)($GLOBALS["apikey"] ?? "tds-mdm");
    return hash_hmac("sha256", "ddm-profile:" . (string)$profileId, $secret);
}

function DDM_declarationsTokenForEnrollment($enrollmentId)
{
    global $MDMDDMDeclarations;

    $declarations = [];
    $cursor = $MDMDDMDeclarations->find(["active" => true]);
    foreach ($cursor as $declaration) {
        $declarations[] = [
            "Category" => $declaration["category"] ?? DDM_categoryForType($declaration["type"] ?? ""),
            "Identifier" => (string)($declaration["identifier"] ?? ""),
            "ServerToken" => (string)($declaration["serverToken"] ?? ""),
        ];
    }
    usort($declarations, function ($left, $right) {
        return strcmp(
            $left["Category"] . ":" . $left["Identifier"],
            $right["Category"] . ":" . $right["Identifier"]
        );
    });

    return hash("sha256", json_encode($declarations, JSON_UNESCAPED_SLASHES));
}

function DDM_synchronizationTokensForEnrollment($enrollmentId)
{
    global $MDMDDMDeclarations;

    $latestUpdatedAt = 0;
    $cursor = $MDMDDMDeclarations->find(["active" => true]);
    foreach ($cursor as $declaration) {
        $latestUpdatedAt = max($latestUpdatedAt, (int)($declaration["updatedAt"] ?? 0));
    }

    return [
        "DeclarationsToken" => DDM_declarationsTokenForEnrollment($enrollmentId),
        // Keep this stable until declaration state changes so the device does not
        // continuously see a new synchronization state on every token request.
        "Timestamp" => gmdate("Y-m-d\\TH:i:s\\Z", $latestUpdatedAt ?: 0),
    ];
}

function DDM_recentDeclarations($limit)
{
    global $MDMDDMDeclarations;

    $cursor = $MDMDDMDeclarations->find([], [
        "limit" => $limit,
        "sort" => ["updatedAt" => -1],
    ]);
    $output = [];
    foreach ($cursor as $declaration) {
        $output[] = [
            "identifier" => $declaration["identifier"] ?? "",
            "type" => $declaration["type"] ?? "",
            "category" => $declaration["category"] ?? "",
            "serverToken" => $declaration["serverToken"] ?? "",
            "sourceType" => $declaration["sourceType"] ?? "",
            "sourceId" => $declaration["sourceId"] ?? "",
            "active" => $declaration["active"] ?? false,
            "updatedAt" => $declaration["updatedAt"] ?? null,
        ];
    }
    return $output;
}

function DDM_recentDeviceStates()
{
    global $MDMDDMDeviceState;

    $cursor = $MDMDDMDeviceState->find([], [
        "limit" => 20,
        "sort" => ["ddm.lastStatusAt" => -1, "ddm.enableCommandSentAt" => -1],
    ]);
    $output = [];
    foreach ($cursor as $state) {
        $output[] = [
            "enrollmentId" => $state["enrollmentId"] ?? ($state["udid"] ?? ""),
            "udid" => $state["udid"] ?? ($state["enrollmentId"] ?? ""),
            "enabled" => $state["ddm"]["enabled"] ?? false,
            "lastTokenUpdate" => $state["ddm"]["lastTokenUpdate"] ?? null,
            "lastDeclarationItemsRequest" => $state["ddm"]["lastDeclarationItemsRequest"] ?? null,
            "lastStatusAt" => $state["ddm"]["lastStatusAt"] ?? null,
            "enableCommandUUID" => $state["ddm"]["enableCommandUUID"] ?? null,
        ];
    }
    return $output;
}

function DDM_toArray($value)
{
    if ($value instanceof Traversable) {
        $value = iterator_to_array($value);
    }
    if (is_object($value)) {
        $value = (array)$value;
    }
    if (!is_array($value)) {
        return $value;
    }
    $output = [];
    foreach ($value as $key => $item) {
        $output[$key] = DDM_toArray($item);
    }
    return $output;
}

function DDM_deviceSupport($device)
{
    $modelText = strtolower((string)(($device["ModelName"] ?? "") . " " . ($device["Model"] ?? "") . " " . ($device["ProductName"] ?? "")));
    $platform = "iOS";
    $minimum = "15.0";

    if (strpos($modelText, "apple tv") !== false || strpos($modelText, "appletv") !== false) {
        $platform = "tvOS";
        $minimum = "16.0";
    } elseif (strpos($modelText, "vision") !== false || strpos($modelText, "realitydevice") !== false) {
        $platform = "visionOS";
        $minimum = "1.1";
    } elseif (strpos($modelText, "watch") !== false) {
        $platform = "watchOS";
        $minimum = "10.0";
    } elseif (strpos($modelText, "mac") !== false) {
        $platform = "macOS";
        $minimum = "13.0";
    }

    $version = trim((string)($device["OSVersion"] ?? ""));
    if ($version === "") {
        return [
            "supported" => false,
            "platform" => $platform,
            "minimumVersion" => $minimum,
            "version" => null,
            "reason" => "Refresh device information before enabling DDM so its OS version can be checked.",
        ];
    }

    $supported = version_compare($version, $minimum, ">=");
    return [
        "supported" => $supported,
        "platform" => $platform,
        "minimumVersion" => $minimum,
        "version" => $version,
        "reason" => $supported
            ? $platform . " " . $version . " supports declarative management."
            : $platform . " " . $version . " does not support DDM; version " . $minimum . " or later is required.",
    ];
}

function DDM_devicePhase($support, $state)
{
    if (!$support["supported"]) {
        return ["key" => "unsupported", "label" => "Unsupported", "tone" => "muted", "detail" => $support["reason"]];
    }

    $ddm = $state["ddm"] ?? [];
    if (($ddm["enableCommandSucceeded"] ?? true) === false) {
        return ["key" => "error", "label" => "Setup failed", "tone" => "bad", "detail" => $ddm["enableCommandError"] ?? "The setup command failed."];
    }

    $lastStatus = (int)($ddm["lastStatusAt"] ?? 0);
    if ($lastStatus > 0) {
        if ($lastStatus < time() - (36 * 60 * 60)) {
            return ["key" => "stale", "label" => "Needs attention", "tone" => "warn", "detail" => "The last DDM status report is more than 36 hours old."];
        }
        return ["key" => "active", "label" => "Active", "tone" => "ok", "detail" => "The device is reporting declarative status."];
    }
    if (!empty($ddm["lastDeclarationItemsRequest"])) {
        return ["key" => "syncing", "label" => "Syncing", "tone" => "accent", "detail" => "The device fetched the declaration manifest and is waiting to report status."];
    }
    if (!empty($ddm["lastTokenUpdate"])) {
        return ["key" => "syncing", "label" => "Syncing", "tone" => "accent", "detail" => "The device contacted the DDM service and is fetching declarations."];
    }
    if (!empty($ddm["enableCommandSentAt"])) {
        return ["key" => "waiting", "label" => "Waiting for device", "tone" => "warn", "detail" => "The setup command was queued but the device has not contacted the DDM service yet."];
    }
    return ["key" => "available", "label" => "Ready to enable", "tone" => "muted", "detail" => "This device supports DDM but setup has not been requested."];
}

function DDM_deviceOverview($device, $state = null)
{
    $state = $state ?: [];
    $support = DDM_deviceSupport($device);
    $simpleState = DDM_simplifyState($state);
    return [
        "udid" => (string)($device["udid"] ?? ($state["udid"] ?? $state["enrollmentId"] ?? "")),
        "name" => (string)($device["DeviceName"] ?? "Unnamed device"),
        "model" => (string)($device["ModelName"] ?? $device["Model"] ?? "Unknown model"),
        "osVersion" => $device["OSVersion"] ?? null,
        "enrolled" => (bool)($device["enrollment_status"] ?? true),
        "supervised" => (bool)($device["IsSupervised"] ?? false),
        "lastCheckin" => $device["lastCheckin"] ?? null,
        "support" => $support,
        "phase" => DDM_devicePhase($support, $state),
        "state" => $simpleState,
    ];
}

function DDM_statusSnapshot($state)
{
    $body = DDM_toArray($state["ddm"]["lastStatus"] ?? []);
    $statusItems = DDM_toArray($state["ddm"]["currentStatus"] ?? ($body["StatusItems"] ?? []));
    $items = [];
    if (is_array($statusItems)) {
        DDM_flattenStatusItems($statusItems, "", $items);
        usort($items, function ($left, $right) {
            return strcmp($left["key"], $right["key"]);
        });
    }
    return [
        "items" => $items,
        "errors" => array_values((array)DDM_toArray($state["ddm"]["statusErrors"] ?? ($body["Errors"] ?? []))),
        "fullReport" => (bool)($state["ddm"]["lastReportWasFull"] ?? ($body["FullReport"] ?? false)),
        "receivedAt" => $state["ddm"]["lastStatusAt"] ?? null,
    ];
}

function DDM_flattenStatusItems($value, $prefix, &$output)
{
    $value = DDM_toArray($value);
    if (!is_array($value) || array_is_list($value) || count($value) === 0) {
        if ($prefix !== "") {
            $output[] = [
                "key" => $prefix,
                "label" => DDM_statusLabel($prefix),
                "value" => $value,
                "complex" => is_array($value),
            ];
        }
        return;
    }

    foreach ($value as $key => $item) {
        $nextPrefix = $prefix === "" ? (string)$key : $prefix . "." . (string)$key;
        DDM_flattenStatusItems($item, $nextPrefix, $output);
    }
}

function DDM_statusLabel($key)
{
    foreach (DDM_statusCatalog() as $item) {
        if ($item["key"] === $key) {
            return $item["label"];
        }
    }
    $parts = explode(".", $key);
    $shortParts = array_slice($parts, max(0, count($parts) - 2));
    return ucwords(str_replace(["-", "_"], " ", implode(" ", $shortParts)));
}

function DDM_simplifyState($state)
{
    if (!$state) {
        return [
            "enabled" => false,
            "lastTokenUpdate" => null,
            "lastDeclarationItemsRequest" => null,
            "lastStatusAt" => null,
            "enableCommandUUID" => null,
            "lastStatus" => [],
            "tokens" => [],
        ];
    }

    return [
        "enrollmentId" => $state["enrollmentId"] ?? "",
        "udid" => $state["udid"] ?? ($state["enrollmentId"] ?? ""),
        "enabled" => $state["ddm"]["enabled"] ?? false,
        "lastTokenUpdate" => $state["ddm"]["lastTokenUpdate"] ?? null,
        "lastDeclarationItemsRequest" => $state["ddm"]["lastDeclarationItemsRequest"] ?? null,
        "lastStatusAt" => $state["ddm"]["lastStatusAt"] ?? null,
        "enableCommandUUID" => $state["ddm"]["enableCommandUUID"] ?? null,
        "enableCommandSentAt" => $state["ddm"]["enableCommandSentAt"] ?? null,
        "enableCommandSucceeded" => $state["ddm"]["enableCommandSucceeded"] ?? null,
        "enableCommandError" => $state["ddm"]["enableCommandError"] ?? null,
        "lastStatus" => $state["ddm"]["lastStatus"] ?? [],
        "tokens" => $state["ddm"]["tokens"] ?? [],
    ];
}

function DDM_monitoringItems()
{
    $selected = DDM_selectedStatusItems();
    $catalog = DDM_statusCatalog();
    $output = [];

    foreach ($selected as $itemKey) {
        $catalogItem = null;
        foreach ($catalog as $item) {
            if ($item["key"] === $itemKey) {
                $catalogItem = $item;
                break;
            }
        }

        $output[] = $catalogItem ?? [
            "key" => $itemKey,
            "label" => $itemKey,
            "group" => "Custom",
            "source" => "DDM status",
        ];
    }

    return $output;
}

function DDM_selectedStatusItems()
{
    global $MDMDDMDeclarations;

    $declaration = $MDMDDMDeclarations->findOne(["identifier" => "tds.management.status.v1"]);
    $items = $declaration["payload"]["StatusItems"] ?? null;
    if ($items instanceof Traversable) {
        $items = iterator_to_array($items);
    }
    if (is_array($items)) {
        $items = array_map(function ($item) {
            if ($item instanceof Traversable) {
                $item = iterator_to_array($item);
            }
            return is_array($item) ? ($item["Name"] ?? "") : $item;
        }, $items);
        $items = array_values(array_filter($items, function ($item) {
            return is_string($item) && $item !== "";
        }));
        $validItems = array_column(DDM_statusCatalog(), "key");
        $items = array_values(array_filter($items, function ($item) use ($validItems) {
            return in_array($item, $validItems, true);
        }));
    }
    if (is_array($items) && count($items) > 0) {
        return array_values(array_unique($items));
    }
    return [
        "device.identifier.serial-number",
        "device.model.family",
        "device.operating-system.version",
        "management.declarations",
        "management.client-capabilities",
    ];
}

function DDM_statusCatalog()
{
    $keys = [
        "account.list.caldav", "account.list.carddav", "account.list.exchange", "account.list.google",
        "account.list.ldap", "account.list.mail.incoming", "account.list.mail.outgoing", "account.list.subscribed-calendar",
        "app.managed.list", "device.identifier.serial-number", "device.identifier.udid", "device.model.family",
        "device.model.identifier", "device.model.marketing-name", "device.model.number", "device.operating-system.build-version",
        "device.operating-system.family", "device.operating-system.marketing-name", "device.operating-system.supplemental.build-version",
        "device.operating-system.supplemental.extra-version", "device.operating-system.version", "device.power.battery-health",
        "diskmanagement.filevault.enabled", "management.client-capabilities", "management.declarations", "mdm.app",
        "migration-assistant.report", "migration-assistant.state", "package.list", "passcode.is-compliant", "passcode.is-present",
        "screensharing.connection.group.unresolved-connection", "security.certificate.list", "services.background-task",
        "softwareupdate.beta-enrollment", "softwareupdate.device-id", "softwareupdate.failure-reason",
        "softwareupdate.install-reason", "softwareupdate.install-state", "softwareupdate.pending-version",
    ];

    return array_map(function ($key) {
        $prefix = explode(".", $key)[0];
        $groups = [
            "account" => "Accounts", "app" => "Apps", "device" => "Device", "diskmanagement" => "Security",
            "management" => "Management", "mdm" => "Management", "migration-assistant" => "Migration Assistant",
            "package" => "Apps", "passcode" => "Security", "screensharing" => "Screen Sharing",
            "security" => "Security", "services" => "Services", "softwareupdate" => "Software Update",
        ];
        $label = ucwords(str_replace([".", "-"], " ", $key));
        return ["key" => $key, "label" => $label, "group" => $groups[$prefix] ?? "Device", "source" => "Apple device-management 26.4"];
    }, $keys);
}

function DDM_updateDeviceState($enrollmentId, $set)
{
    global $MDMDDMDeviceState;

    if (!$enrollmentId) {
        $enrollmentId = "unknown";
    }

    $set["enrollmentId"] = $enrollmentId;
    $set["updatedAt"] = time();
    $MDMDDMDeviceState->updateOne(
        ["enrollmentId" => $enrollmentId],
        ['$set' => $set],
        ["upsert" => true]
    );
}

function DDM_enrollmentId()
{
    if (isset($_SERVER["HTTP_X_ENROLLMENT_ID"])) {
        return $_SERVER["HTTP_X_ENROLLMENT_ID"];
    }
    if (isset($_SERVER["HTTP_X_MICROMDM_UDID"])) {
        return $_SERVER["HTTP_X_MICROMDM_UDID"];
    }
    if (isset($_GET["udid"])) {
        return $_GET["udid"];
    }
    return "unknown";
}

function DDM_normalizeBody($postdata)
{
    if (is_array($postdata)) {
        return $postdata;
    }
    if (is_string($postdata) && trim($postdata) !== "") {
        $json = json_decode($postdata, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $json;
        }
        return ["raw" => $postdata];
    }
    return [];
}

function DDM_declarativeManagementCommand($uuid, $enrollmentId = null)
{
    $plist = new CFPropertyList();
    $root = new CFDictionary();
    $command = new CFDictionary();
    $command->add("RequestType", new CFString("DeclarativeManagement"));
    $tokens = json_encode(DDM_synchronizationTokensForEnrollment($enrollmentId ?: "unknown"), JSON_UNESCAPED_SLASHES);
    $command->add("Data", new CFData(base64_encode($tokens), true));
    $root->add("Command", $command);
    $root->add("CommandUUID", new CFString($uuid));
    $plist->add($root);
    return $plist->toXML();
}
