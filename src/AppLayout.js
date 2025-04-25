// AppLayout.tsx
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import { userAccessToservice } from './utils/axios';

const HEADER_HEIGHT = '60px';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const MainContentContainer = styled.div`
  display: flex;
  flex: 1;
  margin-top: ${HEADER_HEIGHT};
  overflow-y: auto;
`;

function AppLayout() {
  const location = useLocation();
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
    <AppContainer>
      <Header />
      <MainContentContainer>
        <Outlet />
      </MainContentContainer>
    </AppContainer>
  );
}

export default AppLayout;
