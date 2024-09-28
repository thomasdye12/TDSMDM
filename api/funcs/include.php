<?php


include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFType.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFUid.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/IOException.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/PListException.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFTypeDetector.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFArray.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFBinaryPropertyList.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFBoolean.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFData.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFDate.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFDictionary.php";

include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFNumber.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFPropertyList.php";
include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/CFPropertyList/CFString.php";





$supportfiles = scandir("/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs");
foreach ($supportfiles as $supportfile) {
    if (substr($supportfile, -4) == ".php") {
        include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/" . $supportfile;
    }
}



$supportfiles = scandir("/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/paths");
foreach ($supportfiles as $supportfile) {
    if (substr($supportfile, -4) == ".php") {
        include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/paths/" . $supportfile;
    }
}


