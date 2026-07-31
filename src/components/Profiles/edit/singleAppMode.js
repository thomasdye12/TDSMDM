import React, { useMemo, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`margin-bottom: 20px;`;
const Title = styled.h2`margin-bottom: 20px; font-size: 24px; color: var(--text);`;
const FormGroup = styled.div`margin-bottom: 15px;`;
const Label = styled.label`display: block; margin-bottom: 8px; font-size: 16px; color: var(--text-muted);`;
const Input = styled.input`
  width: 100%; padding: 10px; font-size: 16px; color: var(--text); background: var(--surface);
  border: 1px solid var(--border-strong); border-radius: var(--radius-sm); outline: none; transition: border-color 0.3s;
  &:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
`;
const Small = styled.div`font-size: 12px; color: var(--text-muted); margin-top: 6px;`;

// Tiny UUID helper
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (crypto?.getRandomValues?.(new Uint8Array(1))[0] ?? Math.random()*256) & 15;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULTS = Object.freeze({
  App: { Identifier: '' },                 // e.g. com.apple.mobilenotes
});

const SingleAppModeSettings = ({ settings, setSettings }) => {
  // Safe local view
  const local = useMemo(
    () => ({ ...DEFAULTS, ...(settings?.singleAppModeSettings || {}), App: { ...DEFAULTS.App, ...(settings?.singleAppModeSettings?.App || {}) } }),
    [settings?.singleAppModeSettings]
  );

  // Seed parent once so inputs are always controlled
  useEffect(() => {
    if (!settings?.singleAppModeSettings) {
      setSettings(prev => ({
        ...(prev || {}),
        singleAppModeSettings: { ...DEFAULTS, PayloadUUID: uuidv4() },
      }));
    }
  }, [settings?.singleAppModeSettings, setSettings]);

  const setField = (field, value) => {
    setSettings(prev => ({
      ...(prev || {}),
      singleAppModeSettings: {
        ...((prev && prev.singleAppModeSettings) || DEFAULTS),
        [field]: value,
      },
    }));
  };

  const setAppField = (field, value) => {
    setSettings(prev => ({
      ...(prev || {}),
      singleAppModeSettings: {
        ...((prev && prev.singleAppModeSettings) || DEFAULTS),
        App: {
          ...(((prev && prev.singleAppModeSettings && prev.singleAppModeSettings.App) || DEFAULTS.App)),
          [field]: value,
        },
      },
    }));
  };

  return (
    <Container>
      <Title>Single App Mode (com.apple.app.lock)</Title>

      <FormGroup>
        <Label>App Bundle Identifier</Label>
        <Input
          type="text"
          value={local.App.Identifier}
          onChange={(e) => setAppField('Identifier', e.target.value)}
          placeholder="e.g. com.apple.mobilenotes"
        />
        <Small>Device will lock into this app (supervised iOS/tvOS). Remove payload to exit Single App Mode.</Small>
      </FormGroup>
    </Container>
  );
};

export default SingleAppModeSettings;
