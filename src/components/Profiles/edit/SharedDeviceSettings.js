import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-size: 24px;
  color: var(--text);
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  color: var(--text-muted);
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color 0.3s;

  &:focus {
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
  }
`;

const SharedDeviceSettings = ({ settings, setSettings }) => {
  const handleInputChange = (field, value) => {
    setSettings({
      ...settings,
      sharedDeviceSettings: {
        ...(settings.sharedDeviceSettings || {}),
        [field]: value,
      },
    });
  };

  return (
    <Container>
      <Title>Shared Device (Lock Screen)</Title>

      <FormGroup>
        <Label>Asset Tag Information:</Label>
        <Input
          type="text"
          value={settings.sharedDeviceSettings?.AssetTagInformation || ''}
          onChange={(e) =>
            handleInputChange('AssetTagInformation', e.target.value)
          }
          placeholder="e.g. 1234"
        />
      </FormGroup>

      <FormGroup>
        <Label>If Lost Return To Message:</Label>
        <Input
          type="text"
          value={settings.sharedDeviceSettings?.IfLostReturnToMessage || ''}
          onChange={(e) =>
            handleInputChange('IfLostReturnToMessage', e.target.value)
          }
          placeholder="e.g. If found, call +44 20 1234 5678 or return to Reception."
        />
      </FormGroup>
    </Container>
  );
};

export default SharedDeviceSettings;
