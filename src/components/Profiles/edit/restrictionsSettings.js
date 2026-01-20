import React, { useMemo, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`margin-bottom: 20px;`;
const Title = styled.h2`margin-bottom: 20px; font-size: 24px; color: #333;`;
const FormGroup = styled.div`margin-bottom: 15px;`;
const Label = styled.label`display: block; margin-bottom: 8px; font-size: 16px; color: #555;`;
const Input = styled.input`
  width: 100%; padding: 10px; font-size: 16px; color: #333;
  border: 1px solid #ccc; border-radius: 4px; outline: none; transition: border-color 0.3s;
  &:focus { border-color: #007bff; }
`;
const Select = styled.select`
  width: 100%; padding: 10px; font-size: 16px; color: #333;
  border: 1px solid #ccc; border-radius: 4px; outline: none; transition: border-color 0.3s;
  &:focus { border-color: #007bff; }
`;
const Toggle = styled.input`margin-right: 10px;`;
const AddButton = styled.button`
  padding: 10px 20px; font-size: 16px; color: white; background-color: #007bff;
  border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;
  &:hover { background-color: #0056b3; }
`;
const RemoveButton = styled.button`
  padding: 5px 10px; font-size: 14px; color: white; background-color: #dc3545;
  border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;
  &:hover { background-color: #c82333; }
`;
const Row = styled.div`display: grid; grid-template-columns: 1fr 180px; gap: 12px; align-items: center;`;
const Small = styled.div`font-size: 12px; color: #777; margin-top: 6px;`;

// Optional UUID helper if you want payload IDs here too
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (crypto?.getRandomValues?.(new Uint8Array(1))[0] ?? Math.random()*256) & 15;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULTS = Object.freeze({
  // Common toggles (add more as needed)
  allowAccountModification: true,
  allowActivityContinuation: true,
  allowAirDrop: true,
  allowAppInstallation: true,
  allowAppRemoval: true,
  allowCamera: true,
  allowChat: true,
  allowCloudBackup: true,
  allowCloudDocumentSync: true,
  allowFindMyDevice: true,
  allowFindMyFriends: true,
  allowFingerprintForUnlock: true,
  allowGameCenter: true,
  allowHostPairing: true,
  allowLockScreenControlCenter: true,
  allowLockScreenNotificationsView: true,
  allowLockScreenTodayView: true,
  allowOpenFromManagedToUnmanaged: true,
  allowOpenFromUnmanagedToManaged: true,
  allowPasscodeModification: true,
  allowPasswordAutoFill: true,
  allowSafari: true,
  allowScreenShot: true,
  requireManagedPasteboard: false,

  // Ratings
  ratingApps: 1000,
  ratingMovies: 1000,
  ratingTVShows: 1000,
  ratingRegion: 'us',           // us, au, ca, de, fr, ie, jp, nz, gb

  // Safari cookie control
  safariAcceptCookies: 2,       // 0, 1, 1.5, 2
  safariAllowJavaScript: true,
  safariAllowAutoFill: true,
  safariForceFraudWarning: false,

  // Arrays
  blockedAppBundleIDs: [],
  allowListedAppBundleIDs: [],
  allowedCameraRestrictionBundleIDs: [],
  deniedICCIDsForiMessageFaceTime: [],
  deniedICCIDsForRCS: [],

});

const RestrictionsSettings = ({ settings, setSettings }) => {
  // safe local view with defaults
  const local = useMemo(
    () => ({ ...DEFAULTS, ...(settings?.restrictionsSettings || {}) }),
    [settings?.restrictionsSettings]
  );

  // seed parent once so inputs never flip uncontrolled->controlled
  useEffect(() => {
    if (!settings?.restrictionsSettings) {
      setSettings(prev => ({
        ...(prev || {}),
        restrictionsSettings: {
          ...DEFAULTS,
          PayloadUUID: uuidv4(),
        },
      }));
    }
  }, [settings?.restrictionsSettings, setSettings]);

  const setField = (field, value) => {
    setSettings(prev => ({
      ...(prev || {}),
      restrictionsSettings: {
        ...((prev && prev.restrictionsSettings) || DEFAULTS),
        [field]: value,
      },
    }));
  };

  // list helpers
  const addToList = (field) => setField(field, [...(local[field] ?? []), '']);
  const removeFromList = (field, idx) =>
    setField(field, (local[field] ?? []).filter((_, i) => i !== idx));
  const editListItem = (field, idx, value) =>
    setField(field, (local[field] ?? []).map((v, i) => (i === idx ? value : v)));

  return (
    <Container>
      <Title>Restrictions (com.apple.applicationaccess)</Title>

      {/* --- Core booleans (add as many as you need) --- */}
      {[
        ['allowAccountModification', 'Allow Account Modification'],
        ['allowActivityContinuation', 'Allow Handoff / Activity Continuation'],
        ['allowAirDrop', 'Allow AirDrop'],
        ['allowAppInstallation', 'Allow App Installation'],
        ['allowAppRemoval', 'Allow App Removal'],
        ['allowCamera', 'Allow Camera'],
        ['allowChat', 'Allow iMessage/Chat'],
        ['allowCloudBackup', 'Allow iCloud Backup'],
        ['allowCloudDocumentSync', 'Allow iCloud Document Sync'],
        ['allowFindMyDevice', 'Allow Find My Device'],
        ['allowFindMyFriends', 'Allow Find My Friends'],
        ['allowFingerprintForUnlock', 'Allow Biometric Unlock'],
        ['allowGameCenter', 'Allow Game Center'],
        ['allowHostPairing', 'Allow Host Pairing'],
        ['allowLockScreenControlCenter', 'Allow Control Center on Lock Screen'],
        ['allowLockScreenNotificationsView', 'Allow Lock Screen Notifications View'],
        ['allowLockScreenTodayView', 'Allow Lock Screen Today View'],
        ['allowOpenFromManagedToUnmanaged', 'Allow Open From Managed → Unmanaged'],
        ['allowOpenFromUnmanagedToManaged', 'Allow Open From Unmanaged → Managed'],
        ['allowPasscodeModification', 'Allow Passcode Modification'],
        ['allowPasswordAutoFill', 'Allow Password AutoFill'],
        ['allowSafari', 'Allow Safari'],
        ['allowScreenShot', 'Allow Screenshot & Screen Recording'],
        ['requireManagedPasteboard', 'Require Managed Pasteboard'],
      ].map(([key, label]) => (
        <FormGroup key={key}>
          <Label>
            <Toggle
              type="checkbox"
              checked={!!local[key]}
              onChange={(e) => setField(key, e.target.checked)}
            />
            {label}
          </Label>
        </FormGroup>
      ))}

      {/* --- Ratings --- */}
      <FormGroup>
        <Label>App Rating (0–1000):</Label>
        <Input
          type="number"
          min="0"
          max="1000"
          value={local.ratingApps ?? 1000}
          onChange={(e) => setField('ratingApps', Math.max(0, Math.min(1000, Number(e.target.value || 0))))}
        />
        <Small>US levels: 1000 All, 600 17+, 300 12+, 200 9+, 100 4+, 0 None.</Small>
      </FormGroup>

      <FormGroup>
        <Label>Movie Rating (0–1000):</Label>
        <Input
          type="number"
          min="0"
          max="1000"
          value={local.ratingMovies ?? 1000}
          onChange={(e) => setField('ratingMovies', Math.max(0, Math.min(1000, Number(e.target.value || 0))))}
        />
      </FormGroup>

      <FormGroup>
        <Label>TV Rating (0–1000):</Label>
        <Input
          type="number"
          min="0"
          max="1000"
          value={local.ratingTVShows ?? 1000}
          onChange={(e) => setField('ratingTVShows', Math.max(0, Math.min(1000, Number(e.target.value || 0))))}
        />
      </FormGroup>

      <FormGroup>
        <Label>Ratings Region:</Label>
        <Select
          value={local.ratingRegion || 'us'}
          onChange={(e) => setField('ratingRegion', e.target.value)}
        >
          {['us','au','ca','de','fr','ie','jp','nz','gb'].map(r => (
            <option key={r} value={r}>{r.toUpperCase()}</option>
          ))}
        </Select>
      </FormGroup>

      {/* --- Safari controls --- */}
      <FormGroup>
        <Label>Safari Accept Cookies:</Label>
        <Select
          value={String(local.safariAcceptCookies ?? 2)}
          onChange={(e) => setField('safariAcceptCookies', Number(e.target.value))}
        >
          <option value="0">0 — Strict (PXC + Block All)</option>
          <option value="1">1 — PXC Required</option>
          <option value="1.5">1.5 — PXC Required (legacy)</option>
          <option value="2">2 — User Controllable</option>
        </Select>
        <Small>PXC = Prevent Cross-Site Tracking.</Small>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={!!local.safariAllowJavaScript}
            onChange={(e) => setField('safariAllowJavaScript', e.target.checked)}
          />
          Safari Allow JavaScript
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={!!local.safariAllowAutoFill}
            onChange={(e) => setField('safariAllowAutoFill', e.target.checked)}
          />
          Safari Allow AutoFill
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={!!local.safariForceFraudWarning}
            onChange={(e) => setField('safariForceFraudWarning', e.target.checked)}
          />
          Safari Force Fraud Warning
        </Label>
      </FormGroup>

      {/* --- Array fields --- */}
      {[
        ['blockedAppBundleIDs', 'Blocked App Bundle IDs'],
        ['allowListedAppBundleIDs', 'Allow-Listed App Bundle IDs'],
        ['allowedCameraRestrictionBundleIDs', 'Camera Restriction Exempt App Bundle IDs (iOS 26+)'],
        ['deniedICCIDsForiMessageFaceTime', 'Denied ICCIDs for iMessage/FaceTime (max 4)'],
        ['deniedICCIDsForRCS', 'Denied ICCIDs for RCS (max 4)'],
      ].map(([field, label]) => (
        <FormGroup key={field}>
          <Label>{label}:</Label>
          {(local[field] ?? []).map((v, i) => (
            <Row key={i}>
              <Input
                type="text"
                value={v}
                onChange={(e) => editListItem(field, i, e.target.value)}
                placeholder={field.includes('ICCID') ? 'e.g. 89014103211118510720' : 'e.g. com.example.app'}
              />
              <RemoveButton onClick={() => removeFromList(field, i)}>Remove</RemoveButton>
            </Row>
          ))}
          <AddButton onClick={() => addToList(field)}>Add Item</AddButton>
          {field.includes('ICCID') && <Small>Limit 4 — enforce before export.</Small>}
        </FormGroup>
      ))}

    
    </Container>
  );
};

export default RestrictionsSettings;
