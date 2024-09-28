import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from './Modal'; // Assuming you have a Modal component
import {deviceIconName} from './deviceIconfunction';
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #ddd;
  background-color: #f9f9f9;
  margin-bottom: 20px;
`;

const DeviceName = styled.h1`
  font-size: 24px;
  color: #333;
  margin: 0;
`;

const DeviceInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const InfoItem = styled.div`
  font-size: 14px;
  color: #555;
`;

const ChangeUserButton = styled.button`
  padding: 5px 10px;
  font-size: 14px;
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


const Icon = styled.span`
  margin-right: 10px;
`;

const DeviceHeader = ({ deviceData, selectedUserId, usersData, handleUserChange }) => {
    const iconClass = deviceIconName(deviceData.ModelName);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserId, setNewUserId] = useState(selectedUserId);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleConfirmChange = () => {
    handleUserChange({ target: { value: newUserId } });
    closeModal();
  };

  return (
    <>
      <Header>
      <Icon className={iconClass}></Icon>
        <DeviceName>{deviceData.DeviceName}</DeviceName>
        <DeviceInfo>
          <InfoItem>
            <strong>User:</strong> {deviceData?.user?.name ?? 'None'}
          </InfoItem>
          <ChangeUserButton onClick={openModal}>Change User</ChangeUserButton>
        </DeviceInfo>
      </Header>

      {isModalOpen && (
        <Modal onClose={closeModal}>
          <h2>Select New User</h2>
          <select value={newUserId} onChange={(e) => setNewUserId(e.target.value)}>
            <option value="" disabled>Select User</option>
            {usersData.map((user) => (
              <option key={user.GUUID} value={user.GUUID}>
                {user?.name ?? user?.username}
              </option>
            ))}
          </select>
          <div style={{ marginTop: '20px' }}>
            <button onClick={handleConfirmChange} style={{ marginRight: '10px', padding: '8px 12px' }}>Confirm</button>
            <button onClick={closeModal} style={{ padding: '8px 12px' }}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default DeviceHeader;
