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
            'loginWindowSettings' => ['isArray' => false, "PayloadType" => "com.apple.loginwindow"],
            'sharedDeviceSettings' => ['isArray' => false, "PayloadType" => "com.apple.shareddeviceconfiguration"],
            'restrictionsSettings' => ['isArray' => false, "PayloadType" => "com.apple.applicationaccess"],
            'singleAppModeSettings' => ['isArray' => false, "PayloadType" => "com.apple.app.lock"],
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

        foreach (($this->data['customPayloads'] ?? []) as $payloadData) {
            if (!is_array($payloadData) || empty($payloadData['PayloadType'])) {
                continue;
            }
            $type = $payloadData['PayloadType'];
            $array->appendChild($this->createGenericPayload($dom, $payloadData, $type, true));
        }

        return $array;
    }

    private function createGenericPayload($dom, $data, $type, $preserveEmpty = false)
    {
        $dict = $dom->createElement('dict');

        foreach ((array)$data as $key => $value) {
            if (in_array($key, ['PayloadType', 'PayloadIdentifier', 'PayloadUUID', 'PayloadVersion'], true)) {
                continue;
            }
            $this->appendKeyValuePair($dom, $dict, $key, $value, $type, $preserveEmpty);
        }

        $this->addStaticFields($dom, $dict, $type);

        return $dict;
    }

    private function appendKeyValuePair($dom, &$dict, $key, $value, $type, $preserveEmpty = false)
    {
        if ($value === null || (!$preserveEmpty && (is_array($value) || is_object($value)) && count((array)$value) === 0)) {
            return;
        }

        $dict->appendChild($dom->createElement('key', $key));
        $dict->appendChild($this->createValueElement($dom, $value, $type, $key));
    }

    private function createValueElement($dom, $value, $type = '', $key = '')
    {
        if (is_array($value) && isset($value['__tdsPlistType'])) {
            $plistType = $value['__tdsPlistType'];
            if ($plistType === 'data') {
                $plistValue = (string)($value['value'] ?? '');
                return $dom->createElement('data', preg_replace('/\s+/', '', $plistValue));
            }
            if ($plistType === 'date') {
                $plistValue = (string)($value['value'] ?? '');
                return $dom->createElement('date', $plistValue);
            }
            if ($plistType === 'dictionary') {
                $container = $dom->createElement('dict');
                foreach ((array)($value['value'] ?? []) as $itemKey => $itemValue) {
                    if ($itemValue === null) {
                        continue;
                    }
                    $container->appendChild($dom->createElement('key', (string)$itemKey));
                    $container->appendChild($this->createValueElement($dom, $itemValue, $type, (string)$itemKey));
                }
                return $container;
            }
        }
        if (is_bool($value)) {
            return $dom->createElement($value ? 'true' : 'false');
        }
        if (is_int($value)) {
            return $dom->createElement('integer', (string)$value);
        }
        if (is_float($value)) {
            return $dom->createElement('real', (string)$value);
        }
        if (is_array($value) || is_object($value)) {
            $items = (array)$value;
            $isList = empty($items) || array_keys($items) === range(0, count($items) - 1);
            $container = $dom->createElement($isList ? 'array' : 'dict');
            if ($isList) {
                foreach ($items as $item) {
                    $container->appendChild($this->createValueElement($dom, $item, $type));
                }
            } else {
                foreach ($items as $itemKey => $itemValue) {
                    if ($itemValue === null) {
                        continue;
                    }
                    $container->appendChild($dom->createElement('key', (string)$itemKey));
                    $container->appendChild($this->createValueElement($dom, $itemValue, $type, (string)$itemKey));
                }
            }
            return $container;
        }
        if ($type === 'com.apple.security.root' && $key === 'PayloadContent') {
            return $dom->createElement('data', preg_replace('/\s+/', '', (string)$value));
        }
        return $dom->createElement('string', (string)$value);
    }

    private function addStaticFields($dom, &$dict, $type)
    {
        $dict->appendChild($dom->createElement('key', 'PayloadType'));
        $dict->appendChild($dom->createElement('string', (string)$type));

        $dict->appendChild($dom->createElement('key', 'PayloadIdentifier'));
        $identifierSuffix = preg_replace('/[^A-Za-z0-9.-]/', '-', strtolower($type));
        $dict->appendChild($dom->createElement('string', $this->data['PayloadIdentifier'] . '.' . $identifierSuffix . '.' . uniqid()));

        $dict->appendChild($dom->createElement('key', 'PayloadUUID'));
        $uuid = function_exists('createProfileUUID') ? createProfileUUID() : strtoupper(uniqid());
        $dict->appendChild($dom->createElement('string', $uuid));

        $dict->appendChild($dom->createElement('key', 'PayloadVersion'));
        $dict->appendChild($dom->createElement('integer', '1'));
    }

    private function addRootKeys($dom, &$dict)
    {
        $rootKeys = [
            'PayloadDisplayName' => (string)($this->data['PayloadDisplayName'] ?? 'Configuration Profile'),
            'PayloadIdentifier' => (string)($this->data['PayloadIdentifier'] ?? 'net.thomasdye.mdm.profile'),
            'PayloadOrganization' => (string)($this->data['PayloadOrganization'] ?? 'TDS MDM'),
            'PayloadDescription' => (string)($this->data['PayloadDescription'] ?? ''),
            'PayloadRemovalDisallowed' => (bool)($this->data['PayloadRemovalDisallowed'] ?? false),
            'PayloadScope' => (string)($this->data['PayloadScope'] ?? 'System'),
            'PayloadType' => 'Configuration',
            'PayloadUUID' => $this->data['PayloadUUID'],
            'PayloadVersion' => $this->data['PayloadVersion'] ?? 1
        ];

        if (isset($this->data['DurationUntilRemoval']) && $this->data['DurationUntilRemoval'] !== '') {
            $rootKeys['DurationUntilRemoval'] = (int)$this->data['DurationUntilRemoval'];
        }
        if (!empty($this->data['ConsentText']) && is_array($this->data['ConsentText'])) {
            $rootKeys['ConsentText'] = $this->data['ConsentText'];
        }

        foreach ($rootKeys as $key => $value) {
            $this->appendKeyValuePair($dom, $dict, $key, $value, 'root');
        }
    }
}
