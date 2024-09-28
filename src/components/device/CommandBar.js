import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { IoCogOutline } from "react-icons/io5";
import { FaAppStoreIos } from "react-icons/fa";
import { useQuery } from 'react-query';
import axiosInstance from '../../utils/axios';

// Styled components
const CommandBarContainer = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: #f5f5f5;
  border-top: 1px solid #ccc;
  padding: 10px 20px;
  display: flex;
  align-items: center;
`;

const CogIcon = styled(IoCogOutline)`
  font-size: 24px;
  cursor: pointer;

  &:hover {
    color: #007bff;
  }
`;

const AppIcon = styled(FaAppStoreIos)`
  font-size: 24px;
  cursor: pointer;

  &:hover {
    color: #007bff;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
  z-index: 1000;
`;

const ModalContent = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  z-index: 1001;
  width: 400px;
  max-width: 100%;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  color: white;
  background-color: #dc3545;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #c82333;
  }
`;

const CommandSelect = styled.select`
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
`;

const TextField = styled.input`
  width: 95%;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
`;

const PinField = styled.input`
  width: 95%;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
`;

const DropdownField = styled.select`
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
`;

const AppCheckbox = styled.div`
  margin-bottom: 10px;
  display: flex;
  align-items: center;
`;

const AppLabel = styled.label`
  margin-left: 10px;
`;

const fetchDevices = async () => {
  const { data } = await axiosInstance.get('/v1/getDevicesSmall');
  return data;
};

const fetchApps = async () => {
  const { data } = await axiosInstance.get('/v1/apps/get');
  return data;
};

const CommandBar = ({ sendCommand }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOption, setModalOption] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedApps, setSelectedApps] = useState([]);
  const [textFields, setTextFields] = useState({});

  // Fetch devices and apps using react-query
  const { data: availableDevices, isLoading: isLoadingDevices, error: devicesError } = useQuery('devices', fetchDevices);
  const { data: availableApps, isLoading: isLoadingApps, error: appsError } = useQuery('apps', fetchApps);

  // Automatically select the first device as the current device
  useEffect(() => {
    if (availableDevices && availableDevices.length > 0) {
      setSelectedDevice(availableDevices[0].udid);
    }
  }, [availableDevices]);

  // Example JSON array of commands with dynamic field configuration
  const commands = [
    { id: 1, name: "Device Information", command: "DeviceInformation", requiresDeviceSelection: false },
    { id: 2, name: "Installed Application List", command: "InstalledApplicationList", requiresDeviceSelection: false },
    { id: 3, name: "Device Location", command: "DeviceLocation", requiresDeviceSelection: false },
    { id: 4, name: "Send Message", command: "SEND_MESSAGE", requiresDeviceSelection: false, fields: [{ id: 'message', label: 'Message', type: 'text' }] },
    { id: 5, name: "AirPlay to Device", command: "RequestMirroring", requiresDeviceSelection: true },
    { id: 6, name: "Stop AirPlay", command: "StopMirroring", requiresDeviceSelection: false },
    { id: 7, name: "Enable Remote Desktop", command: "EnableRemoteDesktop", requiresDeviceSelection: false },
    { id: 8, name: "Restart Device", command: "RestartDevice", requiresDeviceSelection: false },
    { id: 9, name: "EnableLostMode", command: "EnableLostMode", requiresDeviceSelection: false, fields: [{ id: 'footnote', label: 'Footnote', type: 'text' }, { id: 'message', label: 'Message', type: 'text' }, { id: 'phone_number', label: 'PhoneNumber', type: 'text' }] },
    { id: 10, name: "Play Lost Mode Sound", command: "PlayLostModeSound", requiresDeviceSelection: false },
    { id: 11, name: "Disable Lost Mode", command: "DisableLostMode", requiresDeviceSelection: false },
    // { id: 12, name: "Settings", command: "Settings", requiresDeviceSelection: false, fields: [{ id: 'id', label: 'Setting', type: 'dropdown', options: ['DeviceName'] }, { id: 'value', label: 'value', type: 'text' }] },
    // ActivationLockBypassCode
    { id: 13, name: "Activation Lock Bypass Code", command: "ActivationLockBypassCode", requiresDeviceSelection: false },
    // SecurityInfo
    { id: 14, name: "Security Info", command: "SecurityInfo", requiresDeviceSelection: false },
    // ClearPasscode
    { id: 15, name: "Clear Passcode", command: "ClearPasscode", requiresDeviceSelection: false },
    // DeviceLock
    { id: 16, name: "Device Lock", command: "DeviceLock", requiresDeviceSelection: false, fields: [{ id: 'pin', label: 'PIN', type: 'pin', length: 6 }, { id: 'message', label: 'Message', type: 'text' }, { id: 'phone_number', label: 'Phone Number', type: 'text' }] },
    // DeviceLock
    { id: 16, name: "Set Organization", command: "SettingsCommand.Command.Settings.OrganizationInfo", requiresDeviceSelection: false, fields: [{ id: 'OrganizationName', label: 'OrganizationName', type: 'text'}, { id: 'OrganizationMagic', label: 'OrganizationMagic', type: 'text' }, { id: 'OrganizationEmail', label: 'OrganizationEmail', type: 'text' }, { id: 'OrganizationPhone', label: 'OrganizationPhone', type: 'text' }, { id: 'OrganizationShortName', label: 'OrganizationShortName', type: 'text' } , { id: 'OrganizationAddress', label: 'OrganizationAddress', type: 'text' }] },
  ];

  const handleCogClick = () => {
    setModalOption("command");
    setIsModalOpen(true);
  };

  const handleAppStoreClick = () => {
    setModalOption("apps");
    setIsModalOpen(true);
  };

  const handleTextFieldChange = (fieldId, value) => {
    setTextFields(prevState => ({
      ...prevState,
      [fieldId]: value,
    }));
  };

  const handlePinChange = (fieldId, value) => {
    // Ensure only numeric input and enforce 6 digits
    if (/^\d{0,6}$/.test(value)) {
      setTextFields(prevState => ({
        ...prevState,
        [fieldId]: value,
      }));
    }
  };

  const handleConfirmClick = () => {
    if (modalOption === "command") {
      if (selectedCommand) {
        const commandPayload = {
          command: selectedCommand,
          targetDevice: selectedDevice,
          fields: textFields,
        };
        sendCommand(commandPayload);
        setIsModalOpen(false);
        setModalOption(false);
      } else {
        alert('Please select a command');
      }
    } else if (modalOption === "apps") {
      if (selectedApps.length === 0) {
        alert('Please select at least one app to push');
        return;
      }
      axiosInstance.post(`/v1/device/${selectedDevice}/push/apps`, { apps: selectedApps, targetDevice: selectedDevice });
      setIsModalOpen(false);
      setModalOption(false);
    }
  };

  const handleAppSelection = (appId) => {
    setSelectedApps((prevSelected) =>
      prevSelected.includes(appId)
        ? prevSelected.filter((id) => id !== appId)
        : [...prevSelected, appId]
    );
  };

  if (isLoadingDevices || isLoadingApps) return <div>Loading...</div>;
  if (devicesError || appsError) return <div>Error fetching data</div>;

  return (
    <>
      <CommandBarContainer>
        <CogIcon onClick={handleCogClick} />
        <AppIcon onClick={handleAppStoreClick} />
      </CommandBarContainer>

      <ModalOverlay isOpen={isModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{modalOption === "command" ? "Select Command" : "Select Apps"}</ModalTitle>
            <CloseButton onClick={() => setIsModalOpen(false)}>&times;</CloseButton>
          </ModalHeader>

          {modalOption === "command" && (
            <>
              <CommandSelect
                value={selectedCommand}
                onChange={(e) => setSelectedCommand(e.target.value)}
              >
                <option value="" disabled>Select a command</option>
                {commands.map((cmd) => (
                  <option key={cmd.id} value={cmd.command}>
                    {cmd.name}
                  </option>
                ))}
              </CommandSelect>

              {commands.find(cmd => cmd.command === selectedCommand)?.fields?.map(field => (
                field.type === 'text' ? (
                  <TextField
                    key={field.id}
                    type="text"
                    placeholder={field.label}
                    value={textFields[field.id] || ''}
                    onChange={(e) => handleTextFieldChange(field.id, e.target.value)}
                  />
                ) : field.type === 'pin' ? (
                  <PinField
                    key={field.id}
                    type="text"
                    placeholder={field.label}
                    maxLength={6}
                    value={textFields[field.id] || ''}
                    onChange={(e) => handlePinChange(field.id, e.target.value)}
                  />
                ) : field.type === 'dropdown' ? (
                  <DropdownField
                    key={field.id}
                    value={textFields[field.id] || ''}
                    onChange={(e) => handleTextFieldChange(field.id, e.target.value)}
                  >
                    <option value="" disabled>Select {field.label}</option>
                    {field.options.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </DropdownField>
                ) : null
              ))}
            </>
          )}

          {modalOption === "apps" && (
            <>
              {availableApps.map((app) => (
                <AppCheckbox key={app.id}>
                  <input
                    type="checkbox"
                    id={app.id}
                    checked={selectedApps.includes(app.id)}
                    onChange={() => handleAppSelection(app.id)}
                  />
                  <AppLabel htmlFor={app.id}>{app.CFBundleDisplayName || app.name}</AppLabel>
                </AppCheckbox>
              ))}
            </>
          )}

          <ConfirmButton onClick={handleConfirmClick}>Confirm</ConfirmButton>
        </ModalContent>
      </ModalOverlay>
    </>
  );
};

export default CommandBar;
