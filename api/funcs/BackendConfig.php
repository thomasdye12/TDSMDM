<?php


function Auth_Header() {

    return base64_encode("micromdm:" . $GLOBALS["apikey"]);
}