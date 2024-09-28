<?php

$GLOBALS["apikey"] = "thomas";
$GLOBALS["host"] = "http://127.0.0.1:6322";

function Auth_Header() {

    return base64_encode("micromdm:" . $GLOBALS["apikey"]);
}