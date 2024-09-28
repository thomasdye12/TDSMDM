import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s;

  &:focus {
    border-color: #007bff;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s;

  &:focus {
    border-color: #007bff;
  }
`;

const Toggle = styled.input`
  margin-right: 10px;
`;

const AddButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #0056b3;
  }
`;

const RemoveButton = styled.button`
  padding: 5px 10px;
  font-size: 14px;
  color: white;
  background-color: #dc3545;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #c82333;
  }
`;

const WifiSettings = ({ settings, setSettings }) => {
    const handleAddWifi = () => {
        const newWifi = {
            AutoJoin: false,
            CaptiveBypass: false,
            DisableAssociationMACRandomization: false,
            EncryptionType: 'WPA2',
            HIDDEN_NETWORK: false,
            IsHotspot: false,
            Password: '',
            PayloadDescription: 'Configures Wi-Fi settings',
            PayloadDisplayName: 'Wi-Fi',
            PayloadType: 'com.apple.wifi.managed',
            SSID_STR: '',
        };
        setSettings({
            ...settings,
            wifi: [...(settings.wifi || []), newWifi],
        });
    };

    const handleRemoveWifi = (index) => {
        const updatedWifi = settings.wifi.filter((wifi, i) => i !== index);
        setSettings({
            ...settings,
            wifi: updatedWifi,
        });
    };

    const handleInputChange = (index, field, value) => {
        const updatedWifi = settings.wifi.map((wifi, i) =>
            i === index ? { ...wifi, [field]: value } : wifi
        );
        setSettings({
            ...settings,
            wifi: updatedWifi,
        });
    };

    return (
        <Container>
            <Title>Wi-Fi Settings</Title>
            {settings.wifi?.map((wifi, index) => (
                <Container key={index}>
                    <FormGroup>
                        <Label>SSID:</Label>
                        <Input
                            type="text"
                            value={wifi.SSID_STR}
                            onChange={(e) =>
                                handleInputChange(index, 'SSID_STR', e.target.value)
                            }
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Password:</Label>
                        <Input
                            type="password"
                            value={wifi.Password}
                            onChange={(e) =>
                                handleInputChange(index, 'Password', e.target.value)
                            }
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Encryption Type:</Label>
                        <Select
                            value={wifi.EncryptionType}
                            onChange={(e) =>
                                handleInputChange(index, 'EncryptionType', e.target.value)
                            }
                        >
                            {/*  WEP, WPA, WPA2, WPA3, Any, None */}
                            <option value="WPA2">WPA2</option>
                            <option value="WPA3">WPA3</option>
                            <option value="WEP">WEP</option>
                            <option value="WPA">WPA</option>
                            <option value="Any">Any</option>
                        </Select>
                    </FormGroup>
                    <FormGroup>
                        <Label>
                            <Toggle
                                type="checkbox"
                                checked={wifi.AutoJoin}
                                onChange={(e) =>
                                    handleInputChange(index, 'AutoJoin', e.target.checked)
                                }
                            />
                            Auto Join
                        </Label>
                    </FormGroup>
                    <FormGroup>
                        <Label>
                            <Toggle
                                type="checkbox"
                                checked={wifi.CaptiveBypass}
                                onChange={(e) =>
                                    handleInputChange(index, 'CaptiveBypass', e.target.checked)
                                }
                            />
                            Captive Bypass
                        </Label>
                    </FormGroup>
                    <FormGroup>
                        <Label>
                            <Toggle
                                type="checkbox"
                                checked={wifi.DisableAssociationMACRandomization}
                                onChange={(e) =>
                                    handleInputChange(
                                        index,
                                        'DisableAssociationMACRandomization',
                                        e.target.checked
                                    )
                                }
                            />
                            Disable Association MAC Randomization
                        </Label>
                    </FormGroup>
                    <FormGroup>
                        <Label>
                            <Toggle
                                type="checkbox"
                                checked={wifi.HIDDEN_NETWORK}
                                onChange={(e) =>
                                    handleInputChange(index, 'HIDDEN_NETWORK', e.target.checked)
                                }
                            />
                            Hidden Network
                        </Label>
                    </FormGroup>
                    <FormGroup>
                        <Label>
                            <Toggle
                                type="checkbox"
                                checked={wifi.IsHotspot}
                                onChange={(e) =>
                                    handleInputChange(index, 'IsHotspot', e.target.checked)
                                }
                            />
                            Is Hotspot
                        </Label>
                    </FormGroup>
                    <RemoveButton onClick={() => handleRemoveWifi(index)}>
                        Remove Wi-Fi
                    </RemoveButton>
                </Container>
            ))}
            <AddButton onClick={handleAddWifi}>Add Wi-Fi</AddButton>
        </Container>
    );
};

export default WifiSettings;
