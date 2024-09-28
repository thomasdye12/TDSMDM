<?php



// function for core device in the db, find or create device and return the device

function Core_findOrCreateDevice($udid)
{
    // check if the device is in the db
    global $MDMdevices;
    $device = $MDMdevices->findOne(["udid" => $udid]);
    if (empty($device)) {
        // create the device
        $device = Core_createDevice($udid);

      
    }
    return $device;
}

// function to create a device in the db

function Core_createDevice($udid)
{
    // create the device
    $device = [
        "udid" => $udid
    ];
    // insert the device
    $insertOneResult = $GLOBALS["MDMdevices"]->insertOne($device);

    return $GLOBALS["MDMdevices"]->findOne(["udid" => $udid]);
}

function Core_deviceCheckin($udid, $time)
{
    global $MDMdevices;
    // update the the last checkin time
    $updateResult = $MDMdevices->updateOne(
        ["udid" => $udid],
        ['$set' => ["lastCheckin" => $time]]
    );
}

// update core keys in the db 

function Core_updateKeys($udid, $keys, $value)
{
    global $MDMdevices;
    // update the the last checkin time
    $updateResult = $MDMdevices->updateOne(
        ["udid" => $udid],
        ['$set' => [$keys => $value]]
    );
    //  if the key is is enrollment_status and we changed it to true,and it was false, send the first connect data, chekc the update result
    if ($keys == "enrollment_status" && $value == true && $updateResult->getModifiedCount() > 0) {
        Core_sendDeviceFirstConnectData($udid);
    }
}

// get a device by udid

function getDeviceState($udid)
{
    global $MDMdevices;
    $device = $MDMdevices->findOne(["udid" => $udid]);
    $device["InstalledApplicationList"] = getDeviceStateInstalledApplicationList($device);
    $device["managedApps"] = Apps_getForDevice($udid);
    $device["profiles"] = Profiles_getForDevice($udid);
    // if the device has a user id get the user info
    if (isset($device["userId"])) {
        $device["user"] = Users_single($device["userId"]);
    }
    return $device;
}



// for the device getDeviceState we need to filter the InstalledApplicationList to be unique

function getDeviceStateInstalledApplicationList($devicedata)
{
    if (isset($devicedata["InstalledApplicationList"])) {
        $installedApplicationList = iterator_to_array($devicedata["InstalledApplicationList"]);
        $installedApplicationList = array_reverse($installedApplicationList);
        $unique = [];
        $output = [];
        foreach ($installedApplicationList as $app) {
            if (isset($app["Identifier"])) {
                if (!in_array($app["Identifier"], $unique)) {
                    $unique[] = $app["Identifier"];
                    $output[] = $app;
                }
            } else {
                $output[] = $app;
            }
        }
        return $output;
    }
    return [];
}


// handle first device send data 

function Core_sendDeviceFirstConnectData($udid)
{
    sendDeviceCommand($udid, array("command" => array("command" => "DeviceInformation", "queryStrings" => "")));
    Profiles_pushToDevices(array("deviceUdids" => array($udid), "profileId" => "75063D46-F2A2-4377-AABA-720BFCFDAA99"));
}

//  handle remvoe of the device
function Core_removeDevice($udid)
{
    global $MDMdevices;
    global $MDMEventQueue;
    global $MDMApps;
    global $MDMProfiles;
    // remvoe the device id from any apps, profiles
    $allapps =  $MDMApps->find();
    foreach ($allapps as $app) {
        $MDMApps->updateOne(
            ["_id" => $app["_id"]],
            ['$pull' => ["devices" => $udid]]
        );
    }
    $allprofiles =  $MDMProfiles->find();
    foreach ($allprofiles as $profile) {
        $MDMProfiles->updateOne(
            ["_id" => $profile["_id"]],
            ['$pull' => ["devices" => $udid]]
        );
    }
    // remove the device from the event queue
    $MDMEventQueue->deleteMany(["deviceUdid" => $udid]);
    
}