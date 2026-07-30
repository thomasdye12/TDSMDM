// AppLayout.tsx
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import HeaderV2 from './components/v2/HeaderV2';
import { userAccessToservice } from './utils/axios';
import { isV2UiEnabled } from './utils/featureFlags';

const HEADER_HEIGHT = '60px';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: ${({ $v2 }) => ($v2 ? "var(--app-bg)" : "transparent")};
  color: ${({ $v2 }) => ($v2 ? "var(--text)" : "inherit")};
`;

const MainContentContainer = styled.div`
  display: flex;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

function AppLayout() {
  const location = useLocation();
  const v2Enabled = isV2UiEnabled();
  const [access, setAccess] = useState({
    devices: false,
    apps: false,
    profiles: false,
    events: false,
  });

  useEffect(() => {
    const checkAccess = async () => {
      const [devices, apps, profiles, events] = await Promise.all([
        userAccessToservice('devices'),
        userAccessToservice('apps'),
        userAccessToservice('profiles'),
        userAccessToservice('events'),
      ]);

      setAccess({ devices, apps, profiles, events });
    };

    checkAccess();
  }, []);

  // Optional: redirect or restrict here if needed
  // Example: hide route contents if no access

  return (
    <AppContainer $v2={v2Enabled} data-ui-version={v2Enabled ? "v2" : "classic"}>
      {v2Enabled ? <HeaderV2 /> : <Header />}
      <MainContentContainer>
        <Outlet />
      </MainContentContainer>
    </AppContainer>
  );
}

export default AppLayout;
