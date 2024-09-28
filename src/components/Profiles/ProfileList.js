import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import axiosInstance from '../../utils/axios';
import styled from 'styled-components';
import Upload from './UploadProfile';  // Assuming the Upload component is in the same folder
import ProfileTableRow from './ProfilelistCell';  // Assuming the ProfileTableRow component is in the same folder

// Fetch profiles and devices
const fetchProfiles = async () => {
  const { data } = await axiosInstance.get('/v1/profiles/get');
  return data;
};

const fetchDevices = async () => {
  const { data } = await axiosInstance.get('/v1/getDevicesSmall');
  return data;
};

// Styled components
const ProfileListContainer = styled.div`
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

const ActionButton = styled.button`
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-right: 10px;

  &:hover {
    background-color: #0056b3;
  }
`;

const RemoveButton = styled(ActionButton)`
  background-color: #dc3545;

  &:hover {
    background-color: #c82333;
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

function ProfileList() {
  const queryClient = useQueryClient();
  const { data: profiles, isLoading: isProfilesLoading, error: profilesError } = useQuery('profiles', fetchProfiles);
  const { data: devices, isLoading: isDevicesLoading, error: devicesError } = useQuery('devices', fetchDevices);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [actionType, setActionType] = useState(''); // 'push' or 'remove'

  const handlePushProfile = (profile) => {
    setSelectedProfile(profile);
    setActionType('push');
    setIsModalOpen(true);
  };

  const handleRemoveProfile = (profile) => {
    setSelectedProfile(profile);
    setActionType('remove');
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

  const handleConfirmAction = async () => {
    if (selectedDevices.length === 0) {
      alert('Please select at least one device');
      return;
    }

    const payload = {
      profileId: selectedProfile.PayloadUUID,
      deviceUdids: selectedDevices,
    };

    if (actionType === 'push') {
      await axiosInstance.post('/v1/profiles/device/push', payload);
    } else if (actionType === 'remove') {
      await axiosInstance.post('/v1/profiles/device/remove', payload); // Adjust the API endpoint as needed
    }

    setIsModalOpen(false);
    queryClient.invalidateQueries('profiles');
  };

  if (isProfilesLoading || isDevicesLoading) return <div>Loading...</div>;
  if (profilesError || devicesError) return <div>Error fetching data</div>;

  const filteredProfiles = profiles?.filter(profile => {
    if (searchQuery === '') return true;
    return profile.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <ProfileListContainer>
      <HeaderContainer>
        <SearchInput
          type="text"
          placeholder="Search profiles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Upload />
      </HeaderContainer>
      <Table>
        <thead>
          <tr>
            <TableHeader>Profile Name</TableHeader>
            <TableHeader>UUID</TableHeader>
            <TableHeader>Action</TableHeader>
          </tr>
        </thead>
        <tbody>
          {filteredProfiles.map((profile) => (
            <ProfileTableRow
              profile={profile}
              onPushProfile={handlePushProfile}
              onRemoveProfile={handleRemoveProfile}
              hidePushButton={false} // Show the Push Profile button
              hideRemoveButton={false} // Hide the Remove Profile button
            />
          ))}
        </tbody>
      </Table>

      {/* Modal for device selection */}
      <ModalOverlay isOpen={isModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{actionType === 'push' ? 'Select Devices to Push Profile' : 'Select Devices to Remove Profile'}</ModalTitle>
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
          <ConfirmButton onClick={handleConfirmAction}>
            {actionType === 'push' ? 'Push Profile' : 'Remove Profile'}
          </ConfirmButton>
        </ModalContent>
      </ModalOverlay>
    </ProfileListContainer>
  );
}

export default ProfileList;
