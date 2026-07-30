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

    return DDM_declarationItemsForEnrollment($enrollmentId);
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
    global $MDMDDMStatusReports;

    $enrollmentId = DDM_enrollmentId();
    $body = DDM_normalizeBody($postdata);
    $report = [
        "enrollmentId" => $enrollmentId,
        "receivedAt" => time(),
        "body" => $body,
        "raw" => is_string($postdata) ? $postdata : null,
    ];
    $MDMDDMStatusReports->insertOne($report);

    DDM_updateDeviceState($enrollmentId, [
        "ddm.lastStatusAt" => time(),
        "ddm.lastStatus" => $body,
        "ddm.enabled" => true,
    ]);

    return ["Acknowledged" => true];
}

function DDM_Service_declaration($type, $identifier, $postdata = null)
{
    global $MDMDDMDeclarations;

    $declaration = $MDMDDMDeclarations->findOne([
        "type" => $type,
        "identifier" => $identifier,
    ]);

    if (!$declaration) {
        http_response_code(404);
        return ["error" => "Declaration not found"];
    }

    return DDM_publicDeclaration($declaration);
}

function DDM_Admin_summary($userinfo)
{
    global $MDMdevices, $MDMDDMDeclarations, $MDMDDMDeviceState, $MDMDDMStatusReports;

    return [
        "serviceUrl" => "https://" . $GLOBALS["hostName"] . "/TDSapi/core/v1/ddm",
        "recommendedMicroMdmFlag" => "-dm https://" . $GLOBALS["hostName"] . "/TDSapi/core/v1/ddm/",
        "counts" => [
            "devices" => $MDMdevices->countDocuments(),
            "ddmEnabledDevices" => $MDMDDMDeviceState->countDocuments(["ddm.enabled" => true]),
            "declarations" => $MDMDDMDeclarations->countDocuments(),
            "activeDeclarations" => $MDMDDMDeclarations->countDocuments(["active" => true]),
            "statusReports" => $MDMDDMStatusReports->countDocuments(),
        ],
        "recentDevices" => DDM_recentDeviceStates(),
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

    return [
        "success" => true,
        "selected" => $cleanItems,
        "updatedAt" => time(),
    ];
}

function DDM_Admin_deviceState($udid, $userinfo)
{
    global $MDMDDMDeviceState, $MDMDDMStatusReports;

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

    return [
        "udid" => $udid,
        "state" => DDM_simplifyState($state),
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
    $uuid = createProfileUUID();
    $xml = DDM_declarativeManagementCommand($uuid);
    $result = Core_sendDeviceCommandV2RawData($udid, $uuid, $xml);

    DDM_updateDeviceState($udid, [
        "udid" => $udid,
        "ddm.enableCommandUUID" => $uuid,
        "ddm.enableCommandSentAt" => time(),
        "ddm.requestedBy" => $userinfo["GeneratedUID"] ?? null,
    ]);

    return [
        "success" => !isset($result["error"]),
        "commandUUID" => $uuid,
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
    ];
}

function DDM_syncProfiles()
{
    global $MDMProfiles;

    $count = 0;
    $profiles = $MDMProfiles->find();
    foreach ($profiles as $profile) {
        if (!isset($profile["PayloadUUID"])) {
            continue;
        }

        $payload = [
            "PayloadUUID" => $profile["PayloadUUID"],
            "PayloadIdentifier" => $profile["PayloadIdentifier"] ?? "",
            "PayloadDisplayName" => $profile["PayloadDisplayName"] ?? "Profile",
            "ProfileURL" => "https://" . $GLOBALS["hostName"] . "/TDSapi/v1/profiles/" . $profile["PayloadUUID"] . "/downloadXML",
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

    $count = 0;
    $apps = $MDMApps->find();
    foreach ($apps as $app) {
        if (!isset($app["_id"]) || !isset($app["CFBundleIdentifier"])) {
            continue;
        }

        $appId = (string)$app["_id"];
        $payload = [
            "BundleIdentifier" => $app["CFBundleIdentifier"],
            "DisplayName" => $app["CFBundleDisplayName"] ?? ($app["name"] ?? $app["CFBundleIdentifier"]),
            "ManifestURL" => "https://" . $GLOBALS["hostName"] . "/TDSapi/v1/system/apps/download/" . $appId,
            "Version" => $app["CFBundleShortVersionString"] ?? "",
            "ManagementFlags" => 1,
            "Removable" => false,
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
        "type" => "com.apple.management.status-subscriptions",
        "category" => "Management",
        "payload" => [
            "StatusItems" => $statusItems,
        ],
        "sourceType" => "system",
        "sourceId" => "status-subscriptions",
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
    if (strpos($type, "activation") !== false) {
        return "Activations";
    }
    if (strpos($type, "asset") !== false) {
        return "Assets";
    }
    if (strpos($type, "management") !== false) {
        return "Management";
    }
    return "Configurations";
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
    if (is_array($items) && count($items) > 0) {
        return array_values(array_unique($items));
    }
    if ($items instanceof Traversable) {
        return array_values(array_unique(iterator_to_array($items)));
    }

    return [
        "device.identifier.serial-number",
        "device.model.family",
        "device.operating-system.version",
        "management.declarations",
        "management.push-token",
    ];
}

function DDM_statusCatalog()
{
    return [
        ["key" => "device.identifier.serial-number", "label" => "Serial Number", "group" => "Device", "source" => "DDM status"],
        ["key" => "device.identifier.udid", "label" => "UDID", "group" => "Device", "source" => "DDM status"],
        ["key" => "device.model.family", "label" => "Device Family", "group" => "Device", "source" => "DDM status"],
        ["key" => "device.model.identifier", "label" => "Model Identifier", "group" => "Device", "source" => "DDM status"],
        ["key" => "device.operating-system.version", "label" => "OS Version", "group" => "OS", "source" => "DDM status"],
        ["key" => "device.operating-system.build-version", "label" => "Build Version", "group" => "OS", "source" => "DDM status"],
        ["key" => "device.operating-system.supplemental.build-version", "label" => "Supplemental Build", "group" => "OS", "source" => "DDM status"],
        ["key" => "device.operating-system.supplemental.extra-version", "label" => "Supplemental Extra Version", "group" => "OS", "source" => "DDM status"],
        ["key" => "management.declarations", "label" => "Declaration State", "group" => "Management", "source" => "DDM status"],
        ["key" => "management.push-token", "label" => "Management Push Token", "group" => "Management", "source" => "DDM status"],
        ["key" => "management.server-capabilities", "label" => "Server Capabilities", "group" => "Management", "source" => "DDM status"],
        ["key" => "passcode.is-compliant", "label" => "Passcode Compliant", "group" => "Security", "source" => "DDM status"],
        ["key" => "passcode.is-present", "label" => "Passcode Present", "group" => "Security", "source" => "DDM status"],
        ["key" => "diskmanagement.filevault.enabled", "label" => "FileVault Enabled", "group" => "Security", "source" => "DDM status"],
        ["key" => "account.list.local-admin", "label" => "Local Admin Accounts", "group" => "Accounts", "source" => "DDM status"],
        ["key" => "softwareupdate.pending-version", "label" => "Pending OS Version", "group" => "Software Update", "source" => "DDM status"],
        ["key" => "softwareupdate.install-state", "label" => "Software Update State", "group" => "Software Update", "source" => "DDM status"],
        ["key" => "softwareupdate.beta-enrollment", "label" => "Beta Enrollment", "group" => "Software Update", "source" => "DDM status"],
    ];
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

function DDM_declarativeManagementCommand($uuid)
{
    $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"></plist>');
    $dict = $xml->addChild("dict");
    $dict->addChild("key", "Command");
    $command = $dict->addChild("dict");
    $command->addChild("key", "RequestType");
    $command->addChild("string", "DeclarativeManagement");
    $dict->addChild("key", "CommandUUID");
    $dict->addChild("string", $uuid);

    return $xml->asXML();
}
