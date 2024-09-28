<?php
require "/Server/app/mongoDBConfig/includes/vendor/autoload.php";
$connection = new MongoDB\Client("mongodb://main.db.local.thomasdye.net:27018");
$database = $connection->selectDatabase("TDSMDM");
$MDMdevices = $database->selectCollection("devices");
$MDMApps = $database->selectCollection("Apps");
$MDMEventQueue = $database->selectCollection("EventQueue");
$MDMProfiles = $database->selectCollection("Profiles");

