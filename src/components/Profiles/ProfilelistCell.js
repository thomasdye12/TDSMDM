import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axiosInstance from '../../utils/axios'; // Assuming you have axios instance setup
import Modal from '../../utils/Modal'; // Import the Modal component

// Styled components for buttons (reuse from your existing code)
const TableCell = styled.td`
  padding: 15px;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px; /* Space between buttons */
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

const RemoveButton = styled(ActionButton)`
  background-color: #dc3545;

  &:hover {
    background-color: #c82333;
  }
`;

const EditLink = styled(Link)`
  padding: 8px 12px;
  background-color: #28a745;
  color: white;
  border-radius: 5px;
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.3s;

  &:hover {
    background-color: #218838;
  }
`;

const ProfileTableRow = ({ profile, onPushProfile, onRemoveProfile, hidePushButton, hideRemoveButton, hideEditButton }) => {
  const [showModal, setShowModal] = useState(false);
  const [matchedDevices, setMatchedDevices] = useState([]);

  // Function to fetch all devices
  const fetchDevices = async () => {
    const { data } = await axiosInstance.get('/v1/getDevicesSmall');
    return data;
  };

  const { data: devices, isLoading, error } = useQuery('devices', fetchDevices);

  useEffect(() => {
    if (devices && showModal) {
      if (!profile.devices || profile.devices.length === 0) {
        setMatchedDevices([]);
        return;
      }
      const matched = devices.filter(device => profile.devices.includes(device.udid));
      setMatchedDevices(matched);
    }
  }, [devices, showModal, profile.devices]);

  return (
    <>
      <tr key={profile.id}>
        <TableCell>{profile.PayloadDisplayName}</TableCell>
        <TableCell>{profile.PayloadUUID}</TableCell>
        <TableCell>
          <ButtonGroup>
            {!hidePushButton && (
              <ActionButton onClick={() => onPushProfile(profile)}>
                Push Profile
              </ActionButton>
            )}
            {!hideRemoveButton && (
              <RemoveButton onClick={() => onRemoveProfile(profile)}>
                Remove Profile
              </RemoveButton>
            )}
            {!hideEditButton && profile.edit && (
              <EditLink to={`/profiles/${profile.PayloadUUID}/edit`}>
                Edit Profile
              </EditLink>
            )}
            <ActionButton onClick={() => setShowModal(true)}>
              Show Details
            </ActionButton>
          </ButtonGroup>
        </TableCell>
      </tr>

      <Modal show={showModal} onClose={() => setShowModal(false)}>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error fetching devices</p>
        ) : (
          <ul>
            {matchedDevices.length > 0 ? (
              matchedDevices.map(device => (
                <li key={device.udid}>{device.DeviceName}</li>
              ))
            ) : (
              <p>No devices found for this profile</p>
            )}
          </ul>
        )}
      </Modal>
    </>
  );
};

export default ProfileTableRow;
