<?php


// Profiles_get
// Get all profiles
function Profiles_get() {
    // get the profiles from the db 
    global $MDMProfiles;
    $profiles = $MDMProfiles->find();
    $profilesArray = [];
    foreach ($profiles as $profile) {
        $profilesArray[] = $profile;
    }
    $profilesArray[] = [];
    return $profilesArray;

}

// Profiles_upload

function Profiles_upload($otherinfo, $userinfo) {
    global $MDMProfiles;

    // check for a file on the php upload
    if(isset($_FILES['profile'])){
        $file = $_FILES['profile'];
        $filepath = $file['tmp_name'];

        // Attempt to read the file
        $contents = file_get_contents($filepath);
        if ($contents === false) {
            echo json_encode(["error" => "Failed to read file"]);
            return;
        }

        // Attempt to parse the plist
        $plist = new CFPropertyList();
        try {
            $plist->parse($contents);
        } catch (Exception $e) {
            echo json_encode(["error" => "Failed to parse plist: " . $e->getMessage()]);
            return;
        }

        $plistArray = $plist->toArray();

        // Debugging: Ensure the parsed plist is correctly converted to an array
        // print_r($plistArray);

        if (!isset($plistArray["PayloadUUID"])) {
            echo json_encode(["error" => "PayloadUUID not found in plist"]);
            return;
        }
        $id = $plistArray["PayloadUUID"];
        $name = $plistArray["PayloadDisplayName"];
        $PayloadIdentifier = $plistArray["PayloadIdentifier"];


        $profile = $MDMProfiles->findOne(["PayloadUUID" => $id]);
        $ProfileArray = array(
            "PayloadUUID" => $id,
            "PayloadDisplayName" => $name,
            "PayloadIdentifier" => $PayloadIdentifier,
            "contents" => base64_encode($contents),
        );
        // $ProfileArray = $plistArray;
        // $ProfileArray["edit"] = true;
        
        echo json_encode($plistArray);
        if ($profile) {
            $MDMProfiles->update(["PayloadUUID" => $id], $ProfileArray);
        } else {
            $MDMProfiles->insertOne(   $ProfileArray);
        }

        return ["success" => true];
    } else {
        return ["error" => "No file uploaded"];
    }
}



function convertXMLToArray($xmlString) {
    $xmlObject = simplexml_load_string($xmlString, 'SimpleXMLElement', LIBXML_NOCDATA);
    if ($xmlObject === false) {
        // Handle error
        echo json_encode(["error" => "Failed to parse XML"]);
        return;
    }
    
    $json = json_encode($xmlObject);
    $array = json_decode($json, true);
    return $array;
}


// Profiles_pushToDevices

function Profiles_pushToDevices($postdata){
    global $MDMProfiles;
    $profile = $MDMProfiles->findOne(["PayloadUUID" => $postdata["profileId"]]);
    if (!$profile) {
        return ["error" => "Profile not found"];
    }
    foreach ($postdata["deviceUdids"] as $udid) {
        if (!isset($profile["contents"])) {
            $plist = new JsonToPlistConverter($profile);
            $profile["contents"] = base64_encode($plist->createPlist());
        }
        $command = array(
            "udid" => $udid,
            "request_type" => "InstallProfile",
            "payload" => $profile["contents"],
        );
        Core_sendDeviceCommandV2($command);
        // for each device add them to an array on the profile, so we know what devices have the profile
        $MDMProfiles->updateOne(["PayloadUUID" => $postdata["profileId"]], ['$addToSet' => ["devices" => $udid]]);
    }
  
    
}

//  remove profile from device
function Profiles_removeFromDevices($postdata){
    global $MDMProfiles;
    $profile = $MDMProfiles->findOne(["PayloadUUID" => $postdata["profileId"]]);
    if (!$profile) {
        return ["error" => "Profile not found"];
    }
    foreach ($postdata["deviceUdids"] as $udid) {
        $command = array(
            "udid" => $udid,
            "request_type" => "RemoveProfile",
             "identifier" => $profile["PayloadIdentifier"],
        );
        Core_sendDeviceCommandV2($command);
        // for each device add them to an array on the profile, so we know what devices have the profile
        $MDMProfiles->updateOne(["PayloadUUID" => $postdata["profileId"]], ['$pull' => ["devices" => $udid]]);
    }
    return ["success" => true];
  
    
}


// Profiles_getForDevice
function Profiles_getForDevice($udid){
    global $MDMProfiles;
    $profiles = $MDMProfiles->find(["devices" => $udid]);
    $profilesArray = [];
    foreach ($profiles as $profile) {
        $profilesArray[] = $profile;
    }
    return $profilesArray;
}

//Profiles_create 
// create a profile in the db, give it a random UUID and return the UUID
function Profiles_create(){
    global $MDMProfiles;
    $id = createProfileUUID();
    $ProfileArray = array(
        "PayloadUUID" => $id,
        "PayloadDisplayName" => uniqid(),
        "PayloadIdentifier" => "net.thomasdye.mdm." . uniqid(),
        "edit" => true,
    );
    $MDMProfiles->insertOne( $ProfileArray);
    return ["id" => $id];
}



function createProfileUUID() {
    // Generate a version 4 UUID
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10

    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}


// Profiles_save, check that it can be saved, then save it

function Profiles_save($id, $postdata) {
    global $MDMProfiles;
    $profile = $MDMProfiles->findOne(["PayloadUUID" => $id]);
    if (!$profile) {
        return ["error" => "Profile not found"];
    }
    if (!$profile["edit"]) {
        return ["error" => "Profile is not editable"];
    }
    // unset the id 
    unset($postdata["_id"]);
    // update the PayloadVersion, if not set set it to 2 
    $postdata["PayloadVersion"] = 1;

    // Assuming $postdata contains the fields to update, use $set operator
    $updateResult = $MDMProfiles->updateOne(
        ["PayloadUUID" => $id],
        ['$set' => $postdata] // Use $set to update specific fields
    );

    if ($updateResult->getModifiedCount() === 0) {
        return ["error" => "No changes were made"];
    }
    //  if we have saved push it to all devices
    if (isset($profile["devices"])) {
        // conver the id
        $sendData = array(
            "deviceUdids" =>  $profile["devices"],
            "profileId" => $id,
        );
        Profiles_pushToDevices($sendData);
    }

    return ["success" => true];
}
// Profiles_getSingle
function Profiles_getSingle($id) {
    global $MDMProfiles;
    $profile = $MDMProfiles->findOne(["PayloadUUID" => $id]);
    if (!$profile) {
        return ["error" => "Profile not found"];
    }
    return $profile;
}


// Profiles_download
function Profiles_download($id) {
    global $MDMProfiles;
    $profile = $MDMProfiles->findOne(["PayloadUUID" => $id]);
    if (!$profile) {
        return ["error" => "Profile not found"];
    }
    if (isset($profile["contents"])) {
    header('Content-Type: application/x-apple-aspen-config');
    header('Content-Disposition: attachment; filename="' . $profile["PayloadDisplayName"] . '.mobileconfig"');
    echo base64_decode($profile["contents"]);
    exit;
    }
    //  if edit is set to true then we need to create the profile using the data in the db
    if (!$profile["edit"]) {
        return ["error" => "Profile is not editable, and there is no contents"];
    }
    $plist = new JsonToPlistConverter($profile);
    // $plist->createPlist();
    header('Content-Type: application/x-apple-aspen-config');
    echo $plist->createPlist();
    exit;

    return $profile;

}
// Profiles_download
function Profiles_downloadJson($id) {
    global $MDMProfiles;
    $profile = $MDMProfiles->findOne(["PayloadUUID" => $id]);
    if (!$profile) {
        return ["error" => "Profile not found"];
    }
    if (isset($profile["contents"])) {
    header('Content-Type: application/x-apple-aspen-config');
    header('Content-Disposition: attachment; filename="' . $profile["PayloadDisplayName"] . '.mobileconfig"');
    echo base64_decode($profile["contents"]);
    exit;
    }
    //  if edit is set to true then we need to create the profile using the data in the db
    if (!$profile["edit"]) {
        return ["error" => "Profile is not editable, and there is no contents"];
    }
    // $plist = new JsonToPlistConverter($profile);
    // // $plist->createPlist();
    // header('Content-Type: application/x-apple-aspen-config');
    // echo $plist->createPlist();
    // exit;

    return $profile;

}