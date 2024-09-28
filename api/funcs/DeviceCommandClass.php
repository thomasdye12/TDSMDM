<?php


class DeviceCommandClass
{
    public $data = array();
    public $commandUUID = "";


    public function __construct($UUID)
    {
        $this->commandUUID = $UUID;
        $this->data = array(
            array(
                "Command" => array(),
                "CommandUUID" =>   $UUID
            )
        );
    }



    public function addItem($position, $data)
    {
        $commandArray = explode(".", $position);
        if ($commandArray[0] == "Command") {
            $commandArray = array_slice($commandArray, 1);
            $this->data[0]["Command"] = array($this->addSubkeydata("Command", $commandArray, $data));
        }
    }





    private function addSubkeydata($previouse, $commandArray, $data)
    {
        if (!count($commandArray) > 1) {
            return;
        }
        $currentCommand = $commandArray[0];

        if ($currentCommand == "Settings") {
            $commandArray = array_slice($commandArray, 1);


            return array("RequestType" => "Settings","Settings" => array(array($this->addSubkeydata("Settings", $commandArray, $data))));
        }
        if ($previouse == "Settings" && $currentCommand == "OrganizationInfo") {
            return   array(
                "Item" => "OrganizationInfo",
                "OrganizationInfo" => array(
                    array(
                        "OrganizationAddress" => $data["OrganizationAddress"] ?? "",
                        "OrganizationEmail" => $data["OrganizationEmail"] ?? "",
                        "OrganizationMagic" => $data["OrganizationMagic"] ?? "",
                        "OrganizationName" => $data["OrganizationName"] ?? "TDS MDM",
                        "OrganizationPhone" => $data["OrganizationPhone"] ?? "",
                        "OrganizationShortName" => $data["OrganizationShortName"] ?? "TDS",
                    )
                )
            );
        }
    }

    //    $commandArray = explode(".", $command);
    //    $data = array();

    //    if ($command[1] == "Command") {

    //        if ($command[2] == "Settings") {
    //            if ($command[3] == "OrganizationInfo") {

    //            }
    //        }
    //    }


    public function getXML()
    {
        return $this->arrayToPlist($this->data)->asXML();
    }

    public function getdata()
    {
        return $this->data;
    }


    private function arrayToPlist($array, $xml = null) {
        // Initialize XML element if it's not passed
        if ($xml === null) {
            $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"></plist>');
        }
    
        // Loop through the array and build the PLIST structure
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                // Handle numerical array differently (array of dictionaries)
                if (array_keys($value) === range(0, count($value) - 1)) {
                    $dict = $xml->addChild("array");
                    $this->arrayToPlist($value, $dict);
                } else {
                    // Add dictionary for associative array
                    $dict = $xml->addChild("dict");
                    foreach ($value as $subKey => $subValue) {
                        $dict->addChild("key", $subKey);
                        if (is_array($subValue)) {
                            $this->arrayToPlist($subValue, $dict);
                        } else {
                            $dict->addChild("string", htmlspecialchars($subValue));
                        }
                    }
                }
            } else {
                // Handle key-value pairs at root level
                $xml->addChild("key", $key);
                $xml->addChild("string", htmlspecialchars($value));
            }
        }
    
        return $xml;
    }
    
}
