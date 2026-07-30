<?php


function VisionPRO_App_Device_getAvailableApps(){

    global $MDMApps, $MDMdevices;

    $output = array();
    $apps = $MDMApps->find();

    foreach ($apps as $app) {
        $output[] = array(
            "id" => (string)$app["_id"],
            "name" => empty($app["CFBundleDisplayName"]) ? ($app["name"] ?? "") : $app["CFBundleDisplayName"],
            "version" => $app["infolist"]["CFBundleShortVersionString"] ?? "Unknown",
            "BundleIdentifier" => $app["CFBundleIdentifier"] ?? "Unknown",
            "icon" => empty($app["icon"])  ? null : $app["icon"],
            "iconURL" => empty($app["icon"])  ? null : "https://".$GLOBALS["hostName"]."/TDSapi/files/icons/". $app["icon"],
            "uploaded" => $app["uploaded"],
            "installed" => false,
            "installed_info" => null,
            "installURL" => "itms-services://?action=download-manifest&url=".rawurlencode("https://".$GLOBALS["hostName"]."/TDSapi/v1/system/apps/download/".(string)$app["_id"])
        );
    }

    if (empty($output)) {
        return [];
    }

    return $output;

}