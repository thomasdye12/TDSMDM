import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Header from './components/Header'; // Assuming you renamed Sidebar to Header
import DeviceList from './components/DeviceList';
import DeviceDetails from './components/DeviceDetails';
import styled from 'styled-components';
import AppList from './components/apps/AppList';
import Events from './components/events/eventQueue';
import ProfileList from './components/Profiles/ProfileList';
import axiosInstance, { state, getUserAboutMe, userAccessToservice } from './utils/axios';
import ProfileEdit from './components/Profiles/edit/ProfileEdit';

const queryClient = new QueryClient();

const HEADER_HEIGHT = '60px'; // Adjust this value to match your header height

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw; /* Full width */
  height: 100vh; /* Full height */
  overflow: hidden; /* Prevent overflow */
`;

const MainContentContainer = styled.div`
  display: flex;
  flex: 1;
  margin-top: ${HEADER_HEIGHT}; /* Ensure content starts below the header */
  overflow-y: auto; /* Scroll if content is too long */
`;

const DeviceContent = styled.div`
  flex: 1;
  display: flex;
  height: 100%;
  overflow-y: auto;
`;

const ApplistContent = styled.div`
  flex: 1;
  display: flex;
  height: 100%;
  overflow-y: auto;
`;

function MainContent() {
  const location = useLocation();
  const [access, setAccess] = useState({
    devices: false,
    apps: false,
    profiles: false,
    events: false,
  });

  useEffect(() => {
    const checkAccess = async () => {
      const devicesAccess = await userAccessToservice('devices');
      const appsAccess = await userAccessToservice('apps');
      const profilesAccess = await userAccessToservice('profiles');
      const eventsAccess = await userAccessToservice('events');

      setAccess({
        devices: devicesAccess,
        apps: appsAccess,
        profiles: profilesAccess,
        events: eventsAccess,
      });
    };

    checkAccess();
  }, []);

  return (
    <MainContentContainer>
      {location.pathname.startsWith('/devices') && access.devices && (
        <DeviceContent>
          <DeviceList />
          <Routes>
            <Route path="/devices" element={<div>Select a device to view details</div>} />
            <Route path="/devices/:udid" element={<DeviceDetails />} />
            {/* Add more routes as needed */}
          </Routes>
        </DeviceContent>
      )}

      {location.pathname.startsWith('/apps') && access.apps && (
        <DeviceContent>
          <AppList />
        </DeviceContent>
      )}

      {location.pathname.startsWith('/profiles') && access.profiles && (
        <DeviceContent>
           <Routes>
            <Route path="/profiles" element={<ProfileList />} />
            <Route path="/profiles/:profileid/edit" element={<ProfileEdit />} />
           </Routes>
        </DeviceContent>
      )}

      {location.pathname.startsWith('/events') && access.events && (
        <DeviceContent>
          <Events />
        </DeviceContent>
      )}
    </MainContentContainer>
  );
}

function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      const authorized = await userAccessToservice();
      setIsAuthorized(authorized);
    };

    checkAuthorization();
  }, []);

  if (!isAuthorized) {
    return <div>Unauthorized</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContainer>
          <Header /> {/* Renamed Sidebar to Header */}
          <MainContent />
        </AppContainer>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
