import React from 'react';
import styled from 'styled-components';
import axiosInstance from '../../../utils/axios';

const Button = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
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
