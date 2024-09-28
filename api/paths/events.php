<?php


function EventQueue_list(){
    global $MDMEventQueue;
    //  find where complete is not set to true
    $cursor = $MDMEventQueue->find(["complete" => ['$ne' => true]]);
    $events = array();
    foreach ($cursor as $document) {
        $document["eventicon"] = EventQueue_Icon($document);
        $events[] = $document;
    }
    // flip the array so the newest is first
    $events = array_reverse($events);
    return $events;
}

// create the event icon object

function EventQueue_Icon($event) {

    if ($event["command"]["request_type"] == "InstallApplication") {
        return "task_icon_push_apps_32_2x";
    }


    // task_icon_update_dep_profile_32_2x - InstallProfile
    if ($event["command"]["request_type"] == "InstallProfile") {
        return "task_icon_update_dep_profile_32_2x";
    }
    // task_icon_clear_passcode_32 ClearPasscode
    if ($event["command"]["request_type"] == "ClearPasscode") {
        return "task_icon_clear_passcode_32";
    }
    // DeviceLocation = task_icon_device_location_32_2x
    if ($event["command"]["request_type"] == "DeviceLocation") {
        return "task_icon_device_location_32_2x";
    }
    // EnableLostMode = task_icon_enable_lost_mode_32_2x
    if ($event["command"]["request_type"] == "EnableLostMode") {
        return "task_icon_enable_lost_mode_32_2x";
    }
    // RequestMirroring =task_icon_request_airplay_mirroring_32_2x
    if ($event["command"]["request_type"] == "RequestMirroring") {
        return "task_icon_request_airplay_mirroring_32_2x";
    }


    return "task_icon_update_info_32";
}