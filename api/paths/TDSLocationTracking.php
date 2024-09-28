<?php









// system_mdm_TDSLocationTracking
function TDSLocationTracking($data) {
    //  check there is an MDM ID and it is not null,  "MDMDeviceID"
    if (!isset($data["MDMDeviceID"]) || $data["MDMDeviceID"] == null) {
        return ["error" => "MDMDeviceID is required", "code" => 400];
    }
    // use the DB to see if there is a device with that ID in it 
    global $MDMdevices;
    $device = $MDMdevices->findOne(["udid" => $data["MDMDeviceID"], "enrollment_status" => true]);
    // check its not null 
    if (!$device) {
        return ["error" => "Device not found", "code" => 404];
    }
    // use that to update or create the device key net_thomasdye_TDS-LocationTracking.location
    $updatearray = [];
    $updatearray["net_thomasdye_TDS-LocationTracking.location"] = $data;
    $result = $MDMdevices->updateOne(["udid" => $data["MDMDeviceID"]], ['$set' => $updatearray]);
    return ["status" => "success"];

}


function TDSLocationTracking_MapToken(){
    include_once "/Server/app/support/Apikeyserver.php";
    return ["token" => Getapikeyforpath("/MapKit/token/300/device.server.thomasdye.net")];
}


// request device location 
function TDSLocationTracking_RequestLocationUpdate($data){



    include_once "/Server/app/support/APNS.php";
    $apnsarray["production"] = $data['ENV'] == "production" ? true : false;
    $apnsarray["devkey"] = "G7NMVQ2XHH";
    // $apnsarray["dev"] = "net.thomasdye.TDS-serverstatus";
    $apnsarray["dev"] = "net.thomasdye.TDS-LocationTracking";
    $apnsarray["id"] = $data['APNSToken'];
    $apnsarray["content-available"] = 1;
    $apnsarray["payload"]["LastLocation"] = true;
    sendapns($apnsarray);



    return ["status" => "success"];

}