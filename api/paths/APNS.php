<?php




function MDM_APNSToken($deviceID, $data)
{

    global $MDMdevices;
    //   check the request is a post request
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return array("status" => "failed", "error" => "Invalid request method");
    }
    // if (!isset($data["MDMDeviceID"]) || $data["MDMDeviceID"] == null) {
    //     return ["error" => "MDMDeviceID is required", "code" => 400];
    // }
    // use the DB to see if there is a device with that ID in it 
    global $MDMdevices;
    $device = $MDMdevices->findOne(["udid" => $deviceID, "enrollment_status" => true]);
    // check its not null 
    if (!$device) {
        return ["error" => "Device not found", "code" => 404];
    }
    // use that to update or create the device key APNS
    $updatearray = [];
    $updatearray["APNS"] = $data;
    $result = $MDMdevices->updateOne(["udid" => $deviceID], ['$set' => $updatearray]);
    return ["status" => "success"];
}


function APNS_SendAPPNotifciation($deviceid, $app)
{

    try {
        if ($app["CFBundleDisplayName"] == "" || $app["CFBundleDisplayName"] == null) {
            $app["CFBundleDisplayName"] = $app["CFBundleIdentifier"] ?? "unknown";
        }

        global $MDMdevices;
        $device = $MDMdevices->findOne(["udid" => $deviceid, "enrollment_status" => true]);
        // check its not null
        if (!$device) {
            return ["error" => "Device not found", "code" => 404];
        }
        // check the device has an APNS token
        if (!isset($device["APNS"]) || $device["APNS"] == null) {
            return ["error" => "Device does not have an APNS token", "code" => 400];
        }
        // Send User APNS notification
        include_once "/Server/app/support/APNS.php";
        $apnsarray["production"] = false;
        $apnsarray["devkey"] = "G7NMVQ2XHH";
        $apnsarray["dev"] = "net.thomasdye.TDS-MDM";
        $apnsarray["title"] = "MDM App Install";
        $apnsarray["appactionid"] = "servercheck";
        $apnsarray["notsound"] = "ping.aiff";
        $apnsarray["interuptionlevel"] = "time-sensitive";
        $apnsarray["notname"] = $app["CFBundleDisplayName"] . " is about to be installed";
        $apnsarray["id"] = $device["APNS"]["APNStoken"];
        $apnsarray["dev_NEWAPNS"] =  $device["APNS"]["ENV"] != "development" ? true : false;
        sendapns($apnsarray);
    } catch (Exception $e) {
        return ["error" => "Error sending APNS notification: " . $e->getMessage(), "code" => 500];
    }
    return ["status" => "success"];
}
