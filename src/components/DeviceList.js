import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axiosInstance from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {deviceIconName} from './device/deviceIconfunction';

const fetchDevices = async () => {
  const { data } = await axiosInstance.get('/v1/getDevicesSmall');
  return data;
};

const DeviceListContainer = styled.div`
  width: 300px;
  background-color: #f7f7f7;
  padding: 20px;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  
  ul {
    display: inline;
    padding: 0;
  }
`;

const SearchInput = styled.input`
  width: calc(100% - 40px);
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 20px;
  border: 1px solid #ccc;
  font-size: 14px;
  outline: none;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const DeviceItem = styled.li`
  padding: 15px;
  margin-bottom: 10px;
  background-color: #ffffff;
  border-radius: 10px;
  cursor: pointer;
  list-style: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s, transform 0.3s;

  &:hover {
    background-color: #f0f0f0;
    transform: translateY(-2px);
  }

  &:not(:last-child) {
    margin-bottom: 15px;
  }
`;

const DeviceContainer = styled.div`
  padding: 2px;
//   border-left: 3px solid #007bff;
  display: flex;
  align-items: center;
`;

const DeviceInfo = styled.p`
  margin: 2px 0;
  font-size: 14px;
  color: #555;
`;

const DeviceTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
`;

const Icon = styled.span`
  margin-right: 10px;
`;



const Device = ({ device }) => {
  const iconClass = deviceIconName(device.ModelName);

  return (
    <DeviceContainer>
      <Icon className={iconClass}></Icon>
      <div>
        <DeviceTitle>{device.DeviceName}</DeviceTitle>
        <DeviceInfo><strong>OS Version:</strong> {device.OSVersion}</DeviceInfo>
        <DeviceInfo><strong>Model Name:</strong> {device.ModelName}</DeviceInfo>
        <DeviceInfo><strong>Enrollment Status:</strong> {device.enrollment_status ? 'Enrolled' : 'Not Enrolled'}</DeviceInfo>
        {device.user && (
          <DeviceInfo><strong>User Name:</strong> {device.user.name ?? device.user.username}</DeviceInfo>
        )}
      </div>
    </DeviceContainer>
  );
};

function DeviceList() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery('devices', fetchDevices);
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching devices</div>;

  const filteredDevices = data.filter(device =>
    searchQuery === '' || device.DeviceName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DeviceListContainer>
      <SearchInput
        type="text"
        placeholder="Search devices..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <ul>
        {filteredDevices.map((device) => (
          <DeviceItem
            key={device.udid}
            onClick={() => navigate(`/devices/${device.udid}`)}
          >
            <Device device={device} />
          </DeviceItem>
        ))}
      </ul>
    </DeviceListContainer>
  );
}

export default DeviceList;
