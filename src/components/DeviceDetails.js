import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axiosInstance from '../utils/axios';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { formatDistanceToNow } from 'date-fns';

import DeviceHeader from './device/DeviceHeader';
import DeviceInfoItem from './device/DeviceInfoItem';
import CommandBar from './device/CommandBar';
import ManagedApps from './device/ManagedApps';
import ManagedProfiles from './device/ManagedProfiles';
import LocationTab from './device/LocationTab';

const DeviceDetailsContainer = styled.div`
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  background-color: #f5f5f5;
`;

const TabBar = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 2px solid #ccc;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  background: ${(props) => (props.active ? '#007bff' : '#f5f5f5')};
  color: ${(props) => (props.active ? '#fff' : '#000')};
  border: none;
  cursor: pointer;
  margin-right: 5px;
  border-radius: 5px 5px 0 0;
  
  &:hover {
    background: #007bff;
    color: #fff;
  }
`;

const TabContent = styled.div`
  padding: 20px;
  background: #fff;
  border-radius: 0 0 5px 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding-bottom: 40px;
`;



const fetchDeviceDetails = async (udid) => {
    const { data } = await axiosInstance.get(`v1/device/${udid}/state`);
    return data;
};

const fetchUsers = async () => {
    const { data } = await axiosInstance.get(`v1/users/list`);
    return data;
};

const updateDeviceUser = async ({ udid, userId }) => {
    await axiosInstance.post(`v1/device/${udid}/setUser`, { userId });
};

function DeviceDetails() {

    const queryClient = useQueryClient();
    const { udid } = useParams();
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('General Information');

    const { data: deviceData, isLoading: isLoadingDevice, error: errorDevice } = useQuery(
        ['deviceDetails', udid],
        () => fetchDeviceDetails(udid),
        {
            enabled: !!udid,
        }
    );

    const { data: usersData, isLoading: isLoadingUsers, error: errorUsers } = useQuery(
        'users',
        fetchUsers
    );

    const mutation = useMutation(updateDeviceUser, {
        onSuccess: () => {
            queryClient.invalidateQueries('deviceDetails');
        },
    });

    const handleUserChange = (e) => {
        const userId = e.target.value;
        setSelectedUserId(userId);
        mutation.mutate({ udid, userId });
    };

    const sendCommand = (command) => {
        axiosInstance.post(`v1/sendcommand/${udid}`, { command });
    };

    if (!udid) return <div>Select a device to view details</div>;
    if (isLoadingDevice || isLoadingUsers) return <div>Loading...</div>;
    if (errorDevice || errorUsers) return <div>Error fetching data</div>;

    return (
        <>
            <DeviceDetailsContainer>
                <DeviceHeader
                    deviceData={deviceData}
                    selectedUserId={selectedUserId}
                    usersData={usersData}
                    handleUserChange={handleUserChange}
                />

                <TabBar>
                    <TabButton active={activeTab === 'General Information'} onClick={() => setActiveTab('General Information')}>
                        General Information
                    </TabButton>
                    <TabButton active={activeTab === 'OS Update Settings'} onClick={() => setActiveTab('OS Update Settings')}>
                        OS Update Settings
                    </TabButton>
                    <TabButton active={activeTab === 'Installed Applications'} onClick={() => setActiveTab('Installed Applications')}>
                        Installed Applications
                    </TabButton>
                    <TabButton active={activeTab === 'Managed Applications'} onClick={() => setActiveTab('Managed Applications')}>
                        Managed Applications
                    </TabButton>
                    <TabButton active={activeTab === 'Profiles'} onClick={() => setActiveTab('Profiles')}>
                        Profiles
                    </TabButton>
                    {deviceData["net_thomasdye_TDS-LocationTracking"] && (
                        <TabButton active={activeTab === 'Location'} onClick={() => setActiveTab('Location')}>
                            Location
                        </TabButton>
                    )
                    }
                </TabBar>

                <TabContent>
                    {activeTab === 'General Information' && (
                        <>
                            <DeviceInfoItem label="Device Name" value={deviceData.DeviceName} />
                            <DeviceInfoItem label="Model" value={deviceData.Model} />
                            <DeviceInfoItem label="Model Name" value={deviceData.ModelName} />
                            <DeviceInfoItem label="OS Version" value={deviceData.OSVersion} />
                            <DeviceInfoItem label="Build Version" value={deviceData.BuildVersion} />
                            <DeviceInfoItem label="Serial Number" value={deviceData.SerialNumber} />
                            <DeviceInfoItem label="IsSupervised" value={deviceData.IsSupervised ? "YES" : "NO"} />
                            <DeviceInfoItem label="UDID" value={deviceData.udid} />
                            <DeviceInfoItem
                                label="Last Checkin"
                                value={`${new Date(deviceData.lastCheckin * 1000).toLocaleString()} (${formatDistanceToNow(new Date(deviceData.lastCheckin * 1000))} ago)`}
                            />
                            <DeviceInfoItem label="Status" value={deviceData.Status} />
                            <DeviceInfoItem label="Enrollment Status" value={deviceData.enrollment_status ? 'Enrolled' : 'Not Enrolled'} />
                            <DeviceInfoItem label="Battery Level" value={`${deviceData.BatteryLevel * 100}%`} />
                            {deviceData.WiFiMAC && <DeviceInfoItem label="WiFi MAC" value={deviceData.WiFiMAC} />}
                            {deviceData.BluetoothMAC && <DeviceInfoItem label="Bluetooth MAC" value={deviceData.BluetoothMAC} />}
                        </>
                    )}
                    {activeTab === 'OS Update Settings' && deviceData.OSUpdateSettings && (
                        <>
                            <DeviceInfoItem label="Auto Check Enabled" value={deviceData.OSUpdateSettings.AutoCheckEnabled ? 'Yes' : 'No'} />
                            <DeviceInfoItem label="Automatic App Installation" value={deviceData.OSUpdateSettings.AutomaticAppInstallationEnabled ? 'Yes' : 'No'} />
                            <DeviceInfoItem label="Automatic OS Installation" value={deviceData.OSUpdateSettings.AutomaticOSInstallationEnabled ? 'Yes' : 'No'} />
                            <DeviceInfoItem label="Automatic Security Updates" value={deviceData.OSUpdateSettings.AutomaticSecurityUpdatesEnabled ? 'Yes' : 'No'} />
                            <DeviceInfoItem label="Background Download Enabled" value={deviceData.OSUpdateSettings.BackgroundDownloadEnabled ? 'Yes' : 'No'} />
                            <DeviceInfoItem label="Is Default Catalog" value={deviceData.OSUpdateSettings.IsDefaultCatalog ? 'Yes' : 'No'} />
                            <DeviceInfoItem label="Catalog URL" value={deviceData.OSUpdateSettings.CatalogURL} />
                            <DeviceInfoItem
                                label="Previous Scan Date"
                                value={new Date(deviceData.OSUpdateSettings.PreviousScanDate * 1000).toLocaleString()}
                            />
                        </>
                    )}

                    {activeTab === 'Installed Applications' && deviceData.InstalledApplicationList && deviceData.InstalledApplicationList.length > 0 && (
                        <ul>
                            {deviceData.InstalledApplicationList.map((app) => (
                                <li key={app.Identifier}>
                                    <DeviceInfoItem label="Name" value={app.Name} />
                                    <DeviceInfoItem label="Identifier" value={app.Identifier} />
                                    <DeviceInfoItem label="Version" value={app.Version} />
                                    <DeviceInfoItem label="Bundle Size" value={`${app.BundleSize} bytes`} />
                                </li>
                            ))}
                        </ul>
                    )}

                    {activeTab === 'Managed Applications' && deviceData.managedApps && deviceData.managedApps.length > 0 && (
                        <ManagedApps ManagedApplications={deviceData.managedApps} device={deviceData} />
                    )}
                    {activeTab === 'Profiles' && deviceData.profiles && deviceData.profiles.length > 0 && (
                        <ManagedProfiles ManagedApplications={deviceData.profiles} device={deviceData} />
                    )}
                    {activeTab === 'Location' && deviceData["net_thomasdye_TDS-LocationTracking"].location && (
                        <LocationTab location={deviceData["net_thomasdye_TDS-LocationTracking"].location} />
                    )}
                </TabContent>
                <CommandBar udid={udid} sendCommand={sendCommand} />
            </DeviceDetailsContainer>

           
        </>
    );
}

export default DeviceDetails;
