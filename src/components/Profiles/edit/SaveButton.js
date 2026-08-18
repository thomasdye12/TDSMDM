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
  z-index: 100;

  &:hover {
    background: var(--accent-strong);
  }

  @media (max-width: 800px) {
    left: 10px;
    right: 10px;
    bottom: max(10px, env(safe-area-inset-bottom));
    width: auto;
    min-height: 50px;
    box-shadow: var(--shadow-lg);
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
