<?php
require "/Server/app/mongoDBConfig/includes/vendor/autoload.php";
$connection = new MongoDB\Client("mongodb://main.db.local.thomasdye.net:27018");
$database = $connection->selectDatabase("TDSMDM");
$MDMdevices = $database->selectCollection("devices");
$MDMApps = $database->selectCollection("Apps");
$MDMProvisioningProfiles = $database->selectCollection("ProvisioningProfiles");
$MDMProvisioningDeployments = $database->selectCollection("ProvisioningProfileDeployments");
$MDMEventQueue = $database->selectCollection("EventQueue");
$MDMProfiles = $database->selectCollection("Profiles");
$MDMDDMDeclarations = $database->selectCollection("DDMDeclarations");
$MDMDDMDeviceState = $database->selectCollection("DDMDeviceState");
$MDMDDMStatusReports = $database->selectCollection("DDMStatusReports");
$MDMDDMActivations = $database->selectCollection("DDMActivations");

include_once "/Server/app/support/Apikeyserver.php";
$GLOBALS["JWT"] = Getapikeyforpath("/TDS/JWT/TDSDocs");
// echo $GLOBALS["JWT"];
