<?php


//  Core_getDevices 


function Core_getDevices()
{

    $curl = curl_init();

    curl_setopt_array($curl, array(
        CURLOPT_URL => $GLOBALS["host"] . '/v1/devices',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => '{"udid":""}',
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'Authorization: Basic ' . Auth_Header(),
        ),
    ));

    $response = curl_exec($curl);
    curl_close($curl);
    return json_decode($response, true);
}

function Core_getSingleDevices($id)
{
    return Core_getDevice($id);
}

function deviceCommands(){
    // { "value": "checkin", "label": "Check In" },
    // { "value": "lock", "label": "Lock Device" },
    // { "value": "wipe", "label": "Wipe Device" },
    // { "value": "restart", "label": "Restart Device" },
    // { "value": "shutdown", "label": "Shut Down Device" }
    $output = [];   
    $output[] = ["value" => "DeviceInformation", "label" => "Check In"];
    $output[] = ["value" => "InstalledApplicationList", "label" => "InstalledApplicationList"];
    $output[] = ["value" => "DeviceLocation", "label" => "DeviceLocation"];
    $output[] = ["value" => "restart", "label" => "Restart Device"];
    $output[] = ["value" => "shutdown", "label" => "Shut Down Device"];



    return $output;
}

//  get devices small data formatted 

function getDevicesSmall()
{
   global $MDMdevices;
    $cursor = $MDMdevices->find([], ["projection" => ["udid" => 1, "DeviceName" => 1, "Model" => 1, "OSVersion" => 1, "enrollment_status" => 1, "userId" => 1,"ModelName" => 1,"lastCheckin" => 1]]);
    $users = Users_listall();
    $output = [];
    foreach ($cursor as $document) {
        // add the user info to the device
        $document["user"] = null;
        if (isset($document["userId"])) {
            foreach ($users as $user) {
                if ($user["GUUID"] == $document["userId"]) {
                    $document["user"] = $user;
                    break;
                }
            }
        }
        $output[] = $document;
    }


    return $output;
}
function device_setUser($udid, $postdata)
{
    global $MDMdevices;
    $userid = $postdata["userId"];
    $updateResult = $MDMdevices->updateOne(
        ["udid" => $udid],
        ['$set' => ["userId" => $userid]]
    );
    return $updateResult->getModifiedCount();
}

// device_pushApps
function device_pushApps($udid, $postdata,$userinfo)
{
    $apps = $postdata["apps"];
    $device = $postdata["targetDevice"];
    foreach ($apps as $app) {
    
        Apps_pushToDevices(array("deviceUdids" => array($device), "appId" => $app), $userinfo);
    }


    // use Apps_pushToDevices 

}

// device_removeApp
function device_removeApp($udid, $postdata)
{
    $app = $postdata["appId"];
    Apps_removeFromDevices(array("deviceUdids" => array($udid), "appId" => $app));
}

// device_installProfile
function device_installProfile($udid, $postdata)
{
    $profile = $postdata["profileId"];
    Profiles_pushToDevices(array("deviceUdids" => array($udid), "profileId" => $profile));
}
// device_removeProfile
function device_removeProfile($udid, $postdata)
{
    $profile = $postdata["profileId"];
    Profiles_removeFromDevices(array("deviceUdids" => array($udid), "profileId" => $profile));
}