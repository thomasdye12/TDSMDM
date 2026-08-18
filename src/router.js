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
import DevicesPageV2 from './components/v2/DevicesPageV2';
import AppsPageV2 from './components/v2/AppsPageV2';
import DashboardPage from './components/dashboard/DashboardPage';
import { isV2UiEnabled } from './utils/featureFlags';

function DevicesRoute() {
  return isV2UiEnabled() ? <DevicesPageV2 /> : <DeviceList />;
}

function DeviceDetailsRoute() {
  if (isV2UiEnabled()) return <DevicesPageV2 />;

  return (
    <>
      <DeviceList />
      <DeviceDetails />
    </>
  );
}

function AppsRoute() {
  return isV2UiEnabled() ? <AppsPageV2 /> : <AppList />;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AppLayout />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="devices" element={<DevicesRoute />} />
      <Route path="devices/:udid" element={<DeviceDetailsRoute />} />
      <Route path="apps" element={<AppsRoute />} />
      <Route path="profiles" element={<ProfileList />} />
      <Route path="profiles/:profileid/edit" element={<ProfileEdit />} />
      <Route path="events" element={<Events />} />
      <Route path="ddm" element={<DDMDashboard />} />
    </Route>
  )
);

export default router;
