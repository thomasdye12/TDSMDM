<?php



//  the config peramiters for the apps 
// there are other config peramiters in the include.php file 
//  a copy of the servers MDM mobile config file is needed within the files folder, in acordance with the micromdm server setup
$GLOBALS["InstallPath"] = "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api";
$GLOBALS["appDir"] = "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/files/apps";
$GLOBALS["AppiconsDir"] = "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/files/icons";
$GLOBALS["hostName"] = "device.server.thomasdye.net";
$GLOBALS["apikey"] = "thomas";
$GLOBALS["BackEndHost"] = "http://127.0.0.1:6322";


include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFType.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFUid.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/IOException.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/PListException.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFTypeDetector.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFArray.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFBinaryPropertyList.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFBoolean.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFData.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFDate.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFDictionary.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFNumber.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFPropertyList.php";
include_once $GLOBALS["InstallPath"]."/funcs/CFPropertyList/CFString.php";
$supportfiles = scandir($GLOBALS["InstallPath"]."/funcs");
foreach ($supportfiles as $supportfile) {
    if (substr($supportfile, -4) == ".php") {
        include_once $GLOBALS["InstallPath"]."/funcs/" . $supportfile;
    }
}



$supportfiles = scandir($GLOBALS["InstallPath"]."/paths");
foreach ($supportfiles as $supportfile) {
    if (substr($supportfile, -4) == ".php") {
        include_once $GLOBALS["InstallPath"]."/paths/" . $supportfile;
    }
}


