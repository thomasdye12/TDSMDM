<?php


//  https://auth.thomasdye.net/auth/app/profilemanager/User/list

function Users_listall(){
    $url = "https://auth.thomasdye.net/auth/app/profilemanager/User/list";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Authorization: Bearer ' .$GLOBALS["JWT"]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $output = curl_exec($ch);
    curl_close($ch);
    return json_decode($output, true);
}

function Users_single($id){
    $url = "https://auth.thomasdye.net/auth/app/profilemanager/User/".$id;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Authorization: Bearer ' .$GLOBALS["JWT"]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $output = curl_exec($ch);
    curl_close($ch);
    return json_decode($output, true);
}
