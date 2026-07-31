<?php

ini_set('memory_limit', '9000M');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('upload_max_filesize', '5000M');
ini_set('post_max_size', '5000M');
ini_set('max_input_time', 3600);
ini_set('max_execution_time', 3600);

$GLOBALS["TDS_Auth_Request_MaxRequests"] = 100;

include_once "/Server/app/support/Apikeyserver.php";
include_once "/Server/app/support/Grafana_Loki.php";

$GLOBALS["Grafana_Loki_Log_name"] = "TDS-MDM-Web";
register_shutdown_function("Grafana_Loki_Log_ShutDown");

header('Content-Type: application/json; charset=utf-8');

if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }

    exit(0);
}

include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/include.php";
include_once "/Server/app/php/TDSApiKernel.php";

$kernel = new TDSApiKernel();

$basePath = dirname($_SERVER['SCRIPT_NAME']);
$kernel->setBasePath($basePath);

// Old router order:
// params..., body, userinfo
$kernel->setBodyParamPosition("before_userinfo");

// Old router did not append null body for GET
$kernel->setAppendNullBodyForNoBodyMethods(false);

$profileManagerRights = [
    "net.thomasdye.profilemanager.admin",
    "net.thomasdye.profilemanager.devices.all",
    "net.thomasdye.profilemanager.apps.all",
    "net.thomasdye.profilemanager.profiles.all",
    "net.thomasdye.profilemanager.delete.all",
    "net.thomasdye.profilemanager.create.all",
    "net.thomasdye.profilemanager.events.all",
];

$mdmAppRights = array_merge($profileManagerRights, [
    "net.thomasdye.TDS-MDM",
    "net.thomasdye.TDS-MDM.SSO",
]);

$kernel->setGlobalRequiredAnyOf($profileManagerRights);

$kernel->setExcludedEndpoints([
    "core/v1/incomingevent",
    "core/v1/ddm",
    "core/v1/ddm/tokens",
    "core/v1/ddm/declaration-items",
    "core/v1/ddm/status",
    "core/v1/ddm/declaration/{String}/{String}",
    "core/v1/ddm/profile/{String}/{String}",
    "core/v1/tokens",
    "core/v1/declaration-items",
    "core/v1/status",
    "core/v1/declaration/{String}/{String}",
    "v1/system/mdm/enroll",
    "v1/system/apps/download/{String}",
    "v1/system/mdm/config",
    "v1/system/mdm/TDSLocationTracking/postendpoint",
    "v1/system/mdm/APNS/{String}/token",
    "v1/device/{String}/name",
]);

$kernel->addEndpoints([
    "endpoints{GET}" => ["func" => "getEndpoints", "auth" => true],

    "core/v1/devices{GET}" => ["func" => "Core_getDevices", "auth" => true],
    "core/v1/devices/{String}{GET}" => ["func" => "Core_getSingleDevices", "auth" => true],
    "core/v1/commands/{String}/{String}" => ["func" => "Core_sendDeviceInformationCommand", "auth" => true],
    "core/v1/commands/{String}/null" => ["func" => "Core_sendDeviceInformationCommandnull", "auth" => true],

    "core/v1/incomingevent" => ["func" => "Core_incomingevent", "auth" => false],

    "core/v1/ddm" => ["func" => "DDM_Service", "auth" => false],
    "core/v1/ddm/tokens" => ["func" => "DDM_Service_tokens", "auth" => false],
    "core/v1/ddm/declaration-items" => ["func" => "DDM_Service_declarationItems", "auth" => false],
    "core/v1/ddm/status" => ["func" => "DDM_Service_status", "auth" => false],
    "core/v1/ddm/declaration/{String}/{String}" => ["func" => "DDM_Service_declaration", "auth" => false],
    "core/v1/ddm/profile/{String}/{String}" => ["func" => "DDM_Service_profile", "auth" => false],

    "core/v1/tokens" => ["func" => "DDM_Service_tokens", "auth" => false],
    "core/v1/declaration-items" => ["func" => "DDM_Service_declarationItems", "auth" => false],
    "core/v1/status" => ["func" => "DDM_Service_status", "auth" => false],
    "core/v1/declaration/{String}/{String}" => ["func" => "DDM_Service_declaration", "auth" => false],

    "v1/ddm/admin/summary" => ["func" => "DDM_Admin_summary", "auth" => true],
    "v1/ddm/admin/declarations" => ["func" => "DDM_Admin_declarations", "auth" => true],
    "v1/ddm/admin/subscriptions" => ["func" => "DDM_Admin_subscriptions", "auth" => true],
    "v1/ddm/admin/subscriptions/save{POST}" => ["func" => "DDM_Admin_saveSubscriptions", "auth" => true],
    "v1/ddm/admin/device/{String}/state" => ["func" => "DDM_Admin_deviceState", "auth" => true],
    "v1/ddm/admin/sync{POST}" => ["func" => "DDM_Admin_sync", "auth" => true],
    "v1/ddm/admin/device/{String}/enable{POST}" => ["func" => "DDM_Admin_enableDevice", "auth" => true],

    "v1/sendcommand/{String}" => ["func" => "sendDeviceCommand", "auth" => true],
    "v1/deviceCommands" => ["func" => "deviceCommands", "auth" => true],
    "v1/getDevicesSmall" => ["func" => "getDevicesSmall", "auth" => true],
    "v1/device/{String}/state" => ["func" => "getDeviceState", "auth" => true],
    "v1/device/{String}/setUser{POST}" => ["func" => "device_setUser", "auth" => true],
    "v1/device/{String}/push/apps" => ["func" => "device_pushApps", "auth" => true],
    "v1/device/{String}/removeApp{POST}" => ["func" => "device_removeApp", "auth" => true],
    "v1/device/{String}/installProfile{POST}" => ["func" => "device_installProfile", "auth" => true],
    "v1/device/{String}/removeProfile{POST}" => ["func" => "device_removeProfile", "auth" => true],
    "v1/device/{String}/reAdd" => ["func" => "Core_reAddDevice", "auth" => true],

    "v1/system/mdm/enroll" => ["func" => "system_mdm_enroll", "auth" => false],
    "v1/system/apps/download/{String}" => ["func" => "Apps_Createmanifest", "auth" => false],

    "v1/users/list" => ["func" => "Users_listall", "auth" => true],

    "v1/apps/get" => ["func" => "Apps_get", "auth" => true],
    "v1/app/upload" => ["func" => "Apps_upload", "auth" => true],
    "v1/app/images/{String}" => ["func" => "Apps_getImage", "auth" => true],
    "v1/apps/device/push" => ["func" => "Apps_pushToDevices", "auth" => true],
    "v1/apps/device/remove{POST}" => ["func" => "Apps_removeFromDevices", "auth" => true],
    "v1/apps/install-setting-functions{GET}" => ["func" => "Apps_installSettingFunctions", "auth" => true],
    "v1/apps/{String}/install-settings{POST}" => ["func" => "Apps_saveInstallSettings", "auth" => true],
    "v1/apps/{String}/lifecycle{POST}" => ["func" => "Apps_setLifecycleState", "auth" => true],
    "v1/apps/{String}/provisioning-profile{GET}" => ["func" => "AppProvisioning_get", "auth" => true],
    "v1/apps/{String}/provisioning-profile{POST}" => ["func" => "AppProvisioning_upload", "auth" => true],
    "v1/apps/{String}/provisioning-profile/deploy{POST}" => ["func" => "AppProvisioning_deploy", "auth" => true],
    "v1/apps/{String}/newinfo" => ["func" => "Apps_GetNewInfofromIPA", "auth" => true],

    "v1/profiles/get" => ["func" => "Profiles_get", "auth" => true],
    "v1/profile/upload" => ["func" => "Profiles_upload", "auth" => true],
    "v1/profiles/device/push" => ["func" => "Profiles_pushToDevices", "auth" => true],
    "v1/profiles/device/remove" => ["func" => "Profiles_removeFromDevices", "auth" => true],
    "v1/profile/create" => ["func" => "Profiles_create", "auth" => true],
    "v1/profile/{String}/save" => ["func" => "Profiles_save", "auth" => true],
    "v1/profiles/{String}/get" => ["func" => "Profiles_getSingle", "auth" => true],
    "v1/profiles/{String}/download" => ["func" => "Profiles_download", "auth" => true],
    "v1/profiles/{String}/downloadJson" => ["func" => "Profiles_downloadJson", "auth" => true],
    "v1/profiles/{String}/downloadXML" => ["func" => "Profiles_downloadXML", "auth" => true],

    "v1/device/{String}/name" => ["func" => "device_getname", "auth" => false],

    "v1/EventQueue/list" => ["func" => "EventQueue_list", "auth" => true],
    "v1/iconserver/{String}" => ["func" => "iconserver", "auth" => true],

    "v1/system/mdm/TDSLocationTracking/postendpoint" => ["func" => "TDSLocationTracking", "auth" => false],
    "v1/system/mdm/TDSLocationTracking/RequestUpdate" => ["func" => "TDSLocationTracking_RequestLocationUpdate", "auth" => true],
    "v1/system/mapping/token" => ["func" => "TDSLocationTracking_MapToken", "auth" => true],
    "v1/system/mdm/APNS/{String}/token" => ["func" => "MDM_APNSToken", "auth" => false],

    "v1/app/VisionPRO/appsAvailable" => ["func" => "VisionPRO_App_Device_getAvailableApps", "auth" => true, "rights" => $mdmAppRights],
    "v1/app/{String}/appsAvailable" => ["func" => "App_Device_getAvailableApps", "auth" => true, "rights" => $mdmAppRights],
    "v1/app/{String}/AppsInstalledOnDevice" => ["func" => "App_Device_AppsInstalledOnDevice", "auth" => true, "rights" => $mdmAppRights],
    "v1/app/{String}/device/getstate" => ["func" => "App_Device_Device_getstate", "auth" => true, "rights" => $mdmAppRights],
]);

$kernel->dispatch();
