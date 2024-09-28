<?php
// handle auth and get the user info
ini_set('memory_limit', '9000M');

// show errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
// incress max upload size 5 GB
ini_set('upload_max_filesize', '5000M');
ini_set('post_max_size', '5000M');
ini_set('max_input_time', 3600);
ini_set('max_execution_time', 3600);
// set the max number of requests per min
$GLOBALS["TDS_Auth_Request_MaxRequests"] = 100;
include_once "/Server/app/support/Apikeyserver.php";

include_once "/Server/app/support/Grafana_Loki.php";
$GLOBALS["Grafana_Loki_Log_name"] = "TDS-MDM-Web";
register_shutdown_function("Grafana_Loki_Log_ShutDown");

// set header that says `TDS Docs API`
// header('X-Powered-By: TDS');

if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
// header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        // may also be using PUT, PATCH, HEAD etc
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }

    exit(0);
}


// Get the base path of the current script
$basePath = dirname($_SERVER['SCRIPT_NAME']);

// Get the user's path
$path = $_SERVER['REQUEST_URI'];

// Remove the base path from the user's path
$path = str_replace($basePath, '', $path);

// Remove any leading or trailing slashes
$path = trim($path, '/');
// i want to remove the get params from the path
$path = explode('?', $path)[0];
// echo $path;
// Define the available endpoints and their corresponding functions
$endpoints = [
    "endpoints" => "getEndpoints",
    "core/v1/devices" => "Core_getDevices",
    "core/v1/devices/{String}" => "Core_getSingleDevices",
    // Core_sendDeviceInformationCommand
    "core/v1/commands/{String}/{String}" => "Core_sendDeviceInformationCommand",
    "core/v1/commands/{String}/null" => "Core_sendDeviceInformationCommandnull",
    "core/v1/incomingevent" => "Core_incomingevent",
    "v1/sendcommand/{String}" => "sendDeviceCommand",
    // deviceCommands
    "v1/deviceCommands" => "deviceCommands",
    // getDevicesSmall
    "v1/getDevicesSmall" => "getDevicesSmall",
    "v1/device/{String}/state" => "getDeviceState",
    "v1/device/{String}/setUser{POST}" => "device_setUser",
    // v1/device/268D911A-2F54-53E0-99A9-DAF1631D2CFA/push/apps
    "v1/device/{String}/push/apps" => "device_pushApps",
    // v1/device/00008110-0014053001C2801E/removeApp
    "v1/device/{String}/removeApp{POST}" => "device_removeApp",
    // /v1/device/${device.udid}/installProfile
    "v1/device/{String}/installProfile{POST}" => "device_installProfile",
    // /v1/device/${device.udid}/removeProfile
    "v1/device/{String}/removeProfile{POST}" => "device_removeProfile",

    "v1/system/mdm/enroll" => "system_mdm_enroll",
    "v1/system/apps/download/{String}" => "Apps_Createmanifest",
    "v1/users/list" => "Users_listall",
    "v1/apps/get" => "Apps_get",
    "v1/app/upload" => "Apps_upload",
    "v1/app/images/{String}" => "Apps_getImage",
    "v1/apps/device/push" => "Apps_pushToDevices",
    //

    // v1/profiles/get
    "v1/profiles/get" => "Profiles_get",
    // v1/profile/upload
    "v1/profile/upload" => "Profiles_upload",
    "v1/profiles/device/push" => "Profiles_pushToDevices",
    // Profiles_removeFromDevices
    "v1/profiles/device/remove" => "Profiles_removeFromDevices",
    // /v1/profile/create
    "v1/profile/create" => "Profiles_create",
    // v1/profile/b6a2ff0b-1adc-4539-9dea-25a95b18ef45/save
    "v1/profile/{String}/save" => "Profiles_save",
    // v1/profiles/b6a2ff0b-1adc-4539-9dea-25a95b18ef45/get
    "v1/profiles/{String}/get" => "Profiles_getSingle",
    //  download url
    "v1/profiles/{String}/download" => "Profiles_download",
    // Profiles_downloadJson
    "v1/profiles/{String}/downloadJson" => "Profiles_downloadJson",

    // EventQueue_list
    "v1/EventQueue/list" => "EventQueue_list",


    "v1/iconserver/{String}" => "iconserver",


    "v1/system/mdm/TDSLocationTracking/postendpoint" => "TDSLocationTracking",
    "v1/system/mdm/TDSLocationTracking/RequestUpdate" => "TDSLocationTracking_RequestLocationUpdate",
    "v1/system/mapping/token" => "TDSLocationTracking_MapToken",




    // Auto enroll
    //MDMServiceConfig
    // "v1/system/mdm/config" => "MDMServiceConfig",


];

// echo $path;
// inlucd the conetnrs of this dir /Library/Server/Web/Data/Sites/status.thomasdye.net/app/funcs

include_once "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/funcs/include.php";

// Check if the requested path matches any endpoint
$matchedEndpoint = null;
$matchedParams = [];
foreach ($endpoints as $endpoint => $function) {
    // Convert the endpoint to a regular expression pattern
    $pattern = '/^' . str_replace('/', '\/', $endpoint) . '$/';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // remove {POST} from the path
        $pattern = str_replace('{POST}', '', $pattern);
    }
    // Replace {id} with \w+ to match any alphanumeric value
    $pattern = str_replace('{id}', '([0-9a-f]{6,8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{10,12})', $pattern);
    $pattern = str_replace('{all}', '(all)', $pattern);
    $pattern = str_replace('{String}', '([\w.\\-]+)', $pattern);
    //   string with space as %20 
    $pattern = str_replace('{String+}', '([\w.\\-\s]+)', $pattern);
    // string optional 
    $pattern = str_replace('{String?}', '([\w.\\-]*)', $pattern);
    // string optional 
    $pattern = str_replace('{String?}', '([\w.\\-]*)', $pattern);
    $pattern = str_replace('{date-formatted}', '(\d{4}-\d{2}-\d{2})', $pattern);
    // match rgb(255,255,255) optional

    $pattern = str_replace('{rgb}', '(rgb\(\d{1,3},\d{1,3},\d{1,3}\))', $pattern);
    // rgb(255%2C255%2C255)
    $pattern = str_replace('{rgb%}', '(rgb\(\d{1,3}%2C\d{1,3}%2C\d{1,3}\))', $pattern);
    // match #00000000 optional, between 5 and 8 characters, 09AF
    $pattern = str_replace('{hex}', '(%23[0-9A-Fa-f]{5,8})', $pattern);
    // one for tiem 19:00
    $pattern = str_replace('{time}', '(\d{2}:\d{2})', $pattern);

    // Check if the path matches the pattern
    if (preg_match($pattern, $path, $matches)) {
        $matchedEndpoint = $endpoint;
        $matchedParams = array_slice($matches, 1);
        break;
    }
}

// if its post request get the post data and add it as a param
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // check the content type
    if (isset($_SERVER["CONTENT_TYPE"]) && strpos($_SERVER["CONTENT_TYPE"], "application/json") !== false) {
        $matchedParams[] = json_decode(file_get_contents('php://input'), true);
    } else {
        $matchedParams[] = file_get_contents('php://input');
    }
}
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // check the content type
    if (isset($_SERVER["CONTENT_TYPE"]) && strpos($_SERVER["CONTENT_TYPE"], "application/json") !== false) {
        $matchedParams[] = json_decode(file_get_contents('php://input'), true);
    } else {
        $matchedParams[] = file_get_contents('php://input');
    }
}

//  if the paht is not core/incomingevent thenw e need to auth
$excludedEndpoints = [
    "core/v1/incomingevent",
    "v1/system/mdm/enroll",
    "v1/system/apps/download/{String}",
    "v1/system/mdm/config",
    "v1/system/mdm/TDSLocationTracking/postendpoint"
];

// Check if the matched endpoint is not in the excluded list
if (!in_array($matchedEndpoint, $excludedEndpoints)) {
    // Include the JWT authentication script
    include_once "/Server/app/auth/VAuthJWT.php";
    
    // Fetch user info from JWT
    $userinfo = getuserinfofromjwt();
    
    // Append the user info to the matched parameters
    $matchedParams[] = $userinfo;
}

if ($matchedEndpoint) {
    try {
        $function = $endpoints[$matchedEndpoint];
        // set json header
        header('Content-Type: application/json');
        $reponse = call_user_func_array($function, $matchedParams);
        // if the key error is set then there was an error
        if (isset($reponse["error"])) {
            // set error code 
            http_response_code(isset($reponse["code"]) ? $reponse["code"] : 400);
            // return the error
        }
        // check the response is not null 
        if ($reponse != null) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($reponse, JSON_PRETTY_PRINT);
        }
    } catch (ArgumentCountError $e) {
        // set error code 
        http_response_code(400);
        // Handle the error here
        // You can log the error, display a custom error message, or perform any other necessary actions
        echo "An error occurred: " . $e->getMessage();
    }
    // Call the corresponding function and pass the matched parameters
    // echo call_user_func_array($function, $matchedParams);
} else {
    // No matching endpoint found, set 404 status
    http_response_code(404);
    echo "404 - Not Found, path not found";
}
