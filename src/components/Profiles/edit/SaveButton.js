import React from 'react';
import styled from 'styled-components';
import axiosInstance from '../../../utils/axios';

const Button = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  min-height: 42px;
  padding: 0 18px;
  background: var(--accent);
  color: white;
  border: 1px solid var(--accent);
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: var(--accent-strong);
  }
`;

const SaveButton = ({ settings }) => {
  const saveSettings = async () => {
    try {
      await axiosInstance.post(`/v1/profile/${settings.PayloadUUID}/save`, settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    }
  };

  return <Button onClick={saveSettings}>Save</Button>;
};

export default SaveButton;
