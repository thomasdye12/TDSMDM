<?php



function App_Device_getAvailableApps($deviceID) {
    global $MDMApps, $MDMdevices;

    $output = array();
    $apps = $MDMApps->find(array("devices" => $deviceID));

    foreach ($apps as $app) {
        $output[] = array(
            "id" => (string)$app["_id"],
            "name" => empty($app["CFBundleDisplayName"]) ? $app["name"] : $app["CFBundleDisplayName"],
            "version" => $app["infolist"]["CFBundleShortVersionString"],
            "BundleIdentifier" => $app["CFBundleIdentifier"],
            "icon" => empty($app["icon"])  ? null : $app["icon"],
            "iconURL" => empty($app["icon"])  ? null : "https://device.server.thomasdye.net/TDSapi/files/icons/". $app["icon"],
            "uploaded" => $app["uploaded"],
            "installed" => false,
            "installed_info" => null,
        );
    }

    if (empty($output)) {
        return [];
    }

    $device = $MDMdevices->findOne(["udid" => $deviceID]);
    if (empty($device) || empty($device["InstalledApplicationList"])) {
        return $output;
    }

    $installedApps = iterator_to_array($device["InstalledApplicationList"]);

    foreach ($output as &$managedApp) {
        foreach ($installedApps as $installedApp) {
            if ($installedApp["Identifier"] === $managedApp["BundleIdentifier"]) {
                $managedApp["installed"] = true;
                $managedApp["installed_info"] = $installedApp;
                break;
            }
        }
    }

    return $output;
}

function App_Device_AppsInstalledOnDevice($deviceID) {
    $data = array(
        "udid" => $deviceID,
        "request_type" => "InstalledApplicationList",
    );
     Core_sendDeviceCommandV2($data);

     sleep(5);
     return array(
        "status" => "success",
        "message" => "Apps installed on device",
        "data" => array(
            "udid" => $deviceID,
            "request_type" => "InstalledApplicationList",
        ));
}

// App_Device_Device_getstate
function App_Device_Device_getstate($deviceID) {
    global $MDMdevices;
    $device = $MDMdevices->findOne(["udid" => $deviceID]);
    $device["InstalledApplicationList"] = getDeviceStateInstalledApplicationList($device);
    $device["managedApps"] = Apps_getForDevice($deviceID);
    $device["profiles"] = Profiles_getForDevice($deviceID);
    // if the device has a user id get the user info
    if (isset($device["userId"])) {
        $device["user"] = Users_single($device["userId"]);
    }
    unset($device["UnlockToken"]);
    return $device; 
}
