<?php
class JsonToPlistConverter
{
    private $data;

    public function __construct($json)
    {
        $this->data = $json;
    }

    public function createPlist()
    {
        $dom = new DOMDocument('1.0', 'UTF-8');
        $dom->formatOutput = true;

        // Create the doctype
        $implementation = new DOMImplementation();
        $doctype = $implementation->createDocumentType('plist', '-//Apple//DTD PLIST 1.0//EN', 'http://www.apple.com/DTDs/PropertyList-1.0.dtd');
        $dom->appendChild($doctype);

        // Root plist element
        $plist = $dom->createElement('plist');
        $plist->setAttribute('version', '1.0');
        $dom->appendChild($plist);

        // Create the main dictionary
        $dict = $dom->createElement('dict');
        $plist->appendChild($dict);

        // Add PayloadContent key and array
        $payloadContentArray = $this->createPayloadContent($dom);
        $dict->appendChild($dom->createElement('key', 'PayloadContent'));
        $dict->appendChild($payloadContentArray);

        // Add other root-level keys
        $this->addRootKeys($dom, $dict);

        return $dom->saveXML();
    }

    private function createPayloadContent($dom)
    {
        $array = $dom->createElement('array');

        $sections = [
            'wifi' => ['isArray' => true, "PayloadType" => "com.apple.wifi.managed"],
            'certificates' => ['isArray' => true, "PayloadType" => "com.apple.security.root"],
            'domains' => ['isArray' => true, "PayloadType" => "com.apple.domains"],
            'loginWindowSettings' => ['isArray' => false, "PayloadType" => "com.apple.loginwindow"]
        ];

        foreach ($sections as $key => $section) {
            if (isset($this->data[$key])) {
                $payloads = $section['isArray'] ? $this->data[$key] : [$this->data[$key]];
                foreach ($payloads as $payloadData) {
                    $payloadDict = $this->createGenericPayload($dom, $payloadData, $section['PayloadType']);
                    $array->appendChild($payloadDict);
                }
            }
        }

        return $array;
    }

    private function createGenericPayload($dom, $data, $type)
    {
        $dict = $dom->createElement('dict');

        foreach ($data as $key => $value) {
            $this->appendKeyValuePair($dom, $dict, $key, $value, $type);
        }

        $this->addStaticFields($dom, $dict, $type);

        return $dict;
    }

    private function appendKeyValuePair($dom, &$dict, $key, $value, $type)
    {
        $dict->appendChild($dom->createElement('key', $key));

        if (is_bool($value)) {
            $dict->appendChild($dom->createElement($value ? 'true' : 'false'));
        } elseif (is_array($value) || is_object($value)) {
            $arrayElement = $dom->createElement('array');
            foreach ($value as $itemKey => $itemValue) {
                if (is_array($itemValue) || is_object($itemValue)) {
                    $subDict = $dom->createElement('dict');
                    $this->appendKeyValuePair($dom, $subDict, $itemKey, $itemValue, $type);
                    $arrayElement->appendChild($subDict);
                } else {
                    $arrayElement->appendChild($dom->createElement('string', htmlspecialchars($itemValue)));
                }
            }
            $dict->appendChild($arrayElement);
        } elseif (is_numeric($value)) {
            $dict->appendChild($dom->createElement(is_int($value) ? 'integer' : 'real', $value));
        } elseif (is_string($value)) {
            if ($type === 'com.apple.security.root' && $key === 'PayloadContent') {
                $dict->appendChild($dom->createElement('data', trim($value)));
            } else {
                $dict->appendChild($dom->createElement('string', htmlspecialchars($value)));
            }
        } else {
            $dict->appendChild($dom->createElement('string', htmlspecialchars((string)$value)));
        }
    }

    private function addStaticFields($dom, &$dict, $type)
    {
        $dict->appendChild($dom->createElement('key', 'PayloadType'));
        $dict->appendChild($dom->createElement('string', $type));

        $dict->appendChild($dom->createElement('key', 'PayloadIdentifier'));
        $dict->appendChild($dom->createElement('string', $this->data['PayloadIdentifier'] . '.' . uniqid()));

        $dict->appendChild($dom->createElement('key', 'PayloadUUID'));
        $dict->appendChild($dom->createElement('string', uniqid()));

        $dict->appendChild($dom->createElement('key', 'PayloadVersion'));
        $dict->appendChild($dom->createElement('integer', '1'));
    }

    private function addRootKeys($dom, &$dict)
    {
        $rootKeys = [
            'PayloadDisplayName' => htmlspecialchars($this->data['PayloadDisplayName']),
            'PayloadIdentifier' => htmlspecialchars($this->data['PayloadIdentifier']),
            'PayloadRemovalDisallowed' => false,
            'PayloadType' => 'Configuration',
            'PayloadUUID' => $this->data['PayloadUUID'],
            'PayloadVersion' => $this->data['PayloadVersion'] ?? 1
        ];

        foreach ($rootKeys as $key => $value) {
            $this->appendKeyValuePair($dom, $dict, $key, $value, 'root');
        }
    }
}


