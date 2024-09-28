import React, { useState } from 'react';
import { useMutation } from 'react-query';
import axiosInstance from '../../utils/axios';
import styled from 'styled-components';

const UploadContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const FileInput = styled.input`
  display: none;
`;

const UploadLabel = styled.label`
  padding: 8px 16px;
  font-size: 14px;
  color: white;
  background-color: #007bff;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;

  &:hover {
    background-color: #0056b3;
  }
`;

const UploadButton = styled.button`
  padding: 8px 16px;
  font-size: 14px;
  color: white;
  background-color: #28a745;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #218838;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const UploadProfile = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const mutation = useMutation(async (formData) => {
    await axiosInstance.post('/v1/profile/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  });

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('profile', selectedFile);

    mutation.mutate(formData);
  };
  const handleCreateProfile = () => {
    // make a web request to create a new profile, then using that data redirect to the profile page
    axiosInstance.post('/v1/profile/create').then((res) => {
      window.location.href = `/profiles/${res.data.id}/edit`;
    });
  };

  return (
    <UploadContainer>
     <UploadButton onClick={handleCreateProfile}>
        Create Profile
      </UploadButton>
      <FileInput type="file" id="file-upload" onChange={handleFileChange} />
      <UploadLabel htmlFor="file-upload">Choose File</UploadLabel>
      <UploadButton onClick={handleUpload} disabled={!selectedFile}>
        Upload
      </UploadButton>
    </UploadContainer>
  );
};

export default UploadProfile;
