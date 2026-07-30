import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s;

  &:focus {
    border-color: #007bff;
  }
`;
//  make a larage input box for the certificate content
const CertificateInput = styled.textarea`
    width: 100%;
    padding: 10px;
    font-size: 16px;
    color: #333;
    border: 1px solid #ccc;
    border-radius: 4px;

    &:focus {
        border-color: #007bff;
    }
`;


const AddButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
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

const RemoveButton = styled.button`
  padding: 5px 10px;
  font-size: 14px;
  color: white;
  background-color: #dc3545;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #c82333;
  }
`;

const CertificateSettings = ({ settings, setSettings }) => {
  const handleAddCertificate = () => {
    const newCertificate = {
      PayloadContent: '',
      PayloadDescription: '',
      PayloadDisplayName: '',
      PayloadOrganization: '',
      PayloadType: 'com.apple.root.certificate',
      PayloadVersion: 1,
    };
    setSettings({
      ...settings,
      certificates: [...(settings.certificates || []), newCertificate],
    });
  };

  const handleRemoveCertificate = (index) => {
    const updatedCertificates = settings.certificates.filter(
      (cert, i) => i !== index
    );
    setSettings({
      ...settings,
      certificates: updatedCertificates,
    });
  };

  const handleInputChange = (index, field, value) => {
    const updatedCertificates = settings.certificates.map((cert, i) =>
      i === index ? { ...cert, [field]: value } : cert
    );
    setSettings({
      ...settings,
      certificates: updatedCertificates,
    });
  };

  return (
    <Container>
      <Title>Certificates</Title>
      {settings.certificates?.map((certificate, index) => (
        <Container key={index}>
          <FormGroup>
            <Label>Display Name:</Label>
            <Input
              type="text"
              value={certificate.PayloadDisplayName}
              onChange={(e) =>
                handleInputChange(index, 'PayloadDisplayName', e.target.value)
              }
            />
          </FormGroup>
          <FormGroup>
            <Label>Description:</Label>
            <Input
              type="text"
              value={certificate.PayloadDescription}
              onChange={(e) =>
                handleInputChange(index, 'PayloadDescription', e.target.value)
              }
            />
          </FormGroup>
          <FormGroup>
            <Label>Organization:</Label>
            <Input
              type="text"
              value={certificate.PayloadOrganization}
              onChange={(e) =>
                handleInputChange(index, 'PayloadOrganization', e.target.value)
              }
            />
          </FormGroup>
          <FormGroup>
            <Label>Content:</Label>
            <CertificateInput
              type="text"
              value={certificate.PayloadContent}
              onChange={(e) =>
                handleInputChange(index, 'PayloadContent', e.target.value)
              }
            />
          </FormGroup>
          {/* Add other fields as needed */}
          <RemoveButton onClick={() => handleRemoveCertificate(index)}>
            Remove Certificate
          </RemoveButton>
        </Container>
      ))}
      <AddButton onClick={handleAddCertificate}>Add Certificate</AddButton>
    </Container>
  );
};

export default CertificateSettings;
