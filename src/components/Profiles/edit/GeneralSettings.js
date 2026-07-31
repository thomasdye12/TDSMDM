import React from "react";
import styled from "styled-components";

const Container = styled.div`
  max-width: 900px;
`;

const Title = styled.h2`
  margin: 0 0 20px;
  color: var(--text);
  font-size: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 7px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 700;
`;

const controlStyles = `
  width: 100%;
  padding: 10px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  outline: none;

  &:focus {
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
  }
`;

const Input = styled.input`${controlStyles}`;
const Select = styled.select`${controlStyles}`;
const Textarea = styled.textarea`
  ${controlStyles}
  min-height: 100px;
  resize: vertical;
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text);
`;

function GeneralSettings({ settings, setSettings }) {
  const setField = (key, value) => setSettings({ ...settings, [key]: value });

  return (
    <Container>
      <Title>General Settings</Title>
      <FormGroup>
        <Label>Display name</Label>
        <Input value={settings?.PayloadDisplayName || ""} onChange={(event) => setField("PayloadDisplayName", event.target.value)} />
      </FormGroup>
      <FormGroup>
        <Label>Description</Label>
        <Input value={settings?.PayloadDescription || ""} onChange={(event) => setField("PayloadDescription", event.target.value)} />
      </FormGroup>
      <FormGroup>
        <Label>Organization</Label>
        <Input value={settings?.PayloadOrganization || ""} onChange={(event) => setField("PayloadOrganization", event.target.value)} />
      </FormGroup>
      <FormGroup>
        <Label>Payload scope</Label>
        <Select value={settings?.PayloadScope || "System"} onChange={(event) => setField("PayloadScope", event.target.value)}>
          <option value="System">System / device</option>
          <option value="User">User</option>
        </Select>
      </FormGroup>
      <FormGroup>
        <CheckboxRow>
          <input
            type="checkbox"
            checked={Boolean(settings?.PayloadRemovalDisallowed)}
            onChange={(event) => setField("PayloadRemovalDisallowed", event.target.checked)}
          />
          Prevent the user from removing this profile
        </CheckboxRow>
      </FormGroup>
      <FormGroup>
        <Label>Automatic removal after (seconds, optional)</Label>
        <Input
          type="number"
          min="1"
          value={settings?.DurationUntilRemoval || ""}
          onChange={(event) => setField("DurationUntilRemoval", event.target.value)}
        />
      </FormGroup>
      <FormGroup>
        <Label>Consent text (English, optional)</Label>
        <Textarea
          value={settings?.ConsentText?.default || ""}
          onChange={(event) => setField(
            "ConsentText",
            event.target.value ? { ...(settings.ConsentText || {}), default: event.target.value } : {}
          )}
        />
      </FormGroup>
    </Container>
  );
}

export default GeneralSettings;
