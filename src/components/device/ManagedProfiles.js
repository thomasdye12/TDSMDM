import React, { useState } from 'react';
import DeviceInfoItem from './DeviceInfoItem';
import ProfileTableRow from '../Profiles/ProfilelistCell';
import axiosInstance from '../../utils/axios';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from 'react-query';

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

const AddProfileButton = styled.button`
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

const ProfileDropdown = styled.select`
  margin-top: 10px;
  padding: 8px;
  width: 100%;
  max-width: 300px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ManagedProfiles = ({ ManagedApplications, device }) => {
    const queryClient = useQueryClient();
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState(null);

    const { data: profiles, isLoading: isProfilesLoading, error: profilesError } = useQuery('profiles', fetchProfiles);

    if (!ManagedApplications || ManagedApplications.length === 0) {
        return <div>No managed applications found.</div>;
    }

    const handlePushProfile = (profile) => {
        axiosInstance.post(`/v1/device/${device.udid}/installProfile`, { profileId: profile.PayloadUUID }).then((res) => {
            queryClient.invalidateQueries('deviceDetails');
        });
    };

    const handleRemoveProfile = (profile) => {
        axiosInstance.post(`/v1/device/${device.udid}/removeProfile`, { profileId: profile.PayloadUUID }).then((res) => {
            queryClient.invalidateQueries('deviceDetails');
        });
    };

    const handleAddProfileClick = () => {
        setIsDropdownVisible(!isDropdownVisible);
    };

    const handleProfileSelection = (event) => {
        const profileId = event.target.value;
        const selectedProfile = profiles.find(profile => profile.PayloadUUID === profileId);
        if (selectedProfile) {
            handlePushProfile(selectedProfile);
            setIsDropdownVisible(false);
        }
    };

    return (
        <div>
            <AddProfileButton onClick={handleAddProfileClick}>+ Add Profile</AddProfileButton>
            {isDropdownVisible && profiles && (
                <ProfileDropdown onChange={handleProfileSelection} defaultValue="">
                    <option value="" disabled>Select a profile...</option>
                    {profiles.map((profile) => (
                        <option key={profile.PayloadUUID} value={profile.PayloadUUID}>
                            {profile.PayloadDisplayName}
                        </option>
                    ))}
                </ProfileDropdown>
            )}
            <Table>
                <thead>
                    <tr>
                        <TableHeader>Profile Name</TableHeader>
                        <TableHeader>UUID</TableHeader>
                        <TableHeader>Action</TableHeader>
                    </tr>
                </thead>
                <tbody>
                    {ManagedApplications.map((profile) => (
                        <ProfileTableRow
                            key={profile.PayloadUUID}
                            profile={profile}
                            onPushProfile={handlePushProfile}
                            onRemoveProfile={handleRemoveProfile}
                            hidePushButton={true} // Show the Push Profile button
                            hideRemoveButton={false} // Hide the Remove Profile button
                        />
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default ManagedProfiles;

const fetchProfiles = async () => {
  const { data } = await axiosInstance.get('/v1/profiles/get');
  return data;
};
