<?php





function Apps_get()
{
    global $MDMApps;
    $output = array();
    $apps = $MDMApps->find();
    foreach ($apps as $app) {
        $app["id"] = (string)$app["_id"];
        $app["lifecycleState"] = $app["lifecycleState"] ?? "active";
        $app["installSettings"] = Apps_normalizeInstallSettings($app["installSettings"] ?? null);
        $output[] = $app;
    }
    return  $output;
}

function Apps_setLifecycleState($id, $postdata, $userinfo)
{
    global $MDMApps;
    $allowedStates = ["active", "disabled", "archived"];
    $state = strtolower(trim((string)($postdata["state"] ?? "")));
    if (!in_array($state, $allowedStates, true)) {
        return ["error" => "State must be active, disabled, or archived"];
    }

    try {
        $appId = new MongoDB\BSON\ObjectId($id);
    } catch (Throwable $exception) {
        return ["error" => "Invalid app ID"];
    }

    $app = $MDMApps->findOne(["_id" => $appId]);
    if (!$app) {
        return ["error" => "App not found"];
    }

    $fields = [
        "lifecycleState" => $state,
        "lifecycleUpdatedAt" => time(),
        "lifecycleUpdatedBy" => $userinfo["GeneratedUID"] ?? null,
    ];
    if ($state === "archived") {
        $fields["archivedAt"] = time();
    } else {
        $fields["archivedAt"] = null;
    }

    $MDMApps->updateOne(["_id" => $appId], ['$set' => $fields]);
    return ["success" => true, "state" => $state];
}

function Apps_platformFamily($app)
{
    $platform = strtolower((string)($app["infolist"]["DTPlatformName"] ?? ""));
    if (strpos($platform, "appletv") !== false) {
        return "tvos";
    }
    if (strpos($platform, "xros") !== false || strpos($platform, "vision") !== false) {
        return "visionos";
    }
    if (strpos($platform, "macos") !== false) {
        return "macos";
    }
    return "ios";
}

function Apps_deviceFamily($device)
{
    $model = strtolower((string)(($device["ModelName"] ?? "") . " " . ($device["Model"] ?? "")));
    if (strpos($model, "apple tv") !== false || strpos($model, "appletv") !== false) {
        return "tvos";
    }
    if (strpos($model, "vision") !== false || strpos($model, "reality") !== false) {
        return "visionos";
    }
    if (strpos($model, "mac") !== false) {
        return "macos";
    }
    return "ios";
}

function Apps_isCompatibleWithDevice($app, $device)
{
    $reasons = [];
    $appFamily = Apps_platformFamily($app);
    $deviceFamily = Apps_deviceFamily($device);
    if ($appFamily !== $deviceFamily) {
        $reasons[] = "Requires " . $appFamily . "; device is " . $deviceFamily;
    }

    $minimumVersion = (string)($app["infolist"]["MinimumOSVersion"] ?? "");
    $deviceVersion = (string)($device["OSVersion"] ?? "");
    if ($minimumVersion !== "" && $deviceVersion !== "" && version_compare($deviceVersion, $minimumVersion, "<")) {
        $reasons[] = "Requires OS " . $minimumVersion . " or later";
    }

    $profile = Apps_toPlainArray($app["mobileprovision"] ?? []);
    $provisionsAll = !empty($profile["ProvisionsAllDevices"]);
    $provisionedDevices = (array)($profile["ProvisionedDevices"] ?? []);
    if (!$provisionsAll && !empty($provisionedDevices) && !in_array($device["udid"] ?? "", $provisionedDevices, true)) {
        $reasons[] = "Device is not in the provisioning profile";
    }
    if (!$provisionsAll && empty($provisionedDevices) && !empty($profile)) {
        $reasons[] = "Profile does not allow direct device installation";
    }

    return ["compatible" => empty($reasons), "reasons" => $reasons];
}

function Apps_defaultInstallSettings()
{
    return [
        "changeManagementState" => "Managed",
        "managementFlags" => 1,
        "iOSApp" => true,
        "attributes" => [
            "Removable" => [
                "type" => "boolean",
                "value" => false,
            ],
        ],
        "configuration" => [
            [
                "key" => "MDM-DevieID",
                "type" => "function",
                "function" => "deviceUdid",
            ],
        ],
    ];
}

function Apps_allowedInstallValueFunctions()
{
    return [
        "deviceUdid",
        "deviceName",
        "deviceId",
        "serialNumber",
        "model",
        "modelName",
        "osVersion",
        "userId",
        "userName",
        "userEmail",
        "appId",
        "appName",
        "appBundleIdentifier",
        "appVersion",
        "installTimestamp",
    ];
}

function Apps_toPlainArray($value)
{
    if ($value instanceof MongoDB\Model\BSONDocument || $value instanceof MongoDB\Model\BSONArray) {
        $value = $value->getArrayCopy();
    }

    if ($value instanceof Traversable) {
        $value = iterator_to_array($value);
    }

    if (is_array($value)) {
        foreach ($value as $key => $item) {
            $value[$key] = Apps_toPlainArray($item);
        }
    }

    return $value;
}

function Apps_installSettingFunctions()
{
    return [
        "functions" => Apps_allowedInstallValueFunctions(),
        "example" => [
            "key" => "DeviceSerial",
            "type" => "function",
            "function" => "serialNumber",
        ],
    ];
}

function Apps_sanitizeInstallKey($key)
{
    $key = trim((string)$key);
    if ($key === "" || strlen($key) > 128) {
        return null;
    }
    return $key;
}

function Apps_normalizeInstallValueEntry($entry, $key = null)
{
    $entry = Apps_toPlainArray($entry);
    if (!is_array($entry)) {
        $entry = ["value" => $entry];
    }

    if ($key !== null) {
        $entry["key"] = $key;
    }

    $entryKey = Apps_sanitizeInstallKey($entry["key"] ?? "");
    if ($entryKey === null) {
        return null;
    }

    $type = $entry["type"] ?? ($entry["valueType"] ?? null);
    if ($type === null || $type === "") {
        if (isset($entry["function"])) {
            $type = "function";
        } elseif (is_bool($entry["value"] ?? null)) {
            $type = "boolean";
        } elseif (is_int($entry["value"] ?? null)) {
            $type = "integer";
        } elseif (is_float($entry["value"] ?? null)) {
            $type = "real";
        } elseif (is_array($entry["value"] ?? null)) {
            $type = "dictionary";
        } else {
            $type = "string";
        }
    }

    $type = strtolower((string)$type);
    if ($type === "bool") {
        $type = "boolean";
    }
    if ($type === "int") {
        $type = "integer";
    }

    $allowedTypes = ["string", "boolean", "integer", "real", "array", "dictionary", "function"];
    if (!in_array($type, $allowedTypes, true)) {
        $type = "string";
    }

    $normalized = [
        "key" => $entryKey,
        "type" => $type,
    ];

    if ($type === "function") {
        $function = $entry["function"] ?? ($entry["value"] ?? "");
        if (!in_array($function, Apps_allowedInstallValueFunctions(), true)) {
            return null;
        }
        $normalized["function"] = $function;
        return $normalized;
    }

    $value = $entry["value"] ?? null;
    if ($type === "boolean") {
        $value = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $value = $value ?? false;
    } elseif ($type === "integer") {
        $value = (int)$value;
    } elseif ($type === "real") {
        $value = (float)$value;
    } elseif ($type === "array" || $type === "dictionary") {
        $value = is_array($value) ? $value : [];
    } else {
        $value = (string)$value;
    }

    $normalized["value"] = $value;
    return $normalized;
}

function Apps_normalizeInstallValueEntries($entries)
{
    $entries = Apps_toPlainArray($entries);
    $output = [];
    if (!is_array($entries)) {
        return $output;
    }

    foreach ($entries as $key => $entry) {
        $normalized = Apps_normalizeInstallValueEntry($entry, is_string($key) ? $key : null);
        if ($normalized !== null) {
            $output[] = $normalized;
        }
    }

    return $output;
}

function Apps_normalizeInstallSettings($settings)
{
    $settings = Apps_toPlainArray($settings);
    $defaults = Apps_defaultInstallSettings();
    if (!is_array($settings)) {
        return $defaults;
    }

    $normalized = $defaults;
    $state = $settings["changeManagementState"] ?? $defaults["changeManagementState"];
    $normalized["changeManagementState"] = in_array($state, ["Managed", "Unmanaged"], true) ? $state : "Managed";
    $normalized["managementFlags"] = isset($settings["managementFlags"]) ? (int)$settings["managementFlags"] : $defaults["managementFlags"];
    $normalized["iOSApp"] = isset($settings["iOSApp"]) ? (bool)$settings["iOSApp"] : $defaults["iOSApp"];

    if (isset($settings["attributes"])) {
        $attributes = Apps_normalizeInstallValueEntries($settings["attributes"]);
        $normalized["attributes"] = [];
        foreach ($attributes as $attribute) {
            if ($attribute["type"] === "function") {
                continue;
            }
            $normalized["attributes"][$attribute["key"]] = [
                "type" => $attribute["type"],
                "value" => $attribute["value"],
            ];
        }
        if (!isset($normalized["attributes"]["Removable"])) {
            $normalized["attributes"]["Removable"] = ["type" => "boolean", "value" => false];
        }
    }

    if (isset($settings["configuration"])) {
        $normalized["configuration"] = Apps_normalizeInstallValueEntries($settings["configuration"]);
    }

    return $normalized;
}

function Apps_saveInstallSettings($id, $postdata)
{
    global $MDMApps;

    try {
        $appId = new MongoDB\BSON\ObjectId($id);
    } catch (Exception $exception) {
        return ["error" => "Invalid app ID"];
    }

    $app = $MDMApps->findOne(["_id" => $appId]);
    if (!$app) {
        return ["error" => "App not found"];
    }

    $settings = Apps_normalizeInstallSettings($postdata["installSettings"] ?? $postdata);
    $MDMApps->updateOne(["_id" => $appId], ['$set' => ["installSettings" => $settings]]);

    return [
        "success" => true,
        "installSettings" => $settings,
    ];
}

function Apps_findUserForDevice($device)
{
    if (empty($device["userId"])) {
        return null;
    }

    $users = Users_listall();
    foreach ($users as $user) {
        if (($user["GUUID"] ?? null) === $device["userId"]) {
            return $user;
        }
    }

    return null;
}

function Apps_resolveInstallFunction($function, $appid, $app, $deviceid, $device, $user)
{
    switch ($function) {
        case "deviceUdid":
            return $deviceid;
        case "deviceName":
            return $device["DeviceName"] ?? "";
        case "deviceId":
            return $device["DeviceID"] ?? "";
        case "serialNumber":
            return $device["SerialNumber"] ?? "";
        case "model":
            return $device["Model"] ?? "";
        case "modelName":
            return $device["ModelName"] ?? "";
        case "osVersion":
            return $device["OSVersion"] ?? "";
        case "userId":
            return $device["userId"] ?? "";
        case "userName":
            return $user["FullName"] ?? ($user["name"] ?? ($user["DisplayName"] ?? ""));
        case "userEmail":
            return $user["EmailAddress"] ?? ($user["email"] ?? ($user["Email"] ?? ""));
        case "appId":
            return $appid;
        case "appName":
            return $app["CFBundleDisplayName"] ?? ($app["name"] ?? "");
        case "appBundleIdentifier":
            return $app["CFBundleIdentifier"] ?? "";
        case "appVersion":
            return $app["CFBundleShortVersionString"] ?? "";
        case "installTimestamp":
            return time();
    }

    return "";
}

function Apps_resolveInstallValueEntry($entry, $appid, $app, $deviceid, $device, $user)
{
    if (($entry["type"] ?? "") === "function") {
        $value = Apps_resolveInstallFunction($entry["function"] ?? "", $appid, $app, $deviceid, $device, $user);
        if (is_int($value)) {
            return ["type" => "integer", "value" => $value];
        }
        if (is_float($value)) {
            return ["type" => "real", "value" => $value];
        }
        if (is_bool($value)) {
            return ["type" => "boolean", "value" => $value];
        }
        if (is_array($value)) {
            return ["type" => "dictionary", "value" => $value];
        }
        return ["type" => "string", "value" => (string)$value];
    }

    return [
        "type" => $entry["type"] ?? "string",
        "value" => $entry["value"] ?? "",
    ];
}

function Apps_valueToCFType($type, $value)
{
    $type = strtolower((string)$type);
    if ($type === "boolean" || $type === "bool") {
        return new CFBoolean((bool)$value);
    }
    if ($type === "integer" || $type === "int") {
        return new CFNumber((int)$value);
    }
    if ($type === "real" || $type === "float") {
        return new CFNumber((float)$value);
    }
    if ($type === "array") {
        $array = new CFArray();
        foreach ((array)$value as $item) {
            $array->add(Apps_phpValueToCFType($item));
        }
        return $array;
    }
    if ($type === "dictionary") {
        return Apps_dictionaryToCFType((array)$value);
    }

    return new CFString((string)$value);
}

function Apps_phpValueToCFType($value)
{
    if (is_bool($value)) {
        return new CFBoolean($value);
    }
    if (is_int($value) || is_float($value)) {
        return new CFNumber($value);
    }
    if (is_array($value)) {
        $isList = array_keys($value) === range(0, count($value) - 1);
        if ($isList) {
            $array = new CFArray();
            foreach ($value as $item) {
                $array->add(Apps_phpValueToCFType($item));
            }
            return $array;
        }
        return Apps_dictionaryToCFType($value);
    }

    return new CFString((string)$value);
}

function Apps_dictionaryToCFType($value)
{
    $dictionary = new CFDictionary();
    foreach ((array)$value as $key => $item) {
        $cleanKey = Apps_sanitizeInstallKey($key);
        if ($cleanKey !== null) {
            $dictionary->add($cleanKey, Apps_phpValueToCFType($item));
        }
    }
    return $dictionary;
}

// Apps_upload will upload a file 

function Apps_upload($otherinfo, $userinfo)
{
    global $MDMApps;

    if (isset($_FILES['app'])) {
        $file = $_FILES['app'];
        $app = Apps_ProcessUpload($file, $userinfo);
        if (isset($app["error"])) {
            return ["error" => $app["error"]];
        }

        $plistinfo = Apps_processInfoPlist($app["info"]);
        $app["path"] = str_replace($GLOBALS["appDir"] . "/", "", $app["path"]);
        $app["icon"] = Apps_getIcon($app["unzipped"], $plistinfo["CFBundleIdentifier"]);
        $app["CFBundleDisplayName"] = $plistinfo["CFBundleDisplayName"] ?? "";
        $app["CFBundleIdentifier"] = $plistinfo["CFBundleIdentifier"] ?? "";
        $app["CFBundleShortVersionString"] = $plistinfo["CFBundleShortVersionString"];
        $app["infolist"] = $plistinfo;

        if ($app["mobileprovision"] != false) {
            $app["mobileprovision"] = Apps_processMobileProvision($app["mobileprovision"]);
            $app["embeddedMobileprovision"] = $app["mobileprovision"];
        }
        $app["currentProvisioningProfileId"] = null;

        Apps_removeUnzipped($app["unzipped"]);
        unset($app["unzipped"]);
        unset($app["info"]);

        // Add customVersion (timestamp)
        $app["customVersion"] = time();

        // Check if the app already exists in the DB
        // $appdb = $MDMApps->findOne(["CFBundleIdentifier" => $app["CFBundleIdentifier"]]);
        // add a check for DTPlatformName to make sure the app is for the same platform
        $appdb = $MDMApps->findOne(["CFBundleIdentifier" => $app["CFBundleIdentifier"], "infolist.DTPlatformName" => $app["infolist"]["DTPlatformName"]]);
        $app["installSettings"] = Apps_normalizeInstallSettings($appdb["installSettings"] ?? null);

        if ($appdb) {
            $app["_id"] = $appdb["_id"];

            $updateFields = [];
            foreach ($app as $key => $value) {
                if (!isset($appdb[$key]) || $appdb[$key] !== $value) {
                    $updateFields[$key] = $value;
                }
            }

            if (!empty($updateFields)) {
                $MDMApps->updateOne(
                    ["_id" => $app["_id"]],
                    ['$set' => $updateFields]
                );
            }
        } else {
            $insertResult = $MDMApps->insertOne($app);
            $app["_id"] = $insertResult->getInsertedId();
        }

        $installedDevices = ($appdb && isset($appdb["devices"])) ? $appdb["devices"] : [];
        $appid = (string)$app["_id"];
        foreach ($installedDevices as $device) {


            Apps_pushToDevice($appid, $app, $device);
        }

        return $app;
    }

    return ["error" => "No file uploaded"];
}


// function to handle the core upload and proecesing of the App file .ipa, 
// we will need to proecess it, unzip it, and then get the info.plist file from the payload folder then we can use that for the info we need about the file for the server to 
// create the manifest file for the app to be installed on the device.

function Apps_ProcessUpload($file, $userinfo)
{
    // check that we have all the info we need
    if (!isset($file['name']) || !isset($file['size']) || !isset($file['type'])) {
        return ["error" => "Missing file info"];
    }
    $apparray = array("name" => $file['name'], "size" => $file['size'], "type" => $file['type'], "GUUID" => $userinfo["GeneratedUID"], "uploaded" => time());
    // move the file from the temp location to the app folder $GLOBALS["appDir"]
    $filename =  time() . "-" . uniqid() . ".ipa";
    $apparray["path"] = $GLOBALS["appDir"] . "/" . $filename;
    // check if the file is an ipa file
    if ($apparray["type"] != "application/octet-stream") {
        return ["error" => "File is not an ipa file"];
    }
    // move the file
    if (move_uploaded_file($file['tmp_name'], $apparray["path"])) {
        return Apps_Unzip($apparray, $filename);
    } else {
        return ["error" => "Could not move file"];
    }
}
// Apps_getInfoPlist
// this function will get the info.plist file from the payload folder of the unzipped ipa file

function Apps_getInfoPlist($path)
{
    $dir = $path . "/Payload";
    $files = scandir($dir);
    foreach ($files as $file) {
        if (strpos($file, ".app") !== false) {
            $appdir = $dir . "/" . $file;
            $appfiles = scandir($appdir);
            foreach ($appfiles as $appfile) {
                if (strpos($appfile, "Info.plist") !== false) {
                    $info = $appdir . "/" . $appfile;
                    return $info;
                }
            }
        }
    }
    return false;
}


function Apps_getmobileprovision($path)
{
    $dir = $path . "/Payload";
    $files = scandir($dir);
    foreach ($files as $file) {
        if (strpos($file, ".app") !== false) {
            $appdir = $dir . "/" . $file;
            $appfiles = scandir($appdir);
            foreach ($appfiles as $appfile) {
                if (strpos($appfile, "embedded.mobileprovision") !== false) {
                    $info = $appdir . "/" . $appfile;
                    return $info;
                }
            }
        }
    }
    return false;
}


function Apps_Unzip($apparray, $filename)
{
    // unzip the file
    $zip = new ZipArchive;
    if ($zip->open($apparray["path"]) === TRUE) {
        $zip->extractTo($GLOBALS["appDir"] . "/" . $filename . "-unzipped");
        $zip->close();
        // get the info.plist file
        $info = Apps_getInfoPlist($GLOBALS["appDir"] . "/" . $filename . "-unzipped");
        if ($info) {
            $apparray["unzipped"] = $GLOBALS["appDir"] . "/" . $filename . "-unzipped";
            $apparray["mobileprovision"] = Apps_getmobileprovision($apparray["unzipped"]);
            // get the app icon AppIcon60x60@2x.png
            $apparray["info"] = $info;
            return $apparray;
        } else {
            return ["error" => "Could not find info.plist file"];
        }
    } else {
        return ["error" => "Could not unzip file"];
    }
}


//  function to look at an uploaded app already,


function Apps_GetNewInfofromIPA($filename, $userinfo)
{

    global $MDMApps;


    $appdb = $MDMApps->find();

    foreach ($appdb as $app) {
        $apparray["path"] = $GLOBALS["appDir"] . "/" . $app["path"];

        $app = Apps_Unzip($apparray, $app["path"]);
        $plistinfo = Apps_processInfoPlist($app["info"]);
        // trim the $global["appDir"] from the path
        $app["path"] = str_replace($GLOBALS["appDir"] . "/", "", $app["path"]);
        // get the icon
        $app["icon"] = Apps_getIcon($app["unzipped"], $plistinfo["CFBundleIdentifier"]);
        $app["CFBundleDisplayName"] = $plistinfo["CFBundleDisplayName"] ?? ($plistinfo["CFBundleName"] ?? "");
        $app["CFBundleIdentifier"] = $plistinfo["CFBundleIdentifier"] ?? "";
        $app["CFBundleShortVersionString"] = $plistinfo["CFBundleShortVersionString"];
        $app["infolist"] = $plistinfo;
        $app["uploaded"] = time();
        $app["GUUID"] = $userinfo["GeneratedUID"];
        if ($app["mobileprovision"] != false) {
            $app["mobileprovision"] = Apps_processMobileProvision($app["mobileprovision"]);
        }
        Apps_removeUnzipped($app["unzipped"]);
        unset($app["unzipped"]);
        unset($app["info"]);
        $appdb = $MDMApps->findOne(["CFBundleIdentifier" => $app["CFBundleIdentifier"]]);
        if ($appdb) {
            $app["_id"] = $appdb["_id"];
            $MDMApps->replaceOne(["_id" => $app["_id"]], $app);
        } else {
            $MDMApps->insertOne($app);
        }
        // Apps_processMobileProvision($app["mobileprovision"]);
    }


    return     array("success" => "All apps updated");
}
// open the mobile provision file and get the info we need from it
function Apps_processMobileProvision($path)
{
    //   there will be fluff at the start and end need to trip that out to start with <?xml version="1.0" encoding="UTF-8", then ends with </plist> everthythign else nees to go 
    $file = file_get_contents($path);
    $start = strpos($file, "<?xml version=\"1.0\" encoding=\"UTF-8\"");
    $end = strpos($file, "</plist>");
    $file = substr($file, $start, $end - $start + 8);
    $plist = new CFPropertyList();
    $plist->parse($file);
    $plistArray = $plist->toArray();
    unset($plistArray["DeveloperCertificates"]);
    unset($plistArray["DER-Encoded-Profile"]);
    return $plistArray;
}







// process the plist file to get the info we need for the app

function Apps_processInfoPlist($path)
{
    $plist = new CFPropertyList($path);
    $plistArray = $plist->toArray();

    return $plistArray;
}

// function to remove the unzipped folder after we have gotten the info.plist file
function Apps_removeUnzipped($path)
{
    if (file_exists($path)) {
        $files = scandir($path);
        foreach ($files as $file) {
            if ($file != "." && $file != "..") {
                if (is_dir($path . "/" . $file)) {
                    Apps_removeUnzipped($path . "/" . $file);
                } else {
                    unlink($path . "/" . $file);
                }
            }
        }
        rmdir($path);
    }
}

//   Apps_getIcon move the app icon to the 


function Apps_getIcon($path, $bundle)
{
    $dir = $path . "/Payload";
    $files = scandir($dir);
    foreach ($files as $file) {
        if (strpos($file, ".app") !== false) {
            $appdir = $dir . "/" . $file;
            $appfiles = scandir($appdir);
            foreach ($appfiles as $appfile) {
                if (strpos($appfile, "AppIcon60x60@2x.png") !== false) {
                    $info = $appdir . "/" . $appfile;
                    return Apps_moveIcon($info, $bundle);
                }
                if (strpos($appfile, "60x60@2x.png") !== false) {
                    $info = $appdir . "/" . $appfile;
                    return Apps_moveIcon($info, $bundle);
                }
            }
        }
    }
    return false;
}

function Apps_moveIcon($path, $bundle)
{
    $filename = time() . "-" . $bundle . ".png";
    $newpath = $GLOBALS["AppiconsDir"] . "/" . $filename;
    if (copy($path, $newpath)) {
        return $filename;
    }
    return false;
}


// Apps_getImage
// this function will get the image for the app icon
function Apps_getImage($bundle)
{
    $icon = $GLOBALS["AppiconsDir"] . "/" . $bundle;
    if (file_exists($icon)) {
        header('Content-Type: image/png');
        readfile($icon);
    } else {
        header('Content-Type: image/png');
        readfile($GLOBALS["AppiconsDir"] . "/default.png");
    }
}

// Apps_Createmanifest 
// this function will create the manifest file for the app to be installed on the device

function Apps_Createmanifest($id)
{
    global $MDMApps;
    $app = $MDMApps->findOne(["_id" => new MongoDB\BSON\ObjectId($id)]);
    if ($app) {
        $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"></plist>');
        $app["path"] = str_replace(" ", "%20", $app["path"]);
        // Create the main structure
        $xml->addChild("dict");
        $dict = $xml->dict;
        $dict->addChild("key", "items");
        $dict->addChild("array");
        $array = $dict->array;
        $array->addChild("dict");
        $dict2 = $array->dict;

        // Add assets
        $dict2->addChild("key", "assets");
        $dict2->addChild("array");
        $assetsArray = $dict2->array;

        // First asset: software-package
        $assetsArray->addChild("dict");
        $assetDict1 = $assetsArray->dict;
        $assetDict1->addChild("key", "kind");
        $assetDict1->addChild("string", "software-package");
        $assetDict1->addChild("key", "url");
        $assetDict1->addChild("string", "https://".$GLOBALS["hostName"]."/TDSapi/files/apps/" . $app["path"]);

        if ($app["icon"] == "" || $app["icon"] == null) {
            $app["icon"] = "default.png";
        }

        // Second asset: display-image
        $assetsArray->addChild("dict");
        $assetDict2 = $assetsArray->dict[1];
        $assetDict2->addChild("key", "kind");
        $assetDict2->addChild("string", "display-image");
        $assetDict2->addChild("key", "url");
        $assetDict2->addChild("string", "https://".$GLOBALS["hostName"]."/TDSapi/files/icons/" . $app["icon"]);

        // Third asset: full-size-image
        $assetsArray->addChild("dict");
        $assetDict3 = $assetsArray->dict[2];

        $assetDict3->addChild("key", "kind");
        $assetDict3->addChild("string", "full-size-image");
        $assetDict3->addChild("key", "url");
        $assetDict3->addChild("string", "https://".$GLOBALS["hostName"]."/TDSapi/files/icons/" . $app["icon"]);

        // Add metadata
        $dict2->addChild("key", "metadata");
        $dict2->addChild("dict");
        $metadataDict = $dict2->dict;
        $metadataDict->addChild("key", "bundle-identifier");
        $metadataDict->addChild("string", $app["CFBundleIdentifier"]);
        $metadataDict->addChild("key", "bundle-version");
        $metadataDict->addChild("string", $app["CFBundleShortVersionString"]);
        $metadataDict->addChild("key", "kind");
        $metadataDict->addChild("string", "software");
        // $metadataDict->addChild("key", "platform-identifier");
        // $metadataDict->addChild("string", "com.apple.platform.iphoneos");
        // if the app has a display name use that, if not use the bundle id
        if ($app["CFBundleDisplayName"] == "" || $app["CFBundleDisplayName"] == null) {
            $app["CFBundleDisplayName"] = $app["CFBundleIdentifier"] ?? "unknown";
        }
        $metadataDict->addChild("key", "title");
        $metadataDict->addChild("string", $app["CFBundleDisplayName"]);
        // manifest-version
        $metadataDict->addChild("key", "manifest-version");
        $metadataDict->addChild("string", "1.0");

        // Set the header to XML and output the XML
        header('Content-type: text/xml');
        echo $xml->asXML();
    }
}

// Apps_pushToDevices


function  Apps_pushToDevices($postdata, $userinfo)
{
    global $MDMApps;
    if (empty($postdata["appId"]) || empty($postdata["deviceUdids"]) || !is_array($postdata["deviceUdids"])) {
        return ["error" => "An app and at least one device are required"];
    }
    try {
        $appId = new MongoDB\BSON\ObjectId($postdata["appId"]);
    } catch (Throwable $exception) {
        return ["error" => "Invalid app ID"];
    }
    $app = $MDMApps->findOne(["_id" => $appId]);
    if ($app) {
        $queued = [];
        $failed = [];
        foreach ($postdata["deviceUdids"] as $device) {
            $deviceid = $device;
            $result = Apps_pushToDevice($postdata["appId"], $app, $deviceid);
            if (isset($result["error"])) {
                $failed[] = ["udid" => $deviceid, "error" => $result["error"]];
                continue;
            }
            APNS_SendAPPNotifciation($device, $app);
            $MDMApps->updateOne(
                ["_id" => $appId],
                ['$addToSet' => ["devices" => $deviceid]]
            );
            $queued[] = $deviceid;
        }
        return [
            "success" => empty($failed),
            "queuedDeviceUdids" => $queued,
            "failed" => $failed,
        ];
    }
    return ["error" => "App not found"];
}


// function to actually push the app to the device
function Apps_pushToDevice($appid, $app, $deviceid)
{
    global $MDMdevices;

    if (($app["lifecycleState"] ?? "active") !== "active") {
        return ["error" => "Disabled or archived apps cannot be installed"];
    }

    $targetDevice = $MDMdevices->findOne(["udid" => $deviceid]);
    if (!$targetDevice) {
        return ["error" => "Device not found"];
    }
    $compatibility = Apps_isCompatibleWithDevice($app, $targetDevice);
    if (!$compatibility["compatible"]) {
        return ["error" => implode("; ", $compatibility["reasons"])];
    }

    // //  add a check if the device is a Mac, so we first remove the app from the device otherwise it will just add a copy of the app to the device
    // global $MDMdevices;
    // $cursor = $MDMdevices->findone(["udid" => $deviceid], ["projection" => ["DeviceName" => 1]]);
    // if ($cursor) {
    //     $device = $cursor;
    //     if (isset($device["DeviceName"]) && strpos($device["DeviceName"], "Mac") !== false) {
    //         // remove the app from the device
    //         $command = array("udid" => $deviceid, "request_type" => "RemoveApplication", "Identifier" => $app["CFBundleIdentifier"]);
    //         Core_sendDeviceCommandV2($command);
    //     }
    // }



    // A separately managed provisioning profile must reach the device before the
    // app install command. MicroMDM preserves command queue order for the device.
    if (!empty($app["currentProvisioningProfileId"]) && function_exists("AppProvisioning_deploy")) {
        $provisioningResult = AppProvisioning_deploy(
            $appid,
            ["deviceUdids" => [$deviceid]],
            ["GeneratedUID" => $GLOBALS["userinfo"]["GeneratedUID"] ?? "system"]
        );
        if (isset($provisioningResult["error"]) || !empty($provisioningResult["failed"])) {
            return [
                "error" => $provisioningResult["error"] ?? "Could not queue the provisioning profile for this device",
            ];
        }
    }

    // iOS uses OrganizationInfo for the name shown in the managed app prompt.
    // Queue it directly before the install so existing devices also pick up the
    // TDS MDM name without needing to be re-enrolled.
    $organizationResult = Core_sendOrganizationInfoCommand($deviceid, "TDS MDM");
    if (isset($organizationResult["error"])) {
        return [
            "error" => "Could not set the managed app prompt name: " . $organizationResult["error"],
        ];
    }

    $url = "https://".$GLOBALS["hostName"]."/TDSapi/v1/system/apps/download/" . $appid;
    $installSettings = Apps_normalizeInstallSettings($app["installSettings"] ?? null);
    $device = $targetDevice;
    $user = Apps_findUserForDevice($device);
    $data = array("udid" => $deviceid, "request_type" => "InstallApplication", "manifest_url" => $url, "management_flags" => $installSettings["managementFlags"], "change_management_state" => $installSettings["changeManagementState"], "iOSApp" => $installSettings["iOSApp"]);
    //     <plist version="1.0">
    //     <dict>
    //       <key>Command</key>
    //       <dict>
    //         <key>ChangeManagementState</key>
    //         <string>Managed</string>
    //         <key>ManagementFlags</key>
    //         <integer>1</integer>
    //         <key>ManifestURL</key>
    //         <string>https:///TDSapi/v1/system/apps/download/</string>
    //         <key>RequestType</key>
    //         <string>InstallApplication</string>
    //       </dict>
    //       <key>CommandUUID</key>
    //       <string>841f50c8-3480-42ca-a1ca-2f2a2e753079</string>
    //     </dict>
    //   </plist>
    // we need to create this plist file and send it to the device
    $plist = new CFPropertyList();
    $dict = new CFDictionary();
    $command = new CFDictionary();
    $command->add("ChangeManagementState", new CFString($installSettings["changeManagementState"]));
    $command->add("ManagementFlags", new CFNumber($installSettings["managementFlags"]));
    $command->add("ManifestURL", new CFString($url));
    $command->add("RequestType", new CFString("InstallApplication"));
    $command->add("iOSApp", new CFBoolean($installSettings["iOSApp"]));
    $Attributes = new CFDictionary();
    foreach ($installSettings["attributes"] as $key => $attribute) {
        $cleanKey = Apps_sanitizeInstallKey($key);
        if ($cleanKey !== null) {
            $Attributes->add($cleanKey, Apps_valueToCFType($attribute["type"] ?? "string", $attribute["value"] ?? ""));
        }
    }


    $command->add("Attributes", $Attributes);

    $Configuration = new CFDictionary();
    foreach ($installSettings["configuration"] as $entry) {
        $cleanKey = Apps_sanitizeInstallKey($entry["key"] ?? "");
        if ($cleanKey === null) {
            continue;
        }
        $resolved = Apps_resolveInstallValueEntry($entry, $appid, $app, $deviceid, $device, $user);
        $Configuration->add($cleanKey, Apps_valueToCFType($resolved["type"], $resolved["value"]));
    }

    $command->add("Configuration", $Configuration);
    $dict->add("Command", $command);
    $UUID = createProfileUUID();
    $dict->add("CommandUUID", new CFString($UUID));
    $plist->add($dict);
    $xml = $plist->toXML();




    return Core_sendDeviceCommandV2RawData($deviceid, $UUID, $xml);
}


// find all the apps for a device
function Apps_getForDevice($deviceid)
{
    global $MDMApps;
    $apps = $MDMApps->find(["devices" => $deviceid]);
    $output = [];
    foreach ($apps as $app) {
        $app["id"] = (string)$app["_id"];
        $output[] = $app;
    }
    return $output;
}

// Apps_removeFromDevices
// this function will remove the app from the device
// then remove the device from the app array 

function Apps_removeFromDevices($postdata)
{
    global $MDMApps;
    if (empty($postdata["appId"]) || empty($postdata["deviceUdids"]) || !is_array($postdata["deviceUdids"])) {
        return ["error" => "An app and at least one device are required"];
    }

    try {
        $appId = new MongoDB\BSON\ObjectId($postdata["appId"]);
    } catch (Exception $exception) {
        return ["error" => "Invalid app ID"];
    }

    $app = $MDMApps->findOne(["_id" => $appId]);
    if ($app) {
        foreach ($postdata["deviceUdids"] as $device) {
            $command = array("udid" => $device, "request_type" => "RemoveApplication", "Identifier" => $app["CFBundleIdentifier"]);
            Core_sendDeviceCommandV2($command);
            //   remove the device from the app array
            $MDMApps->updateOne(["_id" => $appId], ['$pull' => ["devices" => $device]]);
        }

        return ["success" => "App removed from devices"];
    }
    return ["error" => "App not found"];
}
