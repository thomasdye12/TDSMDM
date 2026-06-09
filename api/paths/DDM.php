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

function DDM_ensureManagementDeclaration()
{
    DDM_upsertDeclaration([
        "identifier" => "tds.management.status.v1",
        "type" => "com.apple.management.status-subscriptions",
        "category" => "Management",
        "payload" => [
            "StatusItems" => [
                "device.identifier.serial-number",
                "device.model.family",
                "device.operating-system.version",
                "management.declarations",
                "management.push-token",
            ],
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

