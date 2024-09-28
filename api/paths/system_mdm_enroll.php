<?php



function system_mdm_enroll(){
    $file = "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/files/enroll.mobileconfig";
    $file = file_get_contents($file);
    // set the file type to be downloaded
    header('Content-Type: application/x-apple-aspen-config');
    echo $file;
}

// auto enroll the device

function  MDMServiceConfig(){
    // {
    //     "dep_enrollment_url": "https://device.server2.thomasdye.net/devicemanagement/api/device/dep_mdm_enroll",
    //     "dep_anchor_certs_url": "https://device.server2.thomasdye.net/devicemanagement/DEPAnchorCerts.json",
    //     "trust_profile_url": "https://device.server2.thomasdye.net/devicemanagement/Trust_Profile_for_TDS.mobileconfig"
    // }
    $output = [
        "dep_enrollment_url" => "https://device.server.thomasdye.net/TDSapi/api/system/mdm/dep_enroll",
        "dep_anchor_certs_url" => "https://device.server.thomasdye.net/TDSapi/api/system/mdm/dep_certs",
        "trust_profile_url" => ""
    ];
    return $output;
}