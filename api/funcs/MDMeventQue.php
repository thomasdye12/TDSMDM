<?php


// this will handle an event queue in the mongoDB for me to know about the MDM events on the system.

function EventQueue_CreateEvent($udid,$data) {
    global $MDMEventQueue;
    // {
    //     "payload": {
    //         "command_uuid": "45696d51-178b-47b4-bfa9-5ff7a520487d",
    //         "command": {
    //             "request_type": "InstallApplication",
    //             "manifest_url": "https://device.server.thomasdye.net/TDSapi/v1/system/apps/download/66d0941360410d48d609885c"
    //         }
    //     }
    // }
    // check there is a payload
    if (!isset($data["payload"])) {
        echo "no payload";
        return false;
    }
    // check there is a command uuid
    if (!isset($data["payload"]["command_uuid"])) {
        echo "no command uuid";
        return false;
    }
    // check there is a command
    if (!isset($data["payload"]["command"])) {
        echo "no command";
        return false;
    }
    $eventlog = array(
        "command_uuid" => $data["payload"]["command_uuid"],
        "command" => $data["payload"]["command"],
        "status" => "Queued",
        "created_at" => time(),
        "user" => $GLOBALS["userinfo"]["GeneratedUID"],
        "udid" => $udid,
        "statekey" => 0
    );
    echo "inserting event";
    $MDMEventQueue->insertOne($eventlog);
}

// upadte a event in the queue
function EventQueue_UpdateEventraw($data,$event) {
    $command_uuid = $event["command_uuid"] ?? "";
    $updateevent = [];
    if ($event["status"]  == "Acknowledged") {
        $updateevent["status"] = "Acknowledged";
        $updateevent["update_at"] = time();
        $updateevent["statekey"] = 1;
        $updateevent["complete"] = true;
    }
    if ($event["status"]  == "Error") {
        $updateevent["status"] = "error";
        $updateevent["update_at"] = time();
        $updateevent["statekey"] = 3;
        $updateevent["message"] = $data["ErrorChain"][0]["LocalizedDescription"] ?? "";
    }

    // updat the event
    global $MDMEventQueue;

    $MDMEventQueue->updateOne(
        ["command_uuid" => $command_uuid],
        ['$set' => $updateevent]
    );

 
}