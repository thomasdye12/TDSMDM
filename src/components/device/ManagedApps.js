import React, { useState } from 'react';
import DeviceInfoItem from './DeviceInfoItem';
import AppSingleCell from '../apps/AppSingleCell';
import axiosInstance from '../../utils/axios';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';

const fetchApps = async () => {
    const { data } = await axiosInstance.get('/v1/apps/get');
    return data;
};


const AddAppButton = styled.button`
  margin-bottom: 10px;
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #218838;
  }
`;

const AppDropdown = styled.select`
  margin-top: 10px;
  padding: 8px;
  width: 100%;
  max-width: 300px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ManagedApps = ({ ManagedApplications, device }) => {
    const queryClient = useQueryClient();
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState(null);

    const { data: apps, isLoading: isAppsLoading, error: appsError } = useQuery('apps', fetchApps);

    if (!ManagedApplications || ManagedApplications.length === 0) {
        return <div>No managed applications found.</div>;
    }

    const handlePushApp = (app) => {
        axiosInstance.post(`/v1/device/${device.udid}/push/apps`, { apps: [app.id], targetDevice:device.udid }).then((res) => {
            queryClient.invalidateQueries('deviceDetails');
        });
    };

    const handleRemoveApp = (app) => {
        axiosInstance.post(`/v1/device/${device.udid}/removeApp`, { appId: app.id }).then((res) => {
            queryClient.invalidateQueries('deviceDetails');
        });
    };

    const handleAddAppClick = () => {
        setIsDropdownVisible(!isDropdownVisible);
    };

    const handleAppSelection = (event) => {
        const appId = event.target.value;
        const selectedApp = apps.find(app => app.id === appId);
        if (selectedApp) {
            handlePushApp(selectedApp);
            setIsDropdownVisible(false);
        }
    };

    return (
        <div>
            <AddAppButton onClick={handleAddAppClick}>+ Add App</AddAppButton>
            {isDropdownVisible && apps && (
                <AppDropdown onChange={handleAppSelection} defaultValue="">
                    <option value="" disabled>Select an app...</option>
                    {apps.map((app) => (
                        <option key={app.id} value={app.id}>
                            {app.name}
                        </option>
                    ))}
                </AppDropdown>
            )}
            <ul>
                {ManagedApplications.map((app) => (
                    <AppSingleCell
                        key={app.Identifier}
                        app={app}
                        ShowRemoveButton={true}
                        handleRemoveApp={handleRemoveApp}
                    />
                ))}
            </ul>
        </div>
    );
};

export default ManagedApps;

