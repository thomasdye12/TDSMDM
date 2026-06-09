// router.tsx
import React from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from 'react-router-dom';

import AppLayout from './AppLayout';
import DeviceList from './components/DeviceList';
import DeviceDetails from './components/DeviceDetails';
import AppList from './components/apps/AppList';
import Events from './components/events/eventQueue';
import ProfileList from './components/Profiles/ProfileList';
import ProfileEdit from './components/Profiles/edit/ProfileEdit';
import DDMDashboard from './components/ddm/DDMDashboard';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AppLayout />}>
      <Route index element={<Navigate to="/devices" replace />} />
      <Route path="devices" element={<DeviceList />} />
      <Route path="devices/:udid" element={
        <>
         <DeviceList />
       <DeviceDetails />
      </>
      } />
      <Route path="apps" element={<AppList />} />
      <Route path="profiles" element={<ProfileList />} />
      <Route path="profiles/:profileid/edit" element={<ProfileEdit />} />
      <Route path="events" element={<Events />} />
      <Route path="ddm" element={<DDMDashboard />} />
    </Route>
  )
);

export default router;
