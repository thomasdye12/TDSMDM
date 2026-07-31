<?php


// getEndpoints

function getEndpoints() {
    return array("endpoints" => $GLOBALS["endpoints"],"incomignip" => $_SERVER['REMOTE_ADDR']);
}

//  function to add an array of endpoints to the endpoints array

function addEndpoints($endpoints) {
    $GLOBALS["endpoints"] = array_merge($GLOBALS["endpoints"], $endpoints);
}



// file_get_contents that uses curl if available
function file_get_contents_curl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    // set a header for the proxy ip
    curl_setopt($ch, CURLOPT_HTTPHEADER, array("X-Forwarded-For: " . $_SERVER['REMOTE_ADDR']));
    $data = curl_exec($ch);
    // get the headers, all headers 
    // $headers = curl_getinfo($ch);
    // echo json_encode($headers);
    curl_close($ch);
    return $data;
}