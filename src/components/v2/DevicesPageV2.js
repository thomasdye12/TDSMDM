import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import styled from "styled-components";
import {
  IoBatteryHalfOutline,
  IoCheckmarkCircle,
  IoChevronForward,
  IoInformationCircleOutline,
  IoLocateOutline,
  IoLockClosedOutline,
  IoPhonePortraitOutline,
  IoRefresh,
  IoSearch,
  IoSend,
  IoWarningOutline,
} from "react-icons/io5";
import { formatDistanceToNow } from "date-fns";
import axiosInstance from "../../utils/axios";
import { deviceIconName } from "../device/deviceIconfunction";
import ManagedProfiles from "../device/ManagedProfiles";
import LocationTab from "../device/LocationTab";
import DDMTab from "../device/DDMTab";

const Page = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(340px, 430px) minmax(0, 1fr);
  background: var(--app-bg);
  color: var(--text);

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  background: var(--surface);

  @media (max-width: 980px) {
    max-height: 48vh;
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }
`;

const SidebarTop = styled.div`
  padding: 14px;
  border-bottom: 1px solid var(--border);
`;

const Workspace = styled.main`
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 16px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const Kicker = styled.div`
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 3px 0 0;
  color: var(--text);
  font-size: 21px;
  line-height: 1.15;
  letter-spacing: 0;
`;

const Sub = styled.div`
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 13px;
`;

const StatGrid = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`;

const Stat = styled.div`
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-muted);
  padding: 9px;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 900;
`;

const StatLabel = styled.div`
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 800;
`;

const SearchWrap = styled.label`
  margin-top: 12px;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 10px;
  color: var(--text-muted);
  background: var(--surface-muted);

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
`;

const SearchInput = styled.input`
  width: 100%;
  border: 0;
  outline: 0;
  color: var(--text);
  background: transparent;
  font-size: 14px;
`;

const FilterRow = styled.div`
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
`;

const Segment = styled.button`
  height: 34px;
  border: 0;
  border-right: 1px solid var(--border);
  color: ${({ $active }) => ($active ? "var(--accent)" : "var(--text-muted)")};
  background: ${({ $active }) => ($active ? "var(--accent-soft)" : "var(--surface)")};
  font-weight: 850;
  font-size: 12px;
  cursor: pointer;

  &:last-child {
    border-right: 0;
  }
`;

const DeviceList = styled.div`
  min-height: 0;
  overflow: auto;
  padding: 8px;
  display: grid;
  align-content: start;
  gap: 6px;
`;

const DeviceRow = styled.button`
  width: 100%;
  text-align: left;
  border: 1px solid ${({ $selected }) => ($selected ? "var(--accent)" : "transparent")};
  border-radius: 8px;
  background: ${({ $selected }) => ($selected ? "var(--accent-soft)" : "transparent")};
  color: var(--text);
  padding: 9px;
  cursor: pointer;

  &:hover {
    background: var(--surface-soft);
  }
`;

const DeviceRowMain = styled.div`
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
`;

const DeviceIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--surface-soft);
  border: 1px solid var(--border);
`;

const DeviceName = styled.div`
  font-size: 14px;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DeviceMeta = styled.div`
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PillRow = styled.div`
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  border-radius: 999px;
  padding: 3px 8px;
  color: ${({ $tone }) =>
    $tone === "ok" ? "var(--ok)" :
    $tone === "warn" ? "var(--warn)" :
    $tone === "bad" ? "var(--bad)" :
    "var(--text-muted)"};
  background: ${({ $tone }) =>
    $tone === "ok" ? "var(--ok-soft)" :
    $tone === "warn" ? "var(--warn-soft)" :
    $tone === "bad" ? "var(--bad-soft)" :
    "var(--surface-soft)"};
  font-size: 12px;
  font-weight: 850;
`;

const Card = styled.section`
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
`;

const CardHeader = styled.div`
  padding: 14px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const CardBody = styled.div`
  padding: 14px;
`;

const Hero = styled(Card)`
  box-shadow: none;
`;

const HeroBody = styled.div`
  padding: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const BigDevice = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
  min-width: 0;
`;

const BigIcon = styled.div`
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-soft);
`;

const Button = styled.button`
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 11px;
  background: ${({ $primary }) => ($primary ? "var(--accent)" : "var(--surface)")};
  color: ${({ $primary }) => ($primary ? "white" : "var(--text)")};
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;

  &:hover {
    background: ${({ $primary }) => ($primary ? "var(--accent-strong)" : "var(--surface-soft)")};
  }
`;

const DetailGrid = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 12px;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-muted);
  padding: 10px;
  min-width: 0;
`;

const InfoLabel = styled.div`
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
`;

const InfoValue = styled.div`
  margin-top: 5px;
  color: var(--text);
  font-size: 14px;
  overflow-wrap: anywhere;
`;

const Tabs = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
`;

const Tab = styled.button`
  height: 34px;
  border: 1px solid ${({ $active }) => ($active ? "var(--accent)" : "var(--border)")};
  border-radius: 8px;
  padding: 0 10px;
  background: ${({ $active }) => ($active ? "var(--accent-soft)" : "var(--surface)")};
  color: ${({ $active }) => ($active ? "var(--accent)" : "var(--text-muted)")};
  font-weight: 850;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
`;

const Empty = styled.div`
  padding: 26px;
  border: 1px dashed var(--border-strong);
  border-radius: 8px;
  color: var(--text-muted);
  background: var(--surface);
  text-align: center;
`;

const Select = styled.select`
  width: 100%;
  min-height: 38px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  background: var(--surface-muted);
  padding: 0 10px;
`;

const Input = styled.input`
  width: 100%;
  min-height: 38px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  background: var(--surface-muted);
  padding: 0 10px;
`;

const CommandForm = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
`;

const CommandGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

const AppList = styled.div`
  display: grid;
  gap: 8px;
  max-height: 520px;
  overflow: auto;
`;

const AppRow = styled.div`
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-muted);
  padding: 10px;
`;

const ErrorBox = styled.div`
  margin-bottom: 10px;
  padding: 10px 11px;
  color: var(--bad);
  white-space: pre-wrap;
  background: var(--bad-soft);
  border: 1px solid var(--bad);
  border-radius: 8px;
  font-size: 13px;
`;

const RowHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const fetchDevices = async () => {
  const { data } = await axiosInstance.get("/v1/getDevicesSmall");
  return data || [];
};

const fetchDeviceDetails = async (udid) => {
  const { data } = await axiosInstance.get(`v1/device/${udid}/state`);
  return data;
};

const fetchUsers = async () => {
  const { data } = await axiosInstance.get("v1/users/list");
  return data || [];
};

const commandButtons = [
  { label: "Refresh info", command: "DeviceInformation", icon: IoRefresh },
  { label: "Installed apps", command: "InstalledApplicationList", icon: IoPhonePortraitOutline },
  { label: "Locate device", command: "DeviceLocation", icon: IoLocateOutline },
];

const commandCatalog = [
  { command: "RequestMirroring", label: "AirPlay to Apple TV", target: "appletv" },
  { command: "StopMirroring", label: "Stop AirPlay" },
  { command: "DeviceLock", label: "Lock device", fields: ["pin", "message", "phone_number"] },
  { command: "RestartDevice", label: "Restart device" },
  { command: "ShutDownDevice", label: "Shut down device" },
  { command: "EnableLostMode", label: "Enable Lost Mode", fields: ["message", "phone_number", "footnote"] },
  { command: "PlayLostModeSound", label: "Play Lost Mode sound" },
  { command: "DisableLostMode", label: "Disable Lost Mode" },
  { command: "ClearPasscode", label: "Clear passcode" },
  { command: "SecurityInfo", label: "Refresh security info" },
  { command: "ProvisioningProfileList", label: "List provisioning profiles" },
  { command: "ManagedApplicationList", label: "Refresh managed apps" },
  { command: "SEND_MESSAGE", label: "Send message", fields: ["message"] },
];

const fieldLabels = {
  pin: "Six-digit PIN",
  message: "Message",
  phone_number: "Phone number",
  footnote: "Footnote",
};

function formatCheckin(value) {
  if (!value) return "-";
  const date = new Date(value * 1000);
  return `${date.toLocaleString()} (${formatDistanceToNow(date)} ago)`;
}

function getDeviceStats(devices) {
  const total = devices.length;
  const enrolled = devices.filter((device) => !!device.enrollment_status).length;
  const supervised = devices.filter((device) => !!device.IsSupervised).length;
  return { total, enrolled, supervised };
}

function deviceOSName(device) {
  const model = `${device?.ModelName || ""} ${device?.Model || ""} ${device?.ProductName || ""}`.toLowerCase();
  if (model.includes("apple tv") || model.includes("appletv")) return "tvOS";
  if (model.includes("vision") || model.includes("realitydevice")) return "visionOS";
  if (model.includes("watch")) return "watchOS";
  if (model.includes("mac")) return "macOS";
  return "iOS";
}

function matchesSearch(device, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return [
    device.DeviceName,
    device.ModelName,
    device.OSVersion,
    device.udid,
    device.user?.name,
    device.user?.username,
  ].some((value) => value?.toLowerCase().includes(q));
}

function DeviceListRow({ device, selected, onSelect }) {
  const iconClass = deviceIconName(device.ModelName);
  const enrolled = !!device.enrollment_status;
  const supervised = !!device.IsSupervised;

  return (
    <DeviceRow $selected={selected} onClick={onSelect}>
      <DeviceRowMain>
        <DeviceIcon>
          <span className={iconClass} />
        </DeviceIcon>
        <div style={{ minWidth: 0 }}>
          <DeviceName>{device.DeviceName || "Unnamed device"}</DeviceName>
          <DeviceMeta>{device.ModelName || "Unknown model"} · {deviceOSName(device)} {device.OSVersion || "-"}</DeviceMeta>
        </div>
        <IoChevronForward color="var(--text-soft)" />
      </DeviceRowMain>
      <PillRow>
        <Pill $tone={enrolled ? "ok" : "bad"}>
          {enrolled ? <IoCheckmarkCircle /> : <IoWarningOutline />}
          {enrolled ? "Enrolled" : "Not enrolled"}
        </Pill>
        <Pill $tone={supervised ? "ok" : undefined}>
          <IoLockClosedOutline />
          {supervised ? "Supervised" : "Unsupervised"}
        </Pill>
      </PillRow>
    </DeviceRow>
  );
}

function Info({ label, value }) {
  return (
    <InfoItem>
      <InfoLabel>{label}</InfoLabel>
      <InfoValue>{value || "-"}</InfoValue>
    </InfoItem>
  );
}

function ManagedAppList({ apps, onRemove, busy }) {
  if (!apps?.length) return <Empty>No managed apps reported.</Empty>;

  return (
    <AppList>
      {apps.map((app) => {
        const key = app.Identifier || app.CFBundleIdentifier || app.id || app.Name;
        const name = app.Name || app.CFBundleDisplayName || app.name || "Unnamed app";
        const identifier = app.Identifier || app.CFBundleIdentifier || "-";
        const version = app.Version || app.CFBundleShortVersionString || app.version || "-";

        return (
          <AppRow key={key}>
            <RowHeader>
              <div style={{ minWidth: 0 }}>
                <DeviceName>{name}</DeviceName>
                <DeviceMeta>{identifier}</DeviceMeta>
              </div>
              <Button disabled={busy} onClick={() => onRemove(app)}>
                Remove
              </Button>
            </RowHeader>
            <PillRow>
              <Pill>Version {version}</Pill>
              {app.Status ? <Pill>{app.Status}</Pill> : null}
              {app.ManagementFlags ? <Pill>Flags {app.ManagementFlags}</Pill> : null}
            </PillRow>
          </AppRow>
        );
      })}
    </AppList>
  );
}

function DevicesPageV2() {
  const navigate = useNavigate();
  const { udid } = useParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState("general");
  const [appSearch, setAppSearch] = useState("");
  const [advancedCommand, setAdvancedCommand] = useState("RequestMirroring");
  const [commandFields, setCommandFields] = useState({});
  const [commandTarget, setCommandTarget] = useState("");
  const [commandError, setCommandError] = useState("");

  const { data: devices = [], isLoading: devicesLoading, error: devicesError } = useQuery("devices", fetchDevices);
  const { data: users = [] } = useQuery("users", fetchUsers);
  const {
    data: deviceData,
    isLoading: deviceLoading,
    error: deviceError,
  } = useQuery(["deviceDetails", udid], () => fetchDeviceDetails(udid), { enabled: !!udid });

  const updateUser = useMutation(
    (userId) => axiosInstance.post(`v1/device/${udid}/setUser`, { userId }),
    { onSuccess: () => queryClient.invalidateQueries(["deviceDetails", udid]) }
  );

  const sendCommand = useMutation(
    async (command) => {
      setCommandError("");
      const { data } = await axiosInstance.post(`v1/sendcommand/${udid}`, {
        command: typeof command === "string" ? { command } : command,
      });
      if (data?.error || data?.status === "failed") {
        throw new Error(data.error || "The command could not be queued.");
      }
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["deviceDetails", udid]);
      },
      onError: (error) => {
        setCommandError(error?.response?.data?.error || error.message || "The command could not be queued.");
      },
    }
  );

  const removeManagedApp = useMutation(
    (app) => axiosInstance.post(`v1/device/${udid}/removeApp`, { appId: app.id || app.Identifier || app.CFBundleIdentifier }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["deviceDetails", udid]);
      },
    }
  );

  const stats = useMemo(() => getDeviceStats(devices), [devices]);
  const selectedCommandDefinition = commandCatalog.find((item) => item.command === advancedCommand);
  const airPlayTargets = useMemo(
    () => devices.filter((device) => {
      const model = `${device.ModelName || ""} ${device.Model || ""}`.toLowerCase();
      return device.udid !== udid && (model.includes("apple tv") || model.includes("appletv"));
    }),
    [devices, udid]
  );

  const sendAdvancedCommand = () => {
    if (selectedCommandDefinition?.target === "appletv" && !commandTarget) return;
    sendCommand.mutate({
      command: advancedCommand,
      targetDevice: selectedCommandDefinition?.target ? commandTarget : undefined,
      fields: commandFields,
    });
  };

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      if (filter === "enrolled" && !device.enrollment_status) return false;
      if (filter === "not" && device.enrollment_status) return false;
      if (filter === "supervised" && !device.IsSupervised) return false;
      return matchesSearch(device, search.trim());
    });
  }, [devices, filter, search]);

  const selectedDevice = useMemo(() => {
    return devices.find((device) => device.udid === udid);
  }, [devices, udid]);

  const hasLocation = !!deviceData?.["net_thomasdye_TDS-LocationTracking"];
  const installedApps = deviceData?.InstalledApplicationList || [];
  const filteredInstalledApps = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    if (!q) return installedApps;
    return installedApps.filter((app) =>
      [app.Name, app.Identifier, app.Version].some((value) => value?.toLowerCase().includes(q))
    );
  }, [installedApps, appSearch]);

  const tabItems = [
    { id: "general", label: "General" },
    { id: "installed", label: `Installed Apps (${installedApps.length})` },
    { id: "managed", label: `Managed Apps (${deviceData?.managedApps?.length || 0})` },
    { id: "profiles", label: `Profiles (${deviceData?.profiles?.length || 0})` },
    { id: "ddm", label: "DDM" },
    ...(hasLocation ? [{ id: "location", label: "Location" }] : []),
  ];

  return (
    <Page>
      <Sidebar>
        <SidebarTop>
          <TitleRow>
            <div>
              <Kicker>Inventory</Kicker>
              <Title>Devices</Title>
              <Sub>{filteredDevices.length} shown from {stats.total}</Sub>
            </div>
            <Button title="Refresh devices" onClick={() => queryClient.invalidateQueries("devices")}>
              <IoRefresh />
            </Button>
          </TitleRow>

          <StatGrid>
            <Stat>
              <StatValue>{stats.total}</StatValue>
              <StatLabel>Total</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{stats.enrolled}</StatValue>
              <StatLabel>Enrolled</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{stats.supervised}</StatValue>
              <StatLabel>Supervised</StatLabel>
            </Stat>
          </StatGrid>

          <SearchWrap>
            <IoSearch />
            <SearchInput
              placeholder="Search device, user, model or UDID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </SearchWrap>

          <FilterRow>
            <Segment $active={filter === "all"} onClick={() => setFilter("all")}>All</Segment>
            <Segment $active={filter === "enrolled"} onClick={() => setFilter("enrolled")}>Enrolled</Segment>
            <Segment $active={filter === "not"} onClick={() => setFilter("not")}>Not</Segment>
            <Segment $active={filter === "supervised"} onClick={() => setFilter("supervised")}>Supervised</Segment>
          </FilterRow>
        </SidebarTop>

        <DeviceList>
          {devicesLoading ? <Empty>Loading devices...</Empty> : null}
          {devicesError ? <Empty>Error fetching devices.</Empty> : null}
          {!devicesLoading && !devicesError && filteredDevices.length === 0 ? (
            <Empty>No devices match this view.</Empty>
          ) : null}
          {filteredDevices.map((device) => (
            <DeviceListRow
              key={device.udid}
              device={device}
              selected={device.udid === udid}
              onSelect={() => navigate(`/devices/${device.udid}`)}
            />
          ))}
        </DeviceList>
      </Sidebar>

      <Workspace>
        {!udid ? (
          <Empty>
            <IoInformationCircleOutline size={26} />
            <div style={{ marginTop: 8 }}>Select a device to open its operational view.</div>
          </Empty>
        ) : null}

        {udid && deviceLoading ? <Empty>Loading device...</Empty> : null}
        {udid && deviceError ? <Empty>Error fetching device details.</Empty> : null}

        {udid && deviceData && (
          <>
            <Hero>
              <HeroBody>
                <BigDevice>
                  <BigIcon>
                    <span className={deviceIconName(deviceData.ModelName || selectedDevice?.ModelName)} />
                  </BigIcon>
                  <div style={{ minWidth: 0 }}>
                    <Kicker>{deviceData.ModelName || selectedDevice?.ModelName || "Device"}</Kicker>
                    <Title>{deviceData.DeviceName || selectedDevice?.DeviceName || "Unnamed device"}</Title>
                    <Sub>{deviceData.udid || udid}</Sub>
                    <PillRow>
                      <Pill $tone={deviceData.enrollment_status ? "ok" : "bad"}>
                        {deviceData.enrollment_status ? "Enrolled" : "Not enrolled"}
                      </Pill>
                      <Pill $tone={deviceData.IsSupervised ? "ok" : undefined}>
                        {deviceData.IsSupervised ? "Supervised" : "Unsupervised"}
                      </Pill>
                      {typeof deviceData.BatteryLevel === "number" ? (
                        <Pill>
                          <IoBatteryHalfOutline />
                          {Math.round(deviceData.BatteryLevel * 100)}%
                        </Pill>
                      ) : null}
                    </PillRow>
                  </div>
                </BigDevice>

                <div style={{ display: "grid", gap: 8, minWidth: 220 }}>
                  <Select
                    value={deviceData?.user?.GUUID || ""}
                    onChange={(event) => updateUser.mutate(event.target.value)}
                  >
                    <option value="">No assigned user</option>
                    {users.map((user) => (
                      <option key={user.GUUID} value={user.GUUID}>
                        {user?.name ?? user?.username}
                      </option>
                    ))}
                  </Select>
                  <Button $primary onClick={() => sendCommand.mutate("DeviceInformation")}>
                    <IoRefresh />
                    Refresh device
                  </Button>
                </div>
              </HeroBody>
            </Hero>

            <DetailGrid>
              <div style={{ display: "grid", gap: 12 }}>
                <Card>
                  <CardHeader>
                    <div>
                      <Kicker>Device data</Kicker>
                      <Title style={{ fontSize: 17 }}>Record</Title>
                    </div>
                    <Tabs>
                      {tabItems.map((item) => (
                        <Tab key={item.id} $active={tab === item.id} onClick={() => setTab(item.id)}>
                          {item.label}
                        </Tab>
                      ))}
                    </Tabs>
                  </CardHeader>
                  <CardBody>
                    {tab === "general" && (
                      <InfoGrid>
                        <Info label="Device Name" value={deviceData.DeviceName} />
                        <Info label="Assigned User" value={deviceData?.user?.name ?? deviceData?.user?.username} />
                        <Info label="OS Version" value={deviceData.OSVersion} />
                        <Info label="Build Version" value={deviceData.BuildVersion} />
                        <Info label="Serial Number" value={deviceData.SerialNumber} />
                        <Info label="Status" value={deviceData.Status} />
                        <Info label="Last Checkin" value={formatCheckin(deviceData.lastCheckin)} />
                        <Info label="WiFi MAC" value={deviceData.WiFiMAC} />
                        <Info label="Bluetooth MAC" value={deviceData.BluetoothMAC} />
                        <Info label="Model Identifier" value={deviceData.Model} />
                        <Info label="IMEI" value={deviceData.IMEI} />
                        <Info label="MEID" value={deviceData.MEID} />
                      </InfoGrid>
                    )}

                    {tab === "installed" && (
                      <>
                        <SearchWrap style={{ marginTop: 0, marginBottom: 10 }}>
                          <IoSearch />
                          <SearchInput
                            placeholder="Search installed apps"
                            value={appSearch}
                            onChange={(event) => setAppSearch(event.target.value)}
                          />
                        </SearchWrap>
                        <AppList>
                          {filteredInstalledApps.length === 0 ? <Empty>No installed apps match this search.</Empty> : null}
                          {filteredInstalledApps.map((app) => (
                            <AppRow key={app.Identifier}>
                              <Info label="Name" value={app.Name} />
                              <Info label="Identifier" value={app.Identifier} />
                              <Info label="Version" value={app.Version} />
                            </AppRow>
                          ))}
                        </AppList>
                      </>
                    )}

                    {tab === "managed" && (
                      <ManagedAppList
                        apps={deviceData.managedApps || []}
                        busy={removeManagedApp.isLoading}
                        onRemove={(app) => removeManagedApp.mutate(app)}
                      />
                    )}

                    {tab === "profiles" && (
                      deviceData.profiles?.length > 0
                        ? <ManagedProfiles ManagedApplications={deviceData.profiles} device={deviceData} />
                        : <Empty>No profiles reported.</Empty>
                    )}

                    {tab === "ddm" && <DDMTab device={deviceData} />}

                    {tab === "location" && hasLocation && (
                      <LocationTab location={deviceData["net_thomasdye_TDS-LocationTracking"].location} />
                    )}
                  </CardBody>
                </Card>
              </div>

              <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
                <Card>
                  <CardHeader>
                    <div>
                      <Kicker>Commands</Kicker>
                      <Title style={{ fontSize: 17 }}>Quick Actions</Title>
                      <Sub>Common MDM actions for the selected device.</Sub>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {commandError ? <ErrorBox role="alert">{commandError}</ErrorBox> : null}
                    <CommandGrid>
                      {commandButtons.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.command}
                            onClick={() => sendCommand.mutate(item.command)}
                            disabled={sendCommand.isLoading}
                          >
                            <Icon />
                            {item.label}
                          </Button>
                        );
                      })}
                    </CommandGrid>
                    <Button
                      style={{ width: "100%", marginTop: 8 }}
                      $primary
                      onClick={() => setAdvancedCommand("SEND_MESSAGE")}
                    >
                      <IoSend />
                      Compose command
                    </Button>
                    <CommandForm>
                      <Select
                        value={advancedCommand}
                        onChange={(event) => {
                          setAdvancedCommand(event.target.value);
                          setCommandFields({});
                          setCommandTarget("");
                        }}
                      >
                        {commandCatalog.map((item) => (
                          <option key={item.command} value={item.command}>{item.label}</option>
                        ))}
                      </Select>

                      {selectedCommandDefinition?.target === "appletv" ? (
                        <Select value={commandTarget} onChange={(event) => setCommandTarget(event.target.value)}>
                          <option value="">Select an Apple TV</option>
                          {airPlayTargets.map((device) => (
                            <option key={device.udid} value={device.udid}>
                              {device.DeviceName || device.udid}
                            </option>
                          ))}
                        </Select>
                      ) : null}

                      {(selectedCommandDefinition?.fields || []).map((field) => (
                        <Input
                          key={field}
                          type={field === "pin" ? "text" : "text"}
                          inputMode={field === "pin" ? "numeric" : undefined}
                          maxLength={field === "pin" ? 6 : undefined}
                          placeholder={fieldLabels[field] || field}
                          value={commandFields[field] || ""}
                          onChange={(event) => {
                            const value = field === "pin"
                              ? event.target.value.replace(/\D/g, "").slice(0, 6)
                              : event.target.value;
                            setCommandFields((current) => ({ ...current, [field]: value }));
                          }}
                        />
                      ))}

                      <Button
                        $primary
                        disabled={
                          sendCommand.isLoading ||
                          (selectedCommandDefinition?.target === "appletv" && !commandTarget) ||
                          (advancedCommand === "DeviceLock" && commandFields.pin && commandFields.pin.length !== 6)
                        }
                        onClick={sendAdvancedCommand}
                      >
                        <IoSend />
                        {sendCommand.isLoading ? "Queuing…" : `Queue ${selectedCommandDefinition?.label || "command"}`}
                      </Button>
                      {selectedCommandDefinition?.target === "appletv" && airPlayTargets.length === 0 ? (
                        <Sub>No Apple TV devices are enrolled and available as AirPlay targets.</Sub>
                      ) : null}
                    </CommandForm>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <div>
                      <Kicker>Operational read</Kicker>
                      <Title style={{ fontSize: 17 }}>Health Snapshot</Title>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <InfoGrid style={{ gridTemplateColumns: "1fr" }}>
                      <Info label="Enrollment" value={deviceData.enrollment_status ? "Ready" : "Needs enrollment"} />
                      <Info label="Supervision" value={deviceData.IsSupervised ? "Supervised" : "Limited management"} />
                      <Info label="Battery" value={typeof deviceData.BatteryLevel === "number" ? `${Math.round(deviceData.BatteryLevel * 100)}%` : "-"} />
                      <Info label="Last Checkin" value={formatCheckin(deviceData.lastCheckin)} />
                    </InfoGrid>
                  </CardBody>
                </Card>
              </div>
            </DetailGrid>
          </>
        )}
      </Workspace>
    </Page>
  );
}

export default DevicesPageV2;
