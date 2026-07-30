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

const Select = styled.select`
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

const Toggle = styled.input`
  margin-right: 10px;
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

const LoginWindowSettings = ({ settings, setSettings }) => {
  const handleAddListItem = (field) => {
    setSettings({
      ...settings,
      loginWindowSettings: {
        ...settings.loginWindowSettings,
        [field]: [...(settings.loginWindowSettings[field] || []), ''],
      },
    });
  };

  const handleRemoveListItem = (field, index) => {
    setSettings({
      ...settings,
      loginWindowSettings: {
        ...settings.loginWindowSettings,
        [field]: settings.loginWindowSettings[field].filter(
          (_, i) => i !== index
        ),
      },
    });
  };

  const handleListInputChange = (field, index, value) => {
    const updatedList = settings.loginWindowSettings[field].map((item, i) =>
      i === index ? value : item
    );
    setSettings({
      ...settings,
      loginWindowSettings: {
        ...settings.loginWindowSettings,
        [field]: updatedList,
      },
    });
  };

  const handleInputChange = (field, value) => {
    setSettings({
      ...settings,
      loginWindowSettings: {
        ...settings.loginWindowSettings,
        [field]: value,
      },
    });
  };

  return (
    <Container>
      <Title>Login Window Settings</Title>

      <FormGroup>
        <Label>Admin Host Info:</Label>
        <Select
          value={settings.loginWindowSettings?.AdminHostInfo || ''}
          onChange={(e) =>
            handleInputChange('AdminHostInfo', e.target.value)
          }
        >
          <option value="HostName">HostName</option>
          <option value="SystemVersion">SystemVersion</option>
          <option value="IPAddress">IPAddress</option>
        </Select>
      </FormGroup>

      <FormGroup>
        <Label>Autologin Username:</Label>
        <Input
          type="text"
          value={settings.loginWindowSettings?.AutologinUsername || ''}
          onChange={(e) =>
            handleInputChange('AutologinUsername', e.target.value)
          }
        />
      </FormGroup>

      <FormGroup>
        <Label>Autologin Password:</Label>
        <Input
          type="password"
          value={settings.loginWindowSettings?.AutologinPassword || ''}
          onChange={(e) =>
            handleInputChange('AutologinPassword', e.target.value)
          }
        />
      </FormGroup>

      <FormGroup>
        <Label>Allow List:</Label>
        {settings.loginWindowSettings?.AllowList?.map((item, index) => (
          <Container key={index}>
            <Input
              type="text"
              value={item}
              onChange={(e) =>
                handleListInputChange('AllowList', index, e.target.value)
              }
            />
            <RemoveButton
              onClick={() => handleRemoveListItem('AllowList', index)}
            >
              Remove
            </RemoveButton>
          </Container>
        ))}
        <AddButton onClick={() => handleAddListItem('AllowList')}>
          Add Allow List Item
        </AddButton>
      </FormGroup>

      <FormGroup>
        <Label>Deny List:</Label>
        {settings.loginWindowSettings?.DenyList?.map((item, index) => (
          <Container key={index}>
            <Input
              type="text"
              value={item}
              onChange={(e) =>
                handleListInputChange('DenyList', index, e.target.value)
              }
            />
            <RemoveButton
              onClick={() => handleRemoveListItem('DenyList', index)}
            >
              Remove
            </RemoveButton>
          </Container>
        ))}
        <AddButton onClick={() => handleAddListItem('DenyList')}>
          Add Deny List Item
        </AddButton>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={settings.loginWindowSettings?.DisableConsoleAccess || false}
            onChange={(e) =>
              handleInputChange('DisableConsoleAccess', e.target.checked)
            }
          />
          Disable Console Access
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={settings.loginWindowSettings?.DisableFDEAutoLogin || false}
            onChange={(e) =>
              handleInputChange('DisableFDEAutoLogin', e.target.checked)
            }
          />
          Disable FDE Auto Login
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={
              settings.loginWindowSettings?.DisableScreenLockImmediate || false
            }
            onChange={(e) =>
              handleInputChange('DisableScreenLockImmediate', e.target.checked)
            }
          />
          Disable Screen Lock Immediate
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={settings.loginWindowSettings?.HideAdminUsers || false}
            onChange={(e) =>
              handleInputChange('HideAdminUsers', e.target.checked)
            }
          />
          Hide Admin Users
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={settings.loginWindowSettings?.HideLocalUsers || false}
            onChange={(e) =>
              handleInputChange('HideLocalUsers', e.target.checked)
            }
          />
          Hide Local Users
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={settings.loginWindowSettings?.HideMobileAccounts || false}
            onChange={(e) =>
              handleInputChange('HideMobileAccounts', e.target.checked)
            }
          />
          Hide Mobile Accounts
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={settings.loginWindowSettings?.IncludeNetworkUser || false}
            onChange={(e) =>
              handleInputChange('IncludeNetworkUser', e.target.checked)
            }
          />
          Include Network User
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>Login Window Text:</Label>
        <Input
          type="text"
          value={settings.loginWindowSettings?.LoginwindowText || ''}
          onChange={(e) =>
            handleInputChange('LoginwindowText', e.target.value)
          }
        />
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={
              settings.loginWindowSettings?.LogOutDisabledWhileLoggedIn || false
            }
            onChange={(e) =>
              handleInputChange(
                'LogOutDisabledWhileLoggedIn',
                e.target.checked
              )
            }
          />
          Log Out Disabled While Logged In
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={
              settings.loginWindowSettings?.PowerOffDisabledWhileLoggedIn || false
            }
            onChange={(e) =>
              handleInputChange(
                'PowerOffDisabledWhileLoggedIn',
                e.target.checked
              )
            }
          />
          Power Off Disabled While Logged In
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={settings.loginWindowSettings?.RestartDisabled || false}
            onChange={(e) =>
              handleInputChange('RestartDisabled', e.target.checked)
            }
          />
          Restart Disabled
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={
              settings.loginWindowSettings?.RestartDisabledWhileLoggedIn ||
              false
            }
            onChange={(e) =>
              handleInputChange(
                'RestartDisabledWhileLoggedIn',
                e.target.checked
              )
            }
          />
          Restart Disabled While Logged In
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={settings.loginWindowSettings?.SHOWFULLNAME || false}
            onChange={(e) =>
              handleInputChange('SHOWFULLNAME', e.target.checked)
            }
          />
          Show Full Name
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={
              settings.loginWindowSettings?.SHOWOTHERUSERS_MANAGED || false
            }
            onChange={(e) =>
              handleInputChange('SHOWOTHERUSERS_MANAGED', e.target.checked)
            }
          />
          Show Other Users Managed
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={settings.loginWindowSettings?.showInputMenu || false}
            onChange={(e) =>
              handleInputChange('showInputMenu', e.target.checked)
            }
          />
          Show Input Menu
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={settings.loginWindowSettings?.ShutDownDisabled || false}
            onChange={(e) =>
              handleInputChange('ShutDownDisabled', e.target.checked)
            }
          />
          Shut Down Disabled
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={settings.loginWindowSettings?.SleepDisabled || false}
            onChange={(e) =>
              handleInputChange('SleepDisabled', e.target.checked)
            }
          />
          Sleep Disabled
        </Label>
      </FormGroup>

      <FormGroup>
        <Label>
          <Toggle
            type="checkbox"
            checked={
              settings.loginWindowSettings?.ShutDownDisabledWhileLoggedIn ||
              false
            }
            onChange={(e) =>
              handleInputChange(
                'ShutDownDisabledWhileLoggedIn',
                e.target.checked
              )
            }
          />
          Shut Down Disabled While Logged In
        </Label>
      </FormGroup>
    </Container>
  );
};

export default LoginWindowSettings;
