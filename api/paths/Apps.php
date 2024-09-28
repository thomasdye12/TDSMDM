<?php

$GLOBALS["appDir"] = "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/files/apps";
$GLOBALS["AppiconsDir"] = "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/files/icons";

function Apps_get(){
    global $MDMApps;
    $output = array();
    $apps = $MDMApps->find();
    foreach($apps as $app){
        $app["id"] = (string)$app["_id"];
        $output[] = $app;
    }
    // if the output is empty return an error
    if(empty($output)){
      $output[] = [];
    }


    return  $output;
}

// Apps_upload will upload a file 

function Apps_upload($otherinfo,$userinfo){
    global $MDMApps;
    // check for a file on the php uplaod 
    if(isset($_FILES['app'])){
        $file = $_FILES['app'];
        $app = Apps_ProcessUpload($file,$userinfo);
        if(isset($app["error"])){
            return ["error" => $app["error"]];
        }
        $plistinfo = Apps_processInfoPlist($app["info"]);
        // trim the $global["appDir"] from the path
        $app["path"] = str_replace($GLOBALS["appDir"]."/","",$app["path"]);
        // get the icon
        $app["icon"] = Apps_getIcon($app["unzipped"],$plistinfo["CFBundleIdentifier"]);
        $app["CFBundleDisplayName"] = $plistinfo["CFBundleDisplayName"] ?? "";
        $app["CFBundleIdentifier"] = $plistinfo["CFBundleIdentifier"] ?? "";
        $app["CFBundleShortVersionString"] = $plistinfo["CFBundleShortVersionString"];
        $app["infolist"] = $plistinfo;
        Apps_removeUnzipped($app["unzipped"]);
        unset($app["unzipped"]);
        unset($app["info"]);
        //  use the bundle id to check if the app is already in the db, if it is update it, if not insert it
        $appdb = $MDMApps->findOne(["CFBundleIdentifier" => $app["CFBundleIdentifier"]]);
        if($appdb){
            $app["_id"] = $appdb["_id"];
            $MDMApps->replaceOne(["_id" => $app["_id"]],$app);
        }else{
            $MDMApps->insertOne($app);
        }
        // push the new app to all the devices that that app is assigned to
        foreach( $appdb["devices"] as $device){
            Apps_pushToDevice($app["_id"],$app,$device);
        }
        return $app;
    
    }
    return ["error" => "No file uploaded"];
}

// function to handle the core upload and proecesing of the App file .ipa, 
// we will need to proecess it, unzip it, and then get the info.plist file from the payload folder then we can use that for the info we need about the file for the server to 
// create the manifest file for the app to be installed on the device.

function Apps_ProcessUpload($file,$userinfo) {
    // check that we have all the info we need
    if(!isset($file['name']) || !isset($file['size']) || !isset($file['type'])){
        return ["error" => "Missing file info"];
    }
    $apparray = array("name" => $file['name'], "size" => $file['size'], "type" => $file['type'],"GUUID" => $userinfo["GeneratedUID"],"uploaded" => time());
    // move the file from the temp location to the app folder $GLOBALS["appDir"]
    $filename =  time() . "-" . uniqid() . ".ipa";
    $apparray["path"] = $GLOBALS["appDir"] . "/" . $filename;
    // check if the file is an ipa file
    if($apparray["type"] != "application/octet-stream"){
        return ["error" => "File is not an ipa file"];
    }
    // move the file
    if(move_uploaded_file($file['tmp_name'],$apparray["path"])){
        // unzip the file
        $zip = new ZipArchive;
        if($zip->open($apparray["path"]) === TRUE){
            $zip->extractTo($GLOBALS["appDir"] . "/" . $filename . "-unzipped");
            $zip->close();
            // get the info.plist file
            $info = Apps_getInfoPlist($GLOBALS["appDir"] . "/" . $filename . "-unzipped");
            if($info){
                $apparray["unzipped"] = $GLOBALS["appDir"] . "/" . $filename . "-unzipped";
                // get the app icon AppIcon60x60@2x.png
                $apparray["info"] = $info;
                return $apparray;
            }else{
                return ["error" => "Could not find info.plist file"];
            }
        }else{
            return ["error" => "Could not unzip file"];
        }
    }else{
        return ["error" => "Could not move file"];
    }

}
// Apps_getInfoPlist
// this function will get the info.plist file from the payload folder of the unzipped ipa file

function Apps_getInfoPlist($path){
    $dir = $path . "/Payload";
    $files = scandir($dir);
    foreach($files as $file){
        if(strpos($file,".app") !== false){
            $appdir = $dir . "/" . $file;
            $appfiles = scandir($appdir);
            foreach($appfiles as $appfile){
                if(strpos($appfile,"Info.plist") !== false){
                    $info = $appdir . "/" . $appfile;
                    return $info;
                }
            }
        }
    }
    return false;
}


// process the plist file to get the info we need for the app

function Apps_processInfoPlist($path){
    $plist = new CFPropertyList($path);
    $plistArray = $plist->toArray();
 
    return $plistArray;
}

// function to remove the unzipped folder after we have gotten the info.plist file
 function Apps_removeUnzipped($path){
     if(file_exists($path)){
         $files = scandir($path);
         foreach($files as $file){
             if($file != "." && $file != ".."){
                 if(is_dir($path . "/" . $file)){
                     Apps_removeUnzipped($path . "/" . $file);
                 }else{
                     unlink($path . "/" . $file);
                 }
             }
         }
         rmdir($path);
     }
 }

//   Apps_getIcon move the app icon to the 


function Apps_getIcon($path,$bundle){
    $dir = $path . "/Payload";
    $files = scandir($dir);
    foreach($files as $file){
        if(strpos($file,".app") !== false){
            $appdir = $dir . "/" . $file;
            $appfiles = scandir($appdir);
            foreach($appfiles as $appfile){
                if(strpos($appfile,"AppIcon60x60@2x.png") !== false){
                    $info = $appdir . "/" . $appfile;
                    return Apps_moveIcon($info,$bundle);
                }
            }
        }
    }
    return false;
}

function Apps_moveIcon($path,$bundle){
    $filename = time() . "-" . $bundle . ".png";
    $newpath = $GLOBALS["AppiconsDir"] . "/" . $filename;
    if(copy($path,$newpath)){
        return $filename;
    }
    return false;
}


// Apps_getImage
// this function will get the image for the app icon
function Apps_getImage($bundle){
    $icon = $GLOBALS["AppiconsDir"] . "/" . $bundle;
    if(file_exists($icon)){
        header('Content-Type: image/png');
        readfile($icon);
    }else{
        header('Content-Type: image/png');
        readfile($GLOBALS["AppiconsDir"] . "/default.png");
    }
}

// Apps_Createmanifest 
// this function will create the manifest file for the app to be installed on the device

function Apps_Createmanifest($id) {
    global $MDMApps;
    $app = $MDMApps->findOne(["_id" => new MongoDB\BSON\ObjectId($id)]);
    if($app){
        $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"></plist>');
        $app["path"] = str_replace(" ","%20",$app["path"]);
        // Create the main structure
        $xml->addChild("dict");
        $dict = $xml->dict;
        $dict->addChild("key", "items");
        $dict->addChild("array");
        $array = $dict->array;
        $array->addChild("dict");
        $dict2 = $array->dict;
        
        // Add assets
        $dict2->addChild("key", "assets");
        $dict2->addChild("array");
        $assetsArray = $dict2->array;
        
        // First asset: software-package
        $assetsArray->addChild("dict");
        $assetDict1 = $assetsArray->dict;
        $assetDict1->addChild("key", "kind");
        $assetDict1->addChild("string", "software-package");
        $assetDict1->addChild("key", "url");
        $assetDict1->addChild("string", "https://device.server.thomasdye.net/TDSapi/files/apps/" . $app["path"]);
        
        if ($app["icon"] == "" || $app["icon"] == null) {
            $app["icon"] = "default.png";
        }

        // Second asset: display-image
        $assetsArray->addChild("dict");
        $assetDict2 = $assetsArray->dict[1];
        $assetDict2->addChild("key", "kind");
        $assetDict2->addChild("string", "display-image");
        $assetDict2->addChild("key", "url");
        $assetDict2->addChild("string", "https://device.server.thomasdye.net/TDSapi/files/icons/" . $app["icon"]);
        
        // Third asset: full-size-image
        $assetsArray->addChild("dict");
        $assetDict3 = $assetsArray->dict[2];

        $assetDict3->addChild("key", "kind");
        $assetDict3->addChild("string", "full-size-image");
        $assetDict3->addChild("key", "url");
        $assetDict3->addChild("string", "https://device.server.thomasdye.net/TDSapi/files/icons/" . $app["icon"]);
        
        // Add metadata
        $dict2->addChild("key", "metadata");
        $dict2->addChild("dict");
        $metadataDict = $dict2->dict;
        $metadataDict->addChild("key", "bundle-identifier");
        $metadataDict->addChild("string", $app["CFBundleIdentifier"]);
        $metadataDict->addChild("key", "bundle-version");
        $metadataDict->addChild("string", $app["CFBundleShortVersionString"]);
        $metadataDict->addChild("key", "kind");
        $metadataDict->addChild("string", "software");
        // $metadataDict->addChild("key", "platform-identifier");
        // $metadataDict->addChild("string", "com.apple.platform.iphoneos");
        // if the app has a display name use that, if not use the bundle id
        if ($app["CFBundleDisplayName"] == "" || $app["CFBundleDisplayName"] == null) {
            $app["CFBundleDisplayName"] = $app["CFBundleIdentifier"] ?? "unknown";
        }
        $metadataDict->addChild("key", "title");
        $metadataDict->addChild("string", $app["CFBundleDisplayName"]);
        // manifest-version
        $metadataDict->addChild("key", "manifest-version");
        $metadataDict->addChild("string", "1.0");
        
        // Set the header to XML and output the XML
        header('Content-type: text/xml');
        echo $xml->asXML();
        
        }
            
}

// Apps_pushToDevices


function  Apps_pushToDevices($postdata,$userinfo){
    global $MDMApps;
    $app = $MDMApps->findOne(["_id" => new MongoDB\BSON\ObjectId($postdata["appId"])]);
    if($app){
        foreach ($postdata["deviceUdids"] as $device){
            $deviceid = $device;
            $result = Apps_pushToDevice($postdata["appId"],$app,$deviceid);
            $MDMApps->updateOne(["_id" => new MongoDB\BSON\ObjectId($postdata["appId"])], ['$addToSet' => ["devices" => $deviceid]]);
            if(isset($result["error"])){
                return $result;
            }
            echo json_encode($result);
            
        }
        return ["success" => "App pushed to devices"];
    }
    return ["error" => "App not found"];
}

// function to actually push the app to the device
function Apps_pushToDevice($appid,$app,$deviceid){
    $url = "https://device.server.thomasdye.net/TDSapi/v1/system/apps/download/" . $appid;
    $data = array("udid" => $deviceid,"request_type" => "InstallApplication","manifest_url" => $url,"management_flags" => 1,"change_management_state" => "Managed","iOSApp" => true);
//     <plist version="1.0">
//     <dict>
//       <key>Command</key>
//       <dict>
//         <key>ChangeManagementState</key>
//         <string>Managed</string>
//         <key>ManagementFlags</key>
//         <integer>1</integer>
//         <key>ManifestURL</key>
//         <string>https://device.server.thomasdye.net/TDSapi/v1/system/apps/download/66d1c36b69d77944420bbfeb</string>
//         <key>RequestType</key>
//         <string>InstallApplication</string>
//       </dict>
//       <key>CommandUUID</key>
//       <string>841f50c8-3480-42ca-a1ca-2f2a2e753079</string>
//     </dict>
//   </plist>
// we need to create this plist file and send it to the device
    $plist = new CFPropertyList();
    $dict = new CFDictionary();
    $command = new CFDictionary();
    $command->add("ChangeManagementState",new CFString("Managed"));
    $command->add("ManagementFlags",new CFNumber(1));
    $command->add("ManifestURL",new CFString($url));
    $command->add("RequestType",new CFString("InstallApplication"));
    $command->add("iOSApp",new CFBoolean(true));
    $Attributes = new CFDictionary();
    $Attributes->add("Removable",new CFBoolean(false));


    $command->add("Attributes",$Attributes);

    $Configuration = new CFDictionary();
    $Configuration-> add("MDM-DevieID",new CFString($deviceid));

    $command->add("Configuration",$Configuration);
    $dict->add("Command",$command);
    $UUID = createProfileUUID();
    $dict->add("CommandUUID",new CFString($UUID));
    $plist->add($dict);
    $xml = $plist->toXML();




   return Core_sendDeviceCommandV2RawData($deviceid,$UUID,$xml);
}


// find all the apps for a device
function Apps_getForDevice($deviceid){
    global $MDMApps;
    $apps = $MDMApps->find(["devices" => $deviceid]);
    $output = [];
    foreach($apps as $app){
        $app["id"] = (string)$app["_id"];
        $output[] = $app;
    }
    return $output;
}

// Apps_removeFromDevices
// this function will remove the app from the device
// then remove the device from the app array 

function Apps_removeFromDevices($postdata){
    global $MDMApps;
    $app = $MDMApps->findOne(["_id" => new MongoDB\BSON\ObjectId($postdata["appId"])]);
    if($app){
        foreach ($postdata["deviceUdids"] as $device){
           $command = array("udid" => $device,"request_type" => "RemoveApplication","Identifier" => $app["CFBundleIdentifier"]);
          Core_sendDeviceCommandV2($command);
        //   remove the device from the app array
          $MDMApps->updateOne(["_id" => new MongoDB\BSON\ObjectId($postdata["appId"])], ['$pull' => ["devices" => $device]]);
            
        }

        return ["success" => "App removed from devices"];
    }
    return ["error" => "App not found"];
}