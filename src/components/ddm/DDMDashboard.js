import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useMutation, useQuery, useQueryClient } from "react-query";
import axiosInstance from "../../utils/axios";

const Page = styled.div`
  flex: 1;
  overflow: auto;
  background: #f6f7fb;
  padding: 16px;
`;

const Shell = styled.div`
  display: grid;
  gap: 14px;
  width: min(1380px, 100%);
`;

const HeaderBand = styled.div`
  background: white;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
`;

const Sub = styled.div`
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.72;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  padding: 14px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 900;
  opacity: 0.68;
`;

const StatValue = styled.div`
  margin-top: 8px;
  font-size: 26px;
  font-weight: 950;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Button = styled.button`
  border: 0;
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(0,123,255,0.92);
  color: white;
  font-weight: 900;
  cursor: pointer;

  &:hover { background: rgba(0,123,255,1); }
  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

const GhostButton = styled(Button)`
  background: white;
  color: rgba(0,0,0,0.78);
  border: 1px solid rgba(0,0,0,0.12);

  &:hover { background: rgba(0,0,0,0.03); }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid rgba(0,0,0,0.06);

  &:first-of-type {
    border-top: 0;
  }
`;

const Mono = styled.code`
  display: block;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.92);
  color: rgba(255,255,255,0.92);
  font-size: 12px;
  overflow: auto;
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 900;
  background: ${({ $tone }) => $tone === "ok" ? "rgba(40,167,69,0.14)" : "rgba(0,0,0,0.06)"};
`;

const Select = styled.select`
  width: 100%;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 12px;
  padding: 10px 12px;
  background: white;
`;

const Empty = styled.div`
  padding: 14px 0;
  opacity: 0.68;
  font-size: 13px;
`;

const fetchSummary = async () => {
  const { data } = await axiosInstance.get("/v1/ddm/admin/summary");
  return data;
};

const fetchDevices = async () => {
  const { data } = await axiosInstance.get("/v1/getDevicesSmall");
  return data.filter((device) => device?.udid);
};

function formatTime(value) {
  if (!value) return "-";
  return new Date(value * 1000).toLocaleString();
}

function DDMDashboard() {
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState("");

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery("ddmSummary", fetchSummary);
  const { data: devices, isLoading: devicesLoading } = useQuery("devices", fetchDevices);

  const syncMutation = useMutation(() => axiosInstance.post("/v1/ddm/admin/sync", {}), {
    onSuccess: () => queryClient.invalidateQueries("ddmSummary"),
  });

  const enableMutation = useMutation(
    (udid) => axiosInstance.post(`/v1/ddm/admin/device/${udid}/enable`, {}),
    {
      onSuccess: () => queryClient.invalidateQueries("ddmSummary"),
    }
  );

  const selectedDeviceName = useMemo(() => {
    return devices?.find((device) => device.udid === selectedDevice)?.DeviceName || selectedDevice;
  }, [devices, selectedDevice]);

  if (summaryLoading) return <Page>Loading DDM...</Page>;
  if (summaryError) return <Page>Error loading DDM status</Page>;

  const counts = summary?.counts || {};
  const declarations = summary?.recentDeclarations || [];
  const ddmDevices = summary?.recentDevices || [];

  return (
    <Page>
      <Shell>
        <HeaderBand>
          <div>
            <Title>Declarative Device Management</Title>
            <Sub>MicroMDM transport, TDS declaration service, device-reported state.</Sub>
            <Mono>{summary?.recommendedMicroMdmFlag || "-dm https://device.server.thomasdye.net/TDSapi/core/v1/ddm/"}</Mono>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <GhostButton onClick={() => queryClient.invalidateQueries("ddmSummary")}>Refresh</GhostButton>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isLoading}>
              {syncMutation.isLoading ? "Syncing..." : "Sync Declarations"}
            </Button>
          </div>
        </HeaderBand>

        <Grid>
          <Card>
            <StatLabel>Devices</StatLabel>
            <StatValue>{counts.devices || 0}</StatValue>
          </Card>
          <Card>
            <StatLabel>DDM Enabled</StatLabel>
            <StatValue>{counts.ddmEnabledDevices || 0}</StatValue>
          </Card>
          <Card>
            <StatLabel>Declarations</StatLabel>
            <StatValue>{counts.declarations || 0}</StatValue>
          </Card>
          <Card>
            <StatLabel>Status Reports</StatLabel>
            <StatValue>{counts.statusReports || 0}</StatValue>
          </Card>
        </Grid>

        <TwoCol>
          <Card>
            <StatLabel>Enable DDM on a test device</StatLabel>
            <Sub>Select one device first. This sends the raw DeclarativeManagement command through MicroMDM.</Sub>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <Select
                value={selectedDevice}
                onChange={(event) => setSelectedDevice(event.target.value)}
                disabled={devicesLoading}
              >
                <option value="">Select device...</option>
                {(devices || []).map((device) => (
                  <option key={device.udid} value={device.udid}>
                    {device.DeviceName || "Unnamed device"} - {device.udid}
                  </option>
                ))}
              </Select>

              <Button
                disabled={!selectedDevice || enableMutation.isLoading}
                onClick={() => enableMutation.mutate(selectedDevice)}
              >
                {enableMutation.isLoading ? "Sending..." : `Enable ${selectedDeviceName || "device"}`}
              </Button>
            </div>
          </Card>

          <Card>
            <StatLabel>Recent DDM devices</StatLabel>
            {ddmDevices.length === 0 ? (
              <Empty>No DDM device activity yet.</Empty>
            ) : ddmDevices.map((device) => (
              <Row key={device.enrollmentId || device.udid}>
                <div>
                  <strong>{device.udid || device.enrollmentId}</strong>
                  <Sub>Last status: {formatTime(device.lastStatusAt)} | Last declarations: {formatTime(device.lastDeclarationItemsRequest)}</Sub>
                </div>
                <Pill $tone={device.enabled ? "ok" : "idle"}>{device.enabled ? "Enabled" : "Pending"}</Pill>
              </Row>
            ))}
          </Card>
        </TwoCol>

        <Card>
          <StatLabel>Recent declarations</StatLabel>
          {declarations.length === 0 ? (
            <Empty>No declarations yet. Run Sync Declarations to create them from existing apps and profiles.</Empty>
          ) : declarations.map((declaration) => (
            <Row key={declaration.identifier}>
              <div>
                <strong>{declaration.identifier}</strong>
                <Sub>{declaration.type} | {declaration.sourceType} | Updated {formatTime(declaration.updatedAt)}</Sub>
              </div>
              <Pill $tone={declaration.active ? "ok" : "idle"}>{declaration.category}</Pill>
            </Row>
          ))}
        </Card>
      </Shell>
    </Page>
  );
}

export default DDMDashboard;

