import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axiosInstance from '../../utils/axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Upload from './UploadApp';
import AppSingleCell from './AppSingleCell';

// Fetch apps and devices
const fetchApps = async () => {
    const { data } = await axiosInstance.get('/v1/apps/get');
    return data;
};

const fetchDevices = async () => {
    const { data } = await axiosInstance.get('/v1/getDevicesSmall');
    return data;
};

// Styled components
const AppListContainer = styled.div`
  width: 100%;
  background-color: #f7f7f7;
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 300px;
  padding: 10px;
  border-radius: 20px;
  border: 1px solid #ccc;
  font-size: 14px;
  outline: none;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.th`
  padding: 15px;
  background-color: #007bff;
  color: white;
  text-align: left;
  border-bottom: 1px solid #ddd;
`;

const TableCell = styled.td`
  padding: 15px;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
`;

const AppIcon = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 10px;
  object-fit: cover;
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
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
  background-color: #28a745;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #218838;
  }
`;

const DeviceCheckbox = styled.div`
  margin-bottom: 10px;
  display: flex;
  align-items: center;
`;

const DeviceLabel = styled.label`
  margin-left: 10px;
`;

function AppList() {
    const {
        data: apps,
        isLoading: isAppsLoading,
        error: appsError,
        refetch: refetchApps,
    } = useQuery('apps', fetchApps);
    const {
        data: devices,
        isLoading: isDevicesLoading,
        error: devicesError,
    } = useQuery('devices', fetchDevices);

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    const [selectedDevices, setSelectedDevices] = useState([]);

    const handlePushApp = (app) => {
        setSelectedApp(app);
        setIsModalOpen(true);
    };

    const handleDeviceChange = (deviceUdid) => {
        setSelectedDevices((prevSelected) =>
            prevSelected.includes(deviceUdid)
                ? prevSelected.filter((udid) => udid !== deviceUdid)
                : [...prevSelected, deviceUdid]
        );
    };

    const handleSelectAllDevices = (e) => {
        if (e.target.checked) {
            setSelectedDevices(devices.map((device) => device.udid));
        } else {
            setSelectedDevices([]);
        }
    };

    const handleConfirmPush = async () => {
        if (selectedDevices.length === 0) {
            alert('Please select at least one device');
            return;
        }

        const payload = {
            appId: selectedApp.id,
            deviceUdids: selectedDevices,
        };

        try {
            await axiosInstance.post('/v1/apps/device/push', payload);
            alert('App pushed successfully!');
            setIsModalOpen(false);
            setSelectedDevices([]);
        } catch (error) {
            console.error('Error pushing app:', error);
            alert('Failed to push app. Please try again.');
        }
    };

    if (isAppsLoading || isDevicesLoading) return <div>Loading...</div>;
    if (appsError || devicesError) return <div>Error fetching data</div>;

    const filteredApps = apps?.filter((app) => {
        if (searchQuery === '') return true;
        return (
            app.CFBundleDisplayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    return (
        <AppListContainer>
            <HeaderContainer>
                <SearchInput
                    type="text"
                    placeholder="Search apps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Upload onUploadSuccess={refetchApps} />
            </HeaderContainer>
            <Table>
                <thead>
                    <tr>
                        <TableHeader></TableHeader>
                        <TableHeader>App Name</TableHeader>
                        <TableHeader>Version</TableHeader>
                        <TableHeader>Bundle ID</TableHeader>
                        <TableHeader>Uploaded</TableHeader>
                        <TableHeader>Action</TableHeader>
                    </tr>
                </thead>
                <tbody>
                    {filteredApps.map((app) => {
                        // use the AppSingleCell component to render each app
                        return (

                            <AppSingleCell
                                app={app}
                                handlePushApp={handlePushApp}
                                showpush={true}
                            />
                        );
                
            })}
                </tbody>
            </Table>

            {/* Modal for device selection */}
            <ModalOverlay isOpen={isModalOpen}>
                <ModalContent>
                    <ModalHeader>
                        <ModalTitle>Select Devices</ModalTitle>
                        <CloseButton onClick={() => setIsModalOpen(false)}>&times;</CloseButton>
                    </ModalHeader>
                    <DeviceCheckbox>
                        <input
                            type="checkbox"
                            id="select-all"
                            onChange={handleSelectAllDevices}
                            checked={selectedDevices.length === devices.length}
                        />
                        <DeviceLabel htmlFor="select-all">Select All Devices</DeviceLabel>
                    </DeviceCheckbox>
                    {devices.map((device) => (
                        <DeviceCheckbox key={device.udid}>
                            <input
                                type="checkbox"
                                id={device.udid}
                                checked={selectedDevices.includes(device.udid)}
                                onChange={() => handleDeviceChange(device.udid)}
                            />
                            <DeviceLabel htmlFor={device.udid}>{device.DeviceName}</DeviceLabel>
                        </DeviceCheckbox>
                    ))}
                    <ConfirmButton onClick={handleConfirmPush}>Push App</ConfirmButton>
                </ModalContent>
            </ModalOverlay>
        </AppListContainer>
    );
}

export default AppList;