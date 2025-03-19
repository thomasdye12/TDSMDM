<?php

function Core_sendDeviceInformationCommand($udid, $queryStrings)
{
    // Prepare the request data
    $data = array(
        "udid" => $udid,
        "request_type" => "DeviceInformation",
        "queries" => explode(",", $queryStrings)
    );
    // loop over the queries and remove white space either side
    foreach ($data["queries"] as $key => $value) {
        $data["queries"][$key] = trim($value);
    }
    return Core_sendDeviceCommandV2($data);
}

function Core_sendDeviceInformationCommandnull($uid)
{
    return Core_sendDeviceInformationCommand($uid,  "");
}



function Core_sendDeviceCommand($udid, $request_type, $queryStrings)
{
    // Prepare the request data
    $data = array(
        "udid" => $udid,
        "request_type" => $request_type,
        "queries" => explode(", ", $queryStrings)
    );

    return Core_sendDeviceCommandV2($data);
}


function Core_sendDeviceCommandV2($data)
{
    global $MDMdevices;
    $device = $MDMdevices->findOne(["udid" => $data["udid"]]);
    if (!$device) {
        return array("status" => "failed", "error" => "Device not found");
    }
    // Set up the endpoint and credentials
    $endpoint = '/v1/commands';
    $url = $GLOBALS["BackEndHost"] . $endpoint;




    // Initialize cURL
    $curl = curl_init();

    // Set cURL options
    curl_setopt_array($curl, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'Authorization: Basic ' . Auth_Header(), // Replace with your actual auth method
        ),
    ));

    // Execute the request
    $response = curl_exec($curl);

    // Close cURL session
    curl_close($curl);

    // Return the decoded JSON response
    $res = json_decode($response, true);
    EventQueue_CreateEvent($data["udid"], $res);
    return $res;
}
function Core_sendDeviceCommandV2RawData($udid, $commandUUID, $data)
{
    global $MDMdevices;
    $device = $MDMdevices->findOne(["udid" => $udid]);
    if (!$device) {
        return array("status" => "failed", "error" => "Device not found");
    }
    // Set up the endpoint and credentials
    $endpoint = '/v1/commands/' . $udid;
    $url = $GLOBALS["BackEndHost"] . $endpoint;




    // Initialize cURL
    $curl = curl_init();

    // Set cURL options
    curl_setopt_array($curl, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_HTTPHEADER => array(
            'Content-Type: text/xml; charset=utf-8',
            'Authorization: Basic ' . Auth_Header(), // Replace with your actual auth method
        ),
    ));

    // Execute the request
    $response = curl_exec($curl);

    // Close cURL session
    curl_close($curl);

    // Return the decoded JSON response
    $res = json_decode($response, true);
    EventQueue_CreateEvent( $udid, $res);
    return $res;
}





// sendDeviceCommand

function sendDeviceCommand($uid, $postdata)
{
    global $MDMdevices;
    $command = $postdata["command"]["command"] ?? "";
    $queryStrings = $postdata["command"]["queryStrings"] ?? "";
    if ($command == "DeviceInformation") {
        $queryStrings = "UDID, Languages, Locales, DeviceID, OrganizationInfo, LastCloudBackupDate, AwaitingConfiguration, MDMOptions, iTunesStoreAccountIsActive, iTunesStoreAccountHash, DeviceName, OSVersion, BuildVersion, ModelName, Model, ProductName, SerialNumber, DeviceCapacity, AvailableDeviceCapacity, BatteryLevel, CellularTechnology, ICCID, BluetoothMAC, WiFiMAC, EthernetMACs, CurrentCarrierNetwork, SubscriberCarrierNetwork, CurrentMCC, CurrentMNC, SubscriberMCC, SubscriberMNC, SIMMCC, SIMMNC, SIMCarrierNetwork, CarrierSettingsVersion, PhoneNumber, DataRoamingEnabled, VoiceRoamingEnabled, PersonalHotspotEnabled, IsRoaming, IMEI, MEID, ModemFirmwareVersion, IsSupervised, IsDeviceLocatorServiceEnabled, IsActivationLockEnabled, IsDoNotDisturbInEffect, EASDeviceIdentifier, IsCloudBackupEnabled, OSUpdateSettings, LocalHostName, HostName, CatalogURL, IsDefaultCatalog, PreviousScanDate, PreviousScanResult, PerformPeriodicCheck, AutomaticCheckEnabled, BackgroundDownloadEnabled, AutomaticAppInstallationEnabled, AutomaticOSInstallationEnabled, AutomaticSecurityUpdatesEnabled, OSUpdateSettings, LocalHostName, HostName, IsMultiUser, IsMDMLostModeEnabled, MaximumResidentUsers, PushToken, DiagnosticSubmissionEnabled, AppAnalyticsEnabled, IsNetworkTethered, ServiceSubscriptions";
        return Core_sendDeviceInformationCommand($uid, $queryStrings);
    }
    // RequestMirroring
    if ($command == "RequestMirroring") {
        if (isset($postdata["command"]["targetDevice"])) {
            $taget = $MDMdevices->findOne(["udid" => $postdata["command"]["targetDevice"]]);
            if ($taget) {
                $data = array(
                    "udid" => $uid,
                    "request_type" => "RequestMirroring",
                    "destination_device_id" => $taget["DeviceID"],
                );
                return Core_sendDeviceCommandV2($data);
            }
        }
        return array("status" => "failed", "error" => "No target device");
    }
    // UnlockToken
    // ClearPasscode
    if ($command == "ClearPasscode") {
        $taget = $MDMdevices->findOne(["udid" => $uid]);
        // echo json_encode($taget);
        if (!$taget) {
            return array("status" => "failed", "error" => "Device not found");
        }
        // echo trim($taget["UnlockToken"]);
        $data = array(
            "udid" => $uid,
            "request_type" => "ClearPasscode",
            "unlock_token" => trim($taget["UnlockToken"]),
        );
        return Core_sendDeviceCommandV2($data);
    }
    // command must start with "SettingsCommand" 
    if (substr_compare($command, "SettingsCommand", 0, 14) == 0) {
        $UUID = createProfileUUID();
        $commandclass = new DeviceCommandClass($UUID);
        $newcommand = substr($command, 16);
        $commandclass->addItem($newcommand, $postdata["command"]["fields"]);
        


            // .Command.Settings.OrganizationInfo
        // $data = array(
        //     array(
        //         "Command" => array(
        //             array(
        //             "RequestType" => "Settings",
        //             "Settings" => array(
        //                 array(
        //                     array(
        //                         "Item" => "OrganizationInfo",
        //                         "OrganizationInfo" => array(
        //                             array(
        //                                 "OrganizationAddress" => $postdata["command"]["fields"]["OrganizationAddress"] ?? "",
        //                                 "OrganizationEmail" => $postdata["command"]["fields"]["OrganizationEmail"] ?? "",
        //                                 "OrganizationMagic" => $postdata["command"]["fields"]["OrganizationMagic"] ?? "",
        //                                 "OrganizationName" => $postdata["command"]["fields"]["OrganizationName"] ?? "TDS MDM",
        //                                 "OrganizationPhone" => $postdata["command"]["fields"]["OrganizationPhone"] ?? "",
        //                                 "OrganizationShortName" => $postdata["command"]["fields"]["OrganizationShortName"] ?? "TDS",
        //                             )
        //                         )
        //                     )
        //                 )

        //             )
        //             )
        //         ),
        //         "CommandUUID" =>   $UUID
        //     )
        // );
        // return Core_sendDeviceCommandV2($data);
        return Core_sendDeviceCommandV2RawData($uid,$UUID, $commandclass->getXML());
        echo $commandclass->getXML();
        return "";
    }



    //  if there is a fields key 
    if (isset($postdata["command"]["fields"])) {
        $sendarray = [];
        $sendarray["udid"] = $uid;
        $sendarray["request_type"] = $command;
        // loop over the fields and add them to the array
        foreach ($postdata["command"]["fields"] as $key => $value) {
            $sendarray[$key] = $value;
        }
        return Core_sendDeviceCommandV2($sendarray);
    }




    return Core_sendDeviceCommand($uid, $command,  $queryStrings);
}

