<?php


//  this will handle all incoming events from MDM to process them

function Core_incomingevent($postData)
{
    //log to /Library/Server/Web/Data/Sites/Homeserver/home-serviceslist/api/logs
    $log = "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/logs/incomingevent.log";
    $date = date('Y-m-d H:i:s');
    $data = json_encode($postData);
    file_put_contents($log, $date . " " . $data . "\n", FILE_APPEND);
    // check if the event is a device enrolled

    Core_incomingevent_SwitchTopic($postData);
}
// "topic":"mdm.Connect"

// function to switch on the topic

function Core_incomingevent_SwitchTopic($postData)
{

    switch ($postData["topic"]) {
        case "mdm.Connect":
            Core_incomingevent_mdmConnect($postData);
            // code...
            break;
        case "mdm.CheckOut":
            Core_incomingevent_mdmCheckOut($postData);
            // code...
            break;

        case "mdm.Authenticate":
            Core_incomingevent_mdmAuthenticate($postData);
            // code...
            break;
        case "mdm.TokenUpdate":
            Core_incomingevent_mdmTokenUpdate($postData);
            // code...
            break;
    }
}


function Core_incomingevent_mdmConnect($postData)
{
    if (isset($postData["acknowledge_event"])) {
        $device = Core_findOrCreateDevice($postData["acknowledge_event"]["udid"]);
        Core_deviceCheckin($device["udid"], time());
        $base64decode = base64_decode($postData["acknowledge_event"]["raw_payload"]);
        $plist = new CFPropertyList();
        $plist->parse($base64decode);
        $array = $plist->toArray();
        // handle updaing the Queue 
        EventQueue_UpdateEventraw($array, $postData["acknowledge_event"]);
        if (isset($array["Status"])) {
            Core_updateKeys($device["udid"], "Status", $array["Status"]);
        }
        // InstalledApplicationList
        if (isset($array["InstalledApplicationList"])) {
            Core_updateKeys($device["udid"], "InstalledApplicationList", $array["InstalledApplicationList"]);
        }
        // QueryResponses 
        if (isset($array["QueryResponses"])) {
            Core_incomingevent_DeviceInformation_QueryResponses($device["udid"], $array["QueryResponses"]);
        }
        if (isset($array["ActivationLockBypassCode"])) {
            Core_updateKeys($device["udid"], "Secrity.ActivationLockBypassCode", $array["ActivationLockBypassCode"]);
        }
        // SecurityInfo
        if (isset($array["SecurityInfo"])) {
            Core_SecurityInformation($device, $array["SecurityInfo"]);
        }
    }
}
// Core_incomingevent_mdmCheckOut
function Core_incomingevent_mdmCheckOut($postData)
{
    if (isset($postData["checkin_event"])) {
        $device = Core_findOrCreateDevice($postData["checkin_event"]["udid"]);
        Core_deviceCheckin($device["udid"], time());
        $base64decode = base64_decode($postData["checkin_event"]["raw_payload"]);
        $plist = new CFPropertyList();
        $plist->parse($base64decode);
        $array = $plist->toArray();
        if (isset($array["MessageType"]) && $array["MessageType"] == "CheckOut") {
            Core_updateKeys($device["udid"], "enrollment_status", false);
            Core_removeDevice($device["udid"]);
        }
    }
}
// Core_incomingevent_mdmAuthenticate
function Core_incomingevent_mdmAuthenticate($postData)
{
    if (isset($postData["checkin_event"])) {
        $device = Core_findOrCreateDevice($postData["checkin_event"]["udid"]);
        Core_deviceCheckin($device["udid"], time());
        $base64decode = base64_decode($postData["checkin_event"]["raw_payload"]);
        $plist = new CFPropertyList();
        $plist->parse($base64decode);
        $array = $plist->toArray();
        Core_updateKeys($device["udid"], "enrollment_status", true);
        $keys = ["BuildVersion", "Challenge", "DeviceName", "Model", "ModelName", "OSVersion", "ProductName", "SerialNumber", "Topic"];
        foreach ($keys as $key) {
            if (isset($array[$key])) {
                Core_updateKeys($device["udid"], $key, $array[$key]);
            }
        }
        $queryStrings = "UDID,Languages,Locales,DeviceID,OrganizationInfo,LastCloudBackupDate,AwaitingConfiguration,MDMOptions,iTunesStoreAccountIsActive,iTunesStoreAccountHash,DeviceName,OSVersion,BuildVersion,ModelName,Model,ProductName,SerialNumber,DeviceCapacity,AvailableDeviceCapacity,BatteryLevel,CellularTechnology,ICCID,BluetoothMAC,WiFiMAC,EthernetMACs,CurrentCarrierNetwork,SubscriberCarrierNetwork,CurrentMCC,CurrentMNC,SubscriberMCC,SubscriberMNC,SIMMCC,SIMMNC,SIMCarrierNetwork,CarrierSettingsVersion,PhoneNumber,DataRoamingEnabled,VoiceRoamingEnabled,PersonalHotspotEnabled,IsRoaming,IMEI,MEID,ModemFirmwareVersion,IsSupervised,IsDeviceLocatorServiceEnabled,IsActivationLockEnabled,IsDoNotDisturbInEffect,EASDeviceIdentifier,IsCloudBackupEnabled,OSUpdateSettings,LocalHostName,HostName,CatalogURL,IsDefaultCatalog,PreviousScanDate,PreviousScanResult,PerformPeriodicCheck, AutomaticCheckEnabled,BackgroundDownloadEnabled,AutomaticAppInstallationEnabled,AutomaticOSInstallationEnabled,AutomaticSecurityUpdatesEnabled,OSUpdateSettings,LocalHostName, HostName,IsMultiUser,IsMDMLostModeEnabled, MaximumResidentUsers, PushToken, DiagnosticSubmissionEnabled, AppAnalyticsEnabled, IsNetworkTethered, ServiceSubscriptions";
        Core_sendDeviceCommand($postData["checkin_event"]["udid"], "DeviceInformation",  $queryStrings);
    }
}


//  Core_incomingevent_mdmTokenUpdate
function Core_incomingevent_mdmTokenUpdate($postData)
{
    if (isset($postData["checkin_event"])) {
        $device = Core_findOrCreateDevice($postData["checkin_event"]["udid"]);
        Core_deviceCheckin($device["udid"], time());
        $base64decode = base64_decode($postData["checkin_event"]["raw_payload"]);
        $plist = new CFPropertyList();
        $plist->parse($base64decode);
        $array = $plist->toArray();
        // UnlockToken 
        if (isset($array["UnlockToken"])) {
        //    remove all the \n\t
            $array["UnlockToken"] = str_replace("\n", "", $array["UnlockToken"]);
            $array["UnlockToken"] = str_replace("\t", "", $array["UnlockToken"]);
            // echo json_encode($array);
            Core_updateKeys($device["udid"], "UnlockToken", $array["UnlockToken"]);
        }
        sleep(2);
        Core_sendDeviceFirstConnectData($postData["checkin_event"]["udid"]);
    }
}


// handle QueryResponses 

function Core_incomingevent_DeviceInformation_QueryResponses($udid, $postData)
{
    $arrayofKeys = [
        "Languages",
        "Locales",
        "DeviceID",
        "OrganizationInfo",
        "LastCloudBackupDate",
        "AwaitingConfiguration",
        "MDMOptions",
        "iTunesStoreAccountIsActive",
        "iTunesStoreAccountHash",
        "DeviceName",
        "OSVersion",
        "BuildVersion",
        "ModelName",
        "Model",
        "ProductName",
        "SerialNumber",
        "DeviceCapacity",
        "AvailableDeviceCapacity",
        "BatteryLevel",
        "CellularTechnology",
        "ICCID",
        "BluetoothMAC",
        "WiFiMAC",
        "EthernetMACs",
        "CurrentCarrierNetwork",
        "SubscriberCarrierNetwork",
        "CurrentMCC",
        "CurrentMNC",
        "SubscriberMCC",
        "SubscriberMNC",
        "SIMMCC",
        "SIMMNC",
        "SIMCarrierNetwork",
        "CarrierSettingsVersion",
        "PhoneNumber",
        "DataRoamingEnabled",
        "VoiceRoamingEnabled",
        "PersonalHotspotEnabled",
        "IsRoaming",
        "IMEI",
        "MEID",
        "ModemFirmwareVersion",
        "IsSupervised",
        "IsDeviceLocatorServiceEnabled",
        "IsActivationLockEnabled",
        "IsDoNotDisturbInEffect",
        "EASDeviceIdentifier",
        "IsCloudBackupEnabled",
        "OSUpdateSettings",
        "LocalHostName",
        "HostName",
        "CatalogURL",
        "IsDefaultCatalog",
        "PreviousScanDate",
        "PreviousScanResult",
        "PerformPeriodicCheck",
        "AutomaticCheckEnabled",
        "BackgroundDownloadEnabled",
        "AutomaticAppInstallationEnabled",
        "AutomaticOSInstallationEnabled",
        "AutomaticSecurityUpdatesEnabled",
        "IsMultiUser",
        "IsMDMLostModeEnabled",
        "MaximumResidentUsers",
        "PushToken",
        "DiagnosticSubmissionEnabled",
        "AppAnalyticsEnabled",
        "IsNetworkTethered",
        "ServiceSubscriptions"
    ];
    foreach ($arrayofKeys as $key) {
        if (isset($postData[$key])) {
            Core_updateKeys($udid, $key, $postData[$key]);
        }
    }
}

function Core_SecurityInformation($device, $array)
{
    // HardwareEncryptionCaps
    if (isset($array["HardwareEncryptionCaps"])) {
        Core_updateKeys($device["udid"], "Secrity.HardwareEncryptionCaps", $array["HardwareEncryptionCaps"]);
    }
    // ManagementStatus
    if (isset($array["ManagementStatus"])) {
        Core_updateKeys($device["udid"], "Secrity.ManagementStatus", $array["ManagementStatus"]);
    }
    // PasscodeCompliant
    if (isset($array["PasscodeCompliant"])) {
        Core_updateKeys($device["udid"], "Secrity.PasscodeCompliant", $array["PasscodeCompliant"]);
    }
    // PasscodeCompliantWithProfiles
    if (isset($array["PasscodeCompliantWithProfiles"])) {
        Core_updateKeys($device["udid"], "Secrity.PasscodeCompliantWithProfiles", $array["PasscodeCompliantWithProfiles"]);
    }
    // PasscodeLockGracePeriod
    if (isset($array["PasscodeLockGracePeriod"])) {
        Core_updateKeys($device["udid"], "Secrity.PasscodeLockGracePeriod", $array["PasscodeLockGracePeriod"]);
    }
    // PasscodeLockGracePeriodEnforced
    if (isset($array["PasscodeLockGracePeriodEnforced"])) {
        Core_updateKeys($device["udid"], "Secrity.PasscodeLockGracePeriodEnforced", $array["PasscodeLockGracePeriodEnforced"]);
    }
    // PasscodePresent
    if (isset($array["PasscodePresent"])) {
        Core_updateKeys($device["udid"], "Secrity.PasscodePresent", $array["PasscodePresent"]);
    }
}
