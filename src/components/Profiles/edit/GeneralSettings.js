import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
 
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

const GeneralSettings = ({ settings, setSettings }) => {
  return (
    <Container>
      <Title>General Settings</Title>
      <FormGroup>
        <Label>Display Name:</Label>
        <Input
          type="text"
          value={settings?.PayloadDisplayName}
          onChange={(e) =>
            setSettings({ ...settings, PayloadDisplayName: e.target.value })
          }
        />
      </FormGroup>
        {/* PayloadDescription */}
        <FormGroup>
        <Label>Description:</Label>
        <Input
          type="text"
          value={settings?.PayloadDescription}
          onChange={(e) =>
            setSettings({ ...settings, PayloadDescription: e.target.value })
          }
        />
        </FormGroup>
        {/* PayloadOrganization */}
        <FormGroup>
        <Label>Organization:</Label>
        <Input
          type="text"
          value={settings?.PayloadOrganization}
          onChange={(e) =>
            setSettings({ ...settings, PayloadOrganization: e.target.value })
          }
        />
        </FormGroup>
        {/* PayloadRemovalDisallowed bool */}
        {/* <FormGroup>
        <Label>Removal Disallowed:</Label>
        <Input
          type="checkbox"
          value={!settings?.PayloadRemovalDisallowed}
          onChange={(e) =>
            setSettings({ ...settings, PayloadRemovalDisallowed: e.target.value })
          }
        />
        </FormGroup> */}
        {/* PayloadScope */}
    </Container>
  );
};

export default GeneralSettings;
