import React, { useState } from 'react';
import { useMutation } from 'react-query';
import axiosInstance from '../../utils/axios';
import styled from 'styled-components';

const UploadContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--surface-muted);
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid var(--border);
`;

const FileInput = styled.input`
  display: none;
`;

const UploadLabel = styled.label`
  padding: 8px 16px;
  font-size: 14px;
  color: white;
  background-color: var(--accent);
  border-radius: var(--radius-sm);
  cursor: pointer;

  &:hover {
    background-color: var(--accent-hover);
  }
`;

const UploadButton = styled.button`
  padding: 8px 16px;
  font-size: 14px;
  color: white;
  background-color: var(--text);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;

  &:hover {
    background-color: #242424;
  }

  &:disabled {
    background-color: var(--text-soft);
    cursor: not-allowed;
  }
`;

const UploadProfile = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const mutation = useMutation(async (formData) => {
    return axiosInstance.post('/v1/profile/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }, {
    onSuccess: () => {
      setSelectedFile(null);
      onUploadSuccess?.();
    },
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
      <FileInput type="file" id="file-upload" accept=".mobileconfig,application/x-apple-aspen-config" onChange={handleFileChange} />
      <UploadLabel htmlFor="file-upload">{selectedFile ? selectedFile.name : "Choose File"}</UploadLabel>
      <UploadButton onClick={handleUpload} disabled={!selectedFile}>
        Upload
      </UploadButton>
    </UploadContainer>
  );
};

export default UploadProfile;
