import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axiosInstance from "../utils/axios";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { formatDistanceToNow } from "date-fns";

import DeviceHeader from "./device/DeviceHeader";
import DeviceInfoItem from "./device/DeviceInfoItem";
import CommandBar from "./device/CommandBar";
import ManagedApps from "./device/ManagedApps";
import ManagedProfiles from "./device/ManagedProfiles";
import LocationTab from "./device/LocationTab";

/* ---------- Styling ---------- */

const Page = styled.div`
  padding: 16px;
  flex: 1;
  overflow: auto;
  background: #f6f7fb;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(0,0,0,0.06);
  overflow: hidden;
`;

const CardBody = styled.div`
  padding: 14px 16px;
`;

const Segments = styled.div`
  display: inline-flex;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 12px;
  overflow: hidden;
  flex-wrap: wrap;
  width: 100%;

  @media (max-width: 900px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Seg = styled.button`
  border: 0;
  padding: 10px 12px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "rgba(0,123,255,0.92)" : "white")};
  color: ${({ $active }) => ($active ? "white" : "rgba(0,0,0,0.75)")};
  font-weight: 900;
  font-size: 12px;

  &:hover {
    background: ${({ $active }) => ($active ? "rgba(0,123,255,1)" : "rgba(0,0,0,0.03)")};
  }
`;

const Grid = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(0,0,0,0.02);
  border-radius: 16px;
  padding: 12px;
`;

const Small = styled.div`
  font-size: 12px;
  opacity: 0.75;
  font-weight: 800;
`;

const Search = styled.input`
  width: 100%;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.12);
  outline: none;

  &:focus {
    border-color: rgba(0,123,255,0.6);
    box-shadow: 0 0 0 4px rgba(0,123,255,0.12);
  }
`;

const AppList = styled.div`
  margin-top: 10px;
  max-height: 520px;
  overflow: auto;
  display: grid;
  gap: 10px;
`;

const AppRow = styled.div`
  border: 1px solid rgba(0,0,0,0.08);
  background: white;
  border-radius: 16px;
  padding: 12px;
`;

const fetchDeviceDetails = async (udid) => {
  const { data } = await axiosInstance.get(`v1/device/${udid}/state`);
  return data;
};

const fetchUsers = async () => {
  const { data } = await axiosInstance.get(`v1/users/list`);
  return data;
};

const updateDeviceUser = async ({ udid, userId }) => {
  await axiosInstance.post(`v1/device/${udid}/setUser`, { userId });
};

function DeviceDetails() {
  const queryClient = useQueryClient();
  const { udid } = useParams();

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [tab, setTab] = useState("general");
  const [appSearch, setAppSearch] = useState("");

  const { data: deviceData, isLoading: isLoadingDevice, error: errorDevice } = useQuery(
    ["deviceDetails", udid],
    () => fetchDeviceDetails(udid),
    { enabled: !!udid }
  );

  const { data: usersData, isLoading: isLoadingUsers, error: errorUsers } = useQuery(
    "users",
    fetchUsers
  );

  const mutation = useMutation(updateDeviceUser, {
    onSuccess: () => queryClient.invalidateQueries(["deviceDetails", udid]),
  });

  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    mutation.mutate({ udid, userId });
  };

  const sendCommand = (command) => {
    axiosInstance.post(`v1/sendcommand/${udid}`, { command });
  };

  const hasLocation = !!deviceData?.["net_thomasdye_TDS-LocationTracking"];

  const filteredInstalledApps = useMemo(() => {
    const list = deviceData?.InstalledApplicationList || [];
    const q = appSearch.trim().toLowerCase();
    if (!q) return list;

    return list.filter((a) => {
      return (
        a.Name?.toLowerCase().includes(q) ||
        a.Identifier?.toLowerCase().includes(q) ||
        a.Version?.toLowerCase().includes(q)
      );
    });
  }, [deviceData, appSearch]);

  if (!udid) return <Page>Select a device to view details</Page>;
  if (isLoadingDevice || isLoadingUsers) return <Page>Loading…</Page>;
  if (errorDevice || errorUsers) return <Page>Error fetching data</Page>;

  return (
    <Page>
      <Card>
        <CardBody>
          <DeviceHeader
            deviceData={deviceData}
            selectedUserId={selectedUserId}
            usersData={usersData}
            handleUserChange={handleUserChange}
          />

          <div style={{ marginTop: 12 }}>
            <Segments>
              <Seg $active={tab === "general"} onClick={() => setTab("general")}>General</Seg>
              <Seg $active={tab === "os"} onClick={() => setTab("os")}>OS Update</Seg>
              <Seg $active={tab === "installed"} onClick={() => setTab("installed")}>Installed Apps</Seg>
              <Seg $active={tab === "managed"} onClick={() => setTab("managed")}>Managed Apps</Seg>
              <Seg $active={tab === "profiles"} onClick={() => setTab("profiles")}>Profiles</Seg>
              {hasLocation ? (
                <Seg $active={tab === "location"} onClick={() => setTab("location")}>Location</Seg>
              ) : null}
            </Segments>
          </div>

          {tab === "general" && (
            <Grid>
              <Panel>
                <Small>Overview</Small>
                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  <DeviceInfoItem label="Device Name" value={deviceData.DeviceName} />
                  <DeviceInfoItem label="Model Name" value={deviceData.ModelName} />
                  <DeviceInfoItem label="OS Version" value={deviceData.OSVersion} />
                  <DeviceInfoItem label="Build Version" value={deviceData.BuildVersion} />
                  <DeviceInfoItem label="Serial Number" value={deviceData.SerialNumber} />
                </div>
              </Panel>

              <Panel>
                <Small>Status</Small>
                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  <DeviceInfoItem label="Is Supervised" value={deviceData.IsSupervised ? "YES" : "NO"} />
                  <DeviceInfoItem label="Enrollment Status" value={deviceData.enrollment_status ? "Enrolled" : "Not Enrolled"} />
                  <DeviceInfoItem label="Status" value={deviceData.Status} />
                  <DeviceInfoItem label="UDID" value={deviceData.udid} />
                  <DeviceInfoItem
                    label="Last Checkin"
                    value={
                      deviceData.lastCheckin
                        ? `${new Date(deviceData.lastCheckin * 1000).toLocaleString()} (${formatDistanceToNow(
                            new Date(deviceData.lastCheckin * 1000)
                          )} ago)`
                        : "—"
                    }
                  />
                  {typeof deviceData.BatteryLevel === "number" ? (
                    <DeviceInfoItem label="Battery Level" value={`${Math.round(deviceData.BatteryLevel * 100)}%`} />
                  ) : null}
                </div>
              </Panel>

              <Panel>
                <Small>Network</Small>
                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  {deviceData.WiFiMAC ? <DeviceInfoItem label="WiFi MAC" value={deviceData.WiFiMAC} /> : <DeviceInfoItem label="WiFi MAC" value="—" />}
                  {deviceData.BluetoothMAC ? <DeviceInfoItem label="Bluetooth MAC" value={deviceData.BluetoothMAC} /> : <DeviceInfoItem label="Bluetooth MAC" value="—" />}
                </div>
              </Panel>

              <Panel>
                <Small>Hardware</Small>
                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  <DeviceInfoItem label="Model" value={deviceData.Model} />
                  {deviceData.IMEI ? <DeviceInfoItem label="IMEI" value={deviceData.IMEI} /> : null}
                  {deviceData.MEID ? <DeviceInfoItem label="MEID" value={deviceData.MEID} /> : null}
                </div>
              </Panel>
            </Grid>
          )}

          {tab === "os" && deviceData.OSUpdateSettings && (
            <Grid>
              <Panel style={{ gridColumn: "1 / -1" }}>
                <Small>OS Update Settings</Small>
                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  <DeviceInfoItem label="Auto Check Enabled" value={deviceData.OSUpdateSettings.AutoCheckEnabled ? "Yes" : "No"} />
                  <DeviceInfoItem
                    label="Automatic App Installation"
                    value={deviceData.OSUpdateSettings.AutomaticAppInstallationEnabled ? "Yes" : "No"}
                  />
                  <DeviceInfoItem
                    label="Automatic OS Installation"
                    value={deviceData.OSUpdateSettings.AutomaticOSInstallationEnabled ? "Yes" : "No"}
                  />
                  <DeviceInfoItem
                    label="Automatic Security Updates"
                    value={deviceData.OSUpdateSettings.AutomaticSecurityUpdatesEnabled ? "Yes" : "No"}
                  />
                  <DeviceInfoItem
                    label="Background Download Enabled"
                    value={deviceData.OSUpdateSettings.BackgroundDownloadEnabled ? "Yes" : "No"}
                  />
                  <DeviceInfoItem label="Catalog URL" value={deviceData.OSUpdateSettings.CatalogURL || "—"} />
                  <DeviceInfoItem
                    label="Previous Scan Date"
                    value={
                      deviceData.OSUpdateSettings.PreviousScanDate
                        ? new Date(deviceData.OSUpdateSettings.PreviousScanDate * 1000).toLocaleString()
                        : "—"
                    }
                  />
                </div>
              </Panel>
            </Grid>
          )}

          {tab === "installed" && (
            <Grid>
              <Panel style={{ gridColumn: "1 / -1" }}>
                <Small>
                  Installed Applications ({deviceData.InstalledApplicationList?.length || 0})
                </Small>
                <Search
                  placeholder="Search installed apps by name, bundle id, version…"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                />

                <AppList>
                  {filteredInstalledApps.length === 0 ? (
                    <div style={{ opacity: 0.7, padding: 10 }}>No installed apps match your search.</div>
                  ) : (
                    filteredInstalledApps.map((app) => (
                      <AppRow key={app.Identifier}>
                        <DeviceInfoItem label="Name" value={app.Name} />
                        <DeviceInfoItem label="Identifier" value={app.Identifier} />
                        <DeviceInfoItem label="Version" value={app.Version} />
                        <DeviceInfoItem label="Bundle Size" value={app.BundleSize ? `${app.BundleSize} bytes` : "—"} />
                      </AppRow>
                    ))
                  )}
                </AppList>
              </Panel>
            </Grid>
          )}

          {tab === "managed" && deviceData.managedApps?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <ManagedApps ManagedApplications={deviceData.managedApps} device={deviceData} />
            </div>
          )}

          {tab === "profiles" && deviceData.profiles?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <ManagedProfiles ManagedApplications={deviceData.profiles} device={deviceData} />
            </div>
          )}

          {tab === "location" && hasLocation && (
            <div style={{ marginTop: 12 }}>
              <LocationTab location={deviceData["net_thomasdye_TDS-LocationTracking"].location} />
            </div>
          )}
        </CardBody>
      </Card>

      <div style={{ marginTop: 12 }}>
        <CommandBar udid={udid} sendCommand={sendCommand} />
      </div>
    </Page>
  );
}

export default DeviceDetails;
