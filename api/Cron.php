<?php



include_once "/Server/app/support/Apikeyserver.php";

//  this is the cron job file it will be ran every 10 minutes to check for new devices and update the database

$GLOBALS["JWT"] = Getapikeyforpath("/TDS/JWT/TDSDocs");
$GLOBALS["userinfo"]["GeneratedUID"] = "7BC50F48-C64E-4FF7-B95E-8C210A69CDB4";

include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/include.php";

$AllDevices = getDevicesSmall();

// for each device, loop over them and send checkin command
foreach ($AllDevices as $device) {
    // check the deice enrollment status enrollment_status
    if (!$device["enrollment_status"] == true) {
        continue;
    }
    // check if the device has checked in within the last 20 minutes
    if ($device["lastCheckin"] < time() - (60 * 60 * 2)) {
        $postdata = ["command" => ["command" => "DeviceInformation"]];
        // check the event queue for a pending command that is a check in for that device
        $cursor = $MDMEventQueue->find(["complete" => ['$ne' => true],"udid" => $device["udid"], "command.command" => "DeviceInformation"]);
        // if ($cursor->count() > 0) {
        //     continue;
        // }
        $cursor = iterator_to_array($cursor);
        if (count($cursor) > 0) {
            continue;
        }
        sendDeviceCommand($device["udid"], $postdata);
    }
}
