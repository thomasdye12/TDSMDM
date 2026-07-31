<?php

function AppProvisioning_plainArray($value)
{
    if ($value instanceof MongoDB\Model\BSONDocument || $value instanceof MongoDB\Model\BSONArray) {
        $value = $value->getArrayCopy();
    }
    if ($value instanceof Traversable) {
        $value = iterator_to_array($value);
    }
    if (is_array($value)) {
        foreach ($value as $key => $item) {
            $value[$key] = AppProvisioning_plainArray($item);
        }
    }
    return $value;
}

function AppProvisioning_decodeCmsFile($path)
{
    if (!is_file($path) || !is_readable($path)) {
        return ["error" => "The provisioning profile could not be read"];
    }

    $security = "/usr/bin/security";
    if (!is_executable($security) || !function_exists("exec")) {
        return ["error" => "CMS profile verification is unavailable on this server"];
    }

    $output = [];
    $status = 1;
    exec($security . " cms -D -i " . escapeshellarg($path) . " 2>/dev/null", $output, $status);
    if ($status !== 0 || empty($output)) {
        return ["error" => "The file is not a valid signed Apple provisioning profile"];
    }

    $xml = implode("\n", $output);
    try {
        $plist = new CFPropertyList();
        $plist->parse($xml);
        $decoded = AppProvisioning_plainArray($plist->toArray());
    } catch (Throwable $exception) {
        return ["error" => "The signed provisioning profile payload could not be parsed"];
    }

    if (!is_array($decoded) || empty($decoded["UUID"]) || empty($decoded["Entitlements"])) {
        return ["error" => "The provisioning profile is missing required Apple metadata"];
    }

    return ["raw" => file_get_contents($path), "decoded" => $decoded];
}

function AppProvisioning_decodeCmsBytes($raw)
{
    $temporaryPath = tempnam(sys_get_temp_dir(), "tds-provision-");
    if ($temporaryPath === false) {
        return ["error" => "Could not create a temporary profile file"];
    }

    try {
        if (file_put_contents($temporaryPath, $raw) === false) {
            return ["error" => "Could not prepare the provisioning profile for validation"];
        }
        return AppProvisioning_decodeCmsFile($temporaryPath);
    } finally {
        if (is_file($temporaryPath)) {
            unlink($temporaryPath);
        }
    }
}

function AppProvisioning_profileType($profile)
{
    if (!empty($profile["ProvisionsAllDevices"])) {
        return "in-house";
    }
    if (!empty($profile["ProvisionedDevices"])) {
        return !empty($profile["Entitlements"]["get-task-allow"]) ? "development" : "ad-hoc";
    }
    return "app-store";
}

function AppProvisioning_applicationIdentifier($profile)
{
    $entitlements = $profile["Entitlements"] ?? [];
    return $entitlements["application-identifier"] ?? ($entitlements["com.apple.application-identifier"] ?? "");
}

function AppProvisioning_bundlePattern($profile)
{
    $identifier = AppProvisioning_applicationIdentifier($profile);
    $separator = strpos($identifier, ".");
    return $separator === false ? "" : substr($identifier, $separator + 1);
}

function AppProvisioning_bundleMatches($bundleIdentifier, $pattern)
{
    if ($bundleIdentifier === "" || $pattern === "") {
        return false;
    }
    if ($pattern === $bundleIdentifier) {
        return true;
    }
    if (substr($pattern, -2) === ".*") {
        return strpos($bundleIdentifier, substr($pattern, 0, -1)) === 0;
    }
    return false;
}

function AppProvisioning_certificateFingerprints($profile)
{
    $fingerprints = [];
    foreach (($profile["DeveloperCertificates"] ?? []) as $certificate) {
        $decoded = base64_decode((string)$certificate, true);
        $bytes = $decoded === false ? (string)$certificate : $decoded;
        $fingerprints[] = hash("sha256", $bytes);
    }
    return array_values(array_unique($fingerprints));
}

function AppProvisioning_publicMetadata($profile)
{
    $metadata = $profile;
    unset($metadata["DeveloperCertificates"]);
    unset($metadata["DER-Encoded-Profile"]);
    $metadata["ProfileType"] = AppProvisioning_profileType($profile);
    $metadata["BundlePattern"] = AppProvisioning_bundlePattern($profile);
    return $metadata;
}

function AppProvisioning_extractEmbeddedProfile($app)
{
    $relativePath = (string)($app["path"] ?? "");
    $ipaPath = rtrim($GLOBALS["appDir"], "/") . "/" . ltrim($relativePath, "/");
    if (!is_file($ipaPath)) {
        return ["error" => "The stored IPA could not be found for certificate comparison"];
    }

    $zip = new ZipArchive();
    if ($zip->open($ipaPath) !== true) {
        return ["error" => "The stored IPA could not be opened"];
    }

    $raw = false;
    for ($index = 0; $index < $zip->numFiles; $index++) {
        $name = $zip->getNameIndex($index);
        if (preg_match('#^Payload/[^/]+\.app/embedded\.mobileprovision$#', $name)) {
            $raw = $zip->getFromIndex($index);
            break;
        }
    }
    $zip->close();

    if ($raw === false) {
        return ["error" => "The stored IPA has no embedded provisioning profile"];
    }
    return AppProvisioning_decodeCmsBytes($raw);
}

function AppProvisioning_findApp($id)
{
    global $MDMApps;
    try {
        return $MDMApps->findOne(["_id" => new MongoDB\BSON\ObjectId($id)]);
    } catch (Throwable $exception) {
        return null;
    }
}

function AppProvisioning_validateForApp($app, $newProfile)
{
    $errors = [];
    $warnings = [];
    $bundleIdentifier = (string)($app["CFBundleIdentifier"] ?? "");
    $bundlePattern = AppProvisioning_bundlePattern($newProfile);

    if (!AppProvisioning_bundleMatches($bundleIdentifier, $bundlePattern)) {
        $errors[] = "Profile App ID " . ($bundlePattern ?: "(missing)") . " does not match " . ($bundleIdentifier ?: "(missing bundle ID)");
    }

    $expiration = (int)($newProfile["ExpirationDate"] ?? 0);
    if ($expiration <= time()) {
        $errors[] = "The provisioning profile has expired";
    }

    $profileType = AppProvisioning_profileType($newProfile);
    if ($profileType === "app-store") {
        $errors[] = "App Store profiles cannot authorize direct MDM installation";
    }

    $embedded = AppProvisioning_extractEmbeddedProfile($app);
    if (isset($embedded["error"])) {
        $errors[] = $embedded["error"];
    } else {
        $oldProfile = $embedded["decoded"];
        $oldTeam = (array)($oldProfile["TeamIdentifier"] ?? []);
        $newTeam = (array)($newProfile["TeamIdentifier"] ?? []);
        if (!empty($oldTeam) && !empty($newTeam) && empty(array_intersect($oldTeam, $newTeam))) {
            $errors[] = "The new profile belongs to a different Apple Developer team";
        }

        $oldCertificates = AppProvisioning_certificateFingerprints($oldProfile);
        $newCertificates = AppProvisioning_certificateFingerprints($newProfile);
        if (empty($oldCertificates) || empty($newCertificates)) {
            $errors[] = "Signing-certificate compatibility could not be established";
        } elseif (empty(array_intersect($oldCertificates, $newCertificates))) {
            $errors[] = "The new profile does not contain the certificate that signed the stored IPA";
        }

        $oldEntitlements = $oldProfile["Entitlements"] ?? [];
        $newEntitlements = $newProfile["Entitlements"] ?? [];
        foreach (["com.apple.developer.team-identifier", "keychain-access-groups"] as $entitlement) {
            if (isset($oldEntitlements[$entitlement]) && !isset($newEntitlements[$entitlement])) {
                $warnings[] = "The new profile does not include entitlement " . $entitlement;
            }
        }
    }

    return [
        "valid" => empty($errors),
        "errors" => $errors,
        "warnings" => $warnings,
        "profileType" => $profileType,
    ];
}

function AppProvisioning_safeProfileDocument($profile)
{
    if (!$profile) {
        return null;
    }
    return [
        "id" => (string)$profile["_id"],
        "appId" => (string)$profile["appId"],
        "profileUuid" => $profile["profileUuid"],
        "metadata" => AppProvisioning_plainArray($profile["metadata"] ?? []),
        "uploadedAt" => $profile["uploadedAt"] ?? null,
        "uploadedBy" => $profile["uploadedBy"] ?? null,
        "validation" => AppProvisioning_plainArray($profile["validation"] ?? []),
    ];
}

function AppProvisioning_get($id, $userinfo)
{
    global $MDMProvisioningProfiles, $MDMProvisioningDeployments;
    $app = AppProvisioning_findApp($id);
    if (!$app) {
        return ["error" => "App not found"];
    }

    $current = null;
    if (!empty($app["currentProvisioningProfileId"])) {
        try {
            $current = $MDMProvisioningProfiles->findOne([
                "_id" => new MongoDB\BSON\ObjectId((string)$app["currentProvisioningProfileId"]),
            ]);
        } catch (Throwable $exception) {
            $current = null;
        }
    }

    $recent = [];
    if ($current) {
        $cursor = $MDMProvisioningDeployments->find(
            ["profileId" => (string)$current["_id"]],
            ["sort" => ["createdAt" => -1], "limit" => 250]
        );
        foreach ($cursor as $deployment) {
            $recent[] = [
                "udid" => $deployment["udid"],
                "status" => $deployment["status"],
                "message" => $deployment["message"] ?? null,
                "createdAt" => $deployment["createdAt"],
                "updatedAt" => $deployment["updatedAt"] ?? null,
            ];
        }
    }

    return [
        "current" => AppProvisioning_safeProfileDocument($current),
        "embedded" => AppProvisioning_plainArray($app["embeddedMobileprovision"] ?? ($app["mobileprovision"] ?? null)),
        "deployments" => $recent,
    ];
}

function AppProvisioning_upload($id, $otherinfo, $userinfo)
{
    global $MDMApps, $MDMProvisioningProfiles;
    $app = AppProvisioning_findApp($id);
    if (!$app) {
        return ["error" => "App not found"];
    }
    if (empty($_FILES["profile"])) {
        return ["error" => "No provisioning profile was uploaded"];
    }

    $file = $_FILES["profile"];
    if (($file["error"] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return ["error" => "The provisioning profile upload failed"];
    }
    if (($file["size"] ?? 0) <= 0 || $file["size"] > 2 * 1024 * 1024) {
        return ["error" => "Provisioning profiles must be smaller than 2 MB"];
    }

    $decodedResult = AppProvisioning_decodeCmsFile($file["tmp_name"]);
    if (isset($decodedResult["error"])) {
        return ["error" => $decodedResult["error"]];
    }

    $profile = $decodedResult["decoded"];
    $validation = AppProvisioning_validateForApp($app, $profile);
    if (!$validation["valid"]) {
        return [
            "error" => "The provisioning profile is not compatible with this app",
            "validation" => $validation,
            "metadata" => AppProvisioning_publicMetadata($profile),
        ];
    }

    $appId = (string)$app["_id"];
    $profileUuid = (string)$profile["UUID"];
    $document = [
        "appId" => $appId,
        "profileUuid" => $profileUuid,
        "metadata" => AppProvisioning_publicMetadata($profile),
        "certificateFingerprints" => AppProvisioning_certificateFingerprints($profile),
        "contents" => base64_encode($decodedResult["raw"]),
        "validation" => $validation,
        "uploadedAt" => time(),
        "uploadedBy" => $userinfo["GeneratedUID"] ?? null,
    ];

    $existing = $MDMProvisioningProfiles->findOne(["appId" => $appId, "profileUuid" => $profileUuid]);
    if ($existing) {
        $MDMProvisioningProfiles->updateOne(["_id" => $existing["_id"]], ['$set' => $document]);
        $profileId = $existing["_id"];
    } else {
        $insert = $MDMProvisioningProfiles->insertOne($document);
        $profileId = $insert->getInsertedId();
    }

    $metadata = $document["metadata"];
    $MDMApps->updateOne(
        ["_id" => $app["_id"]],
        ['$set' => [
            "currentProvisioningProfileId" => (string)$profileId,
            "mobileprovision" => $metadata,
            "provisioningUpdatedAt" => time(),
        ]]
    );

    $document["_id"] = $profileId;
    return [
        "success" => true,
        "profile" => AppProvisioning_safeProfileDocument($document),
    ];
}

function AppProvisioning_buildInstallCommand($rawProfile)
{
    $plist = new CFPropertyList();
    $root = new CFDictionary();
    $command = new CFDictionary();
    $command->add("ProvisioningProfile", new CFData(base64_encode($rawProfile), true));
    $command->add("RequestType", new CFString("InstallProvisioningProfile"));
    $root->add("Command", $command);
    $uuid = createProfileUUID();
    $root->add("CommandUUID", new CFString($uuid));
    $plist->add($root);
    return ["uuid" => $uuid, "xml" => $plist->toXML()];
}

function AppProvisioning_deploy($id, $postdata, $userinfo)
{
    global $MDMProvisioningProfiles, $MDMProvisioningDeployments, $MDMEventQueue;
    $app = AppProvisioning_findApp($id);
    if (!$app) {
        return ["error" => "App not found"];
    }
    if (empty($app["currentProvisioningProfileId"])) {
        return ["error" => "Upload and validate a provisioning profile first"];
    }

    try {
        $profile = $MDMProvisioningProfiles->findOne([
            "_id" => new MongoDB\BSON\ObjectId((string)$app["currentProvisioningProfileId"]),
        ]);
    } catch (Throwable $exception) {
        $profile = null;
    }
    if (!$profile || empty($profile["contents"])) {
        return ["error" => "The current provisioning profile could not be loaded"];
    }

    $deviceUdids = array_values(array_unique(array_filter((array)($postdata["deviceUdids"] ?? []), "is_string")));
    if (empty($deviceUdids)) {
        return ["error" => "Select at least one device"];
    }
    if (count($deviceUdids) > 500) {
        return ["error" => "A maximum of 500 devices can be updated at once"];
    }

    $metadata = AppProvisioning_plainArray($profile["metadata"] ?? []);
    if ((int)($metadata["ExpirationDate"] ?? 0) <= time()) {
        return ["error" => "The current provisioning profile has expired"];
    }
    $eligible = array_flip((array)($metadata["ProvisionedDevices"] ?? []));
    $allDevices = !empty($metadata["ProvisionsAllDevices"]);
    $ineligible = [];
    foreach ($deviceUdids as $udid) {
        if (!$allDevices && !isset($eligible[$udid])) {
            $ineligible[] = $udid;
        }
    }
    if (!empty($ineligible)) {
        return [
            "error" => "Some selected devices are not included in the provisioning profile",
            "ineligibleDeviceUdids" => $ineligible,
        ];
    }

    $rawProfile = base64_decode($profile["contents"], true);
    if ($rawProfile === false) {
        return ["error" => "The stored provisioning profile is corrupt"];
    }

    $queued = [];
    $failed = [];
    foreach ($deviceUdids as $udid) {
        $payload = AppProvisioning_buildInstallCommand($rawProfile);
        $result = Core_sendDeviceCommandV2RawData($udid, $payload["uuid"], $payload["xml"]);
        $commandUuid = is_array($result) ? ($result["payload"]["command_uuid"] ?? $payload["uuid"]) : $payload["uuid"];
        $hasError = !is_array($result) || isset($result["error"]) || (($result["status"] ?? null) === "failed");
        $status = $hasError ? "Error" : "Queued";
        $message = is_array($result) ? ($result["error"] ?? null) : "MicroMDM returned an invalid response";

        $MDMProvisioningDeployments->insertOne([
            "commandUuid" => $commandUuid,
            "profileId" => (string)$profile["_id"],
            "appId" => (string)$app["_id"],
            "profileUuid" => $profile["profileUuid"],
            "udid" => $udid,
            "status" => $status,
            "message" => $message,
            "createdAt" => time(),
            "createdBy" => $userinfo["GeneratedUID"] ?? null,
        ]);

        $MDMEventQueue->updateOne(
            ["command_uuid" => $commandUuid],
            ['$set' => [
                "context" => [
                    "type" => "provisioning-profile",
                    "appId" => (string)$app["_id"],
                    "profileId" => (string)$profile["_id"],
                    "profileUuid" => $profile["profileUuid"],
                ],
            ]]
        );

        if ($hasError) {
            $failed[] = ["udid" => $udid, "message" => $message ?: "Command failed"];
        } else {
            $queued[] = $udid;
        }
    }

    return [
        "success" => empty($failed),
        "queuedDeviceUdids" => $queued,
        "failed" => $failed,
    ];
}

function AppProvisioning_updateDeploymentStatus($commandUuid, $status, $message = null)
{
    global $MDMProvisioningDeployments;
    $fields = [
        "status" => $status,
        "updatedAt" => time(),
    ];
    if ($message !== null && $message !== "") {
        $fields["message"] = $message;
    }
    $MDMProvisioningDeployments->updateOne(
        ["commandUuid" => $commandUuid],
        ['$set' => $fields]
    );
}
