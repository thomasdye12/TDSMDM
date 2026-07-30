import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import styled from "styled-components";
import {
  IoAppsOutline,
  IoCheckmarkCircle,
  IoCloudUploadOutline,
  IoInformationCircleOutline,
  IoPhonePortraitOutline,
  IoSearch,
  IoSettingsOutline,
  IoTrashOutline,
} from "react-icons/io5";
import axiosInstance from "../../utils/axios";
import Upload from "../apps/UploadApp";
import AppInstallSettingsEditor from "../apps/AppInstallSettingsEditor";

const fetchApps = async () => {
  const { data } = await axiosInstance.get("/v1/apps/get");
  return data || [];
};

const fetchDevices = async () => {
  const { data } = await axiosInstance.get("/v1/getDevicesSmall");
  return data || [];
};

const Page = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: var(--app-bg);
  color: var(--text);
  padding: 16px;
`;

const Shell = styled.div`
  display: grid;
  gap: 12px;
`;

const Header = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  padding: 14px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const Kicker = styled.div`
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 3px 0 0;
  font-size: 22px;
  line-height: 1.15;
  letter-spacing: 0;
`;

const Sub = styled.div`
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 13px;
`;

const SearchBand = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 420px) repeat(3, minmax(120px, 1fr));
  gap: 8px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const SearchWrap = styled.label`
  height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 10px;
  color: var(--text-muted);
  background: var(--surface);

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

const Stat = styled.div`
  min-height: 42px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  padding: 8px 10px;
`;

const StatValue = styled.div`
  font-weight: 900;
  font-size: 17px;
`;

const StatLabel = styled.div`
  margin-top: 1px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 800;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 10px;
`;

const Card = styled.article`
  display: grid;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  padding: 12px;
`;

const CardTop = styled.div`
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 11px;
  align-items: center;
`;

const IconBox = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  background: var(--surface-soft);
  color: var(--accent);
  font-weight: 950;
`;

const AppIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const AppName = styled.div`
  font-size: 15px;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Bundle = styled.div`
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`;

const Meta = styled.div`
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-muted);
  padding: 8px;
  min-width: 0;
`;

const MetaLabel = styled.div`
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
`;

const MetaValue = styled.div`
  margin-top: 4px;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PillRow = styled.div`
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
  color: ${({ $tone }) => ($tone === "ok" ? "var(--ok)" : "var(--text-muted)")};
  background: ${({ $tone }) => ($tone === "ok" ? "var(--ok-soft)" : "var(--surface-soft)")};
  font-size: 12px;
  font-weight: 850;
`;

const ButtonRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 420px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Button = styled.button`
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 10px;
  background: ${({ $primary }) => ($primary ? "var(--accent)" : "var(--surface)")};
  color: ${({ $primary }) => ($primary ? "white" : "var(--text)")};
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;

  &:hover {
    background: ${({ $primary }) => ($primary ? "var(--accent-strong)" : "var(--surface-soft)")};
  }
`;

const Empty = styled.div`
  padding: 26px;
  border: 1px dashed var(--border-strong);
  border-radius: 8px;
  color: var(--text-muted);
  background: var(--surface);
  text-align: center;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: ${({ $open }) => ($open ? "grid" : "none")};
  place-items: center;
  padding: 18px;
  background: rgba(3, 7, 18, 0.58);
  z-index: 2200;
`;

const Modal = styled.div`
  width: min(960px, 95vw);
  max-height: 92vh;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  padding: 14px;
  border-bottom: 1px solid var(--border);
`;

const ModalBody = styled.div`
  overflow: auto;
  padding: 14px;
`;

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
  gap: 12px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const DeviceList = styled.div`
  display: grid;
  gap: 8px;
  max-height: 420px;
  overflow: auto;
`;

const DeviceRow = styled.label`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px;
  background: var(--surface-muted);
`;

const Segments = styled.div`
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
`;

const Segment = styled.button`
  min-height: 34px;
  border: 0;
  border-right: 1px solid var(--border);
  padding: 0 10px;
  color: ${({ $active }) => ($active ? "var(--accent)" : "var(--text-muted)")};
  background: ${({ $active }) => ($active ? "var(--accent-soft)" : "var(--surface)")};
  font-weight: 850;
  cursor: pointer;

  &:last-child {
    border-right: 0;
  }
`;

const Pre = styled.pre`
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: #020617;
  color: #f8fafc;
  font-size: 12px;
  overflow: auto;
`;

function getAppName(app) {
  return app.CFBundleDisplayName || app.name || "Unnamed app";
}

function getBundleId(app) {
  return app.CFBundleIdentifier || app.BundleIdentifier || "-";
}

function getVersion(app) {
  return app.CFBundleShortVersionString || app.version || app.infolist?.CFBundleShortVersionString || "-";
}

function getIconUrl(app) {
  if (app.iconURL) return app.iconURL;
  if (!app.icon) return "";
  return `https://device.server.thomasdye.net/TDSapi/files/icons/${encodeURIComponent(app.icon)}`;
}

function formatTs(ts) {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString();
}

function AppIconTile({ app }) {
  const [failed, setFailed] = useState(false);
  const iconUrl = getIconUrl(app);
  const name = getAppName(app);
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A";

  return (
    <IconBox>
      {iconUrl && !failed ? (
        <AppIcon
          src={iconUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </IconBox>
  );
}

function AppsPageV2() {
  const { data: apps = [], isLoading: appsLoading, error: appsError, refetch } = useQuery("apps", fetchApps);
  const { data: devices = [], isLoading: devicesLoading, error: devicesError } = useQuery("devices", fetchDevices);
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [modal, setModal] = useState(null);
  const [targetMode, setTargetMode] = useState("missing");
  const [selectedUdids, setSelectedUdids] = useState([]);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const devicesByUdid = useMemo(() => {
    const map = new Map();
    devices.forEach((device) => map.set(device.udid, device));
    return map;
  }, [devices]);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((app) =>
      [getAppName(app), getBundleId(app), getVersion(app), app.infolist?.DTPlatformName]
        .some((value) => value?.toLowerCase().includes(q))
    );
  }, [apps, search]);

  const installedSet = useMemo(() => {
    const list = selectedApp?.devices || [];
    return new Set(Array.isArray(list) ? list : []);
  }, [selectedApp]);

  const eligibleSet = useMemo(() => {
    const list = selectedApp?.mobileprovision?.ProvisionedDevices || [];
    return new Set(Array.isArray(list) ? list : []);
  }, [selectedApp]);

  const targetGroups = useMemo(() => {
    const all = devices.map((device) => device.udid);
    const installed = all.filter((udid) => installedSet.has(udid));
    const missing = all.filter((udid) => !installedSet.has(udid));
    const eligible = all.filter((udid) => eligibleSet.has(udid));
    return { all, installed, missing, eligible };
  }, [devices, eligibleSet, installedSet]);

  const getTargetGroupsForApp = (app) => {
    const all = devices.map((device) => device.udid);
    const appInstalled = new Set(Array.isArray(app?.devices) ? app.devices : []);
    const appEligible = new Set(Array.isArray(app?.mobileprovision?.ProvisionedDevices) ? app.mobileprovision.ProvisionedDevices : []);
    return {
      all,
      installed: all.filter((udid) => appInstalled.has(udid)),
      missing: all.filter((udid) => !appInstalled.has(udid)),
      eligible: all.filter((udid) => appEligible.has(udid)),
    };
  };

  const visibleUdids = useMemo(() => {
    const q = deviceSearch.trim().toLowerCase();
    const base = targetGroups[targetMode] || [];
    if (!q) return base;

    return base.filter((udid) => {
      const device = devicesByUdid.get(udid);
      return (device?.DeviceName || "").toLowerCase().includes(q) || udid.toLowerCase().includes(q);
    });
  }, [deviceSearch, devicesByUdid, targetGroups, targetMode]);

  const stats = useMemo(() => {
    const installed = apps.reduce((count, app) => count + (Array.isArray(app.devices) ? app.devices.length : 0), 0);
    const expiring = apps.filter((app) => {
      const expiration = app.mobileprovision?.ExpirationDate;
      if (!expiration) return false;
      return expiration * 1000 - Date.now() < 1000 * 60 * 60 * 24 * 70;
    }).length;
    return { total: apps.length, installed, expiring };
  }, [apps]);

  const openDeployment = (app, action) => {
    const mode = action === "remove" ? "installed" : "missing";
    const groups = getTargetGroupsForApp(app);
    setSelectedApp(app);
    setModal(action);
    setTargetMode(mode);
    setDeviceSearch("");
    setSelectedUdids(groups[mode] || []);
  };

  const toggleUdid = (udid) => {
    setSelectedUdids((current) =>
      current.includes(udid) ? current.filter((item) => item !== udid) : [...current, udid]
    );
  };

  const changeMode = (mode) => {
    setTargetMode(mode);
    setSelectedUdids(targetGroups[mode] || []);
  };

  const closeModal = () => {
    setModal(null);
    setSelectedApp(null);
    setSelectedUdids([]);
  };

  const handleInstallSettingsSaved = (installSettings) => {
    setSelectedApp((current) => current ? { ...current, installSettings } : current);
    refetch();
  };

  const confirmDeployment = async () => {
    if (!selectedApp || selectedUdids.length === 0) return;
    setBusy(true);
    try {
      await axiosInstance.post(modal === "remove" ? "/v1/apps/device/remove" : "/v1/apps/device/push", {
        appId: selectedApp.id,
        deviceUdids: selectedUdids,
      });
      closeModal();
      refetch();
    } finally {
      setBusy(false);
    }
  };

  if (appsLoading || devicesLoading) return <Page>Loading apps...</Page>;
  if (appsError || devicesError) return <Page>Error fetching apps or devices.</Page>;

  return (
    <Page>
      <Shell>
        <Header>
          <div>
            <Kicker>Application Management</Kicker>
            <Title>Apps</Title>
            <Sub>Install, remove, inspect and target managed iOS apps.</Sub>
          </div>
          <Upload onUploadSuccess={refetch} />
        </Header>

        <SearchBand>
          <SearchWrap>
            <IoSearch />
            <SearchInput
              placeholder="Search by app name, bundle id, version or platform"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </SearchWrap>
          <Stat>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Apps</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{stats.installed}</StatValue>
            <StatLabel>Install records</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{stats.expiring}</StatValue>
            <StatLabel>Expiring soon</StatLabel>
          </Stat>
        </SearchBand>

        {filteredApps.length === 0 ? (
          <Empty>No apps match this search.</Empty>
        ) : (
          <Grid>
            {filteredApps.map((app) => {
              const installedCount = Array.isArray(app.devices) ? app.devices.length : 0;
              const provisionedCount = app.mobileprovision?.ProvisionedDevices?.length || 0;

              return (
                <Card key={app.id || getBundleId(app)}>
                  <CardTop>
                    <AppIconTile app={app} />
                    <div style={{ minWidth: 0 }}>
                      <AppName>{getAppName(app)}</AppName>
                      <Bundle>{getBundleId(app)}</Bundle>
                      <PillRow style={{ marginTop: 7 }}>
                        <Pill>
                          <IoAppsOutline />
                          {app.infolist?.DTPlatformName || "iOS"}
                        </Pill>
                        {installedCount > 0 ? (
                          <Pill $tone="ok">
                            <IoCheckmarkCircle />
                            {installedCount} installed
                          </Pill>
                        ) : null}
                      </PillRow>
                    </div>
                  </CardTop>

                  <MetaGrid>
                    <Meta>
                      <MetaLabel>Version</MetaLabel>
                      <MetaValue>{getVersion(app)}</MetaValue>
                    </Meta>
                    <Meta>
                      <MetaLabel>Uploaded</MetaLabel>
                      <MetaValue>{formatTs(app.uploaded)}</MetaValue>
                    </Meta>
                    <Meta>
                      <MetaLabel>Eligible</MetaLabel>
                      <MetaValue>{provisionedCount || "All"}</MetaValue>
                    </Meta>
                  </MetaGrid>

                  <ButtonRow>
                    <Button $primary onClick={() => openDeployment(app, "install")}>
                      <IoCloudUploadOutline />
                      Push
                    </Button>
                    <Button onClick={() => openDeployment(app, "remove")} disabled={installedCount === 0}>
                      <IoTrashOutline />
                      Remove
                    </Button>
                    <Button onClick={() => { setSelectedApp(app); setModal("details"); }}>
                      <IoInformationCircleOutline />
                      More
                    </Button>
                    <Button onClick={() => { setSelectedApp(app); setModal("settings"); }}>
                      <IoSettingsOutline />
                      Settings
                    </Button>
                  </ButtonRow>
                </Card>
              );
            })}
          </Grid>
        )}
      </Shell>

      <Overlay $open={modal === "install" || modal === "remove"}>
        <Modal>
          <ModalHeader>
            <div>
              <Kicker>{modal === "remove" ? "Remove app" : "Push app"}</Kicker>
              <Title style={{ fontSize: 18 }}>{selectedApp ? getAppName(selectedApp) : "App"}</Title>
              <Sub>{selectedApp ? getBundleId(selectedApp) : ""}</Sub>
            </div>
            <Button onClick={closeModal}>Close</Button>
          </ModalHeader>
          <ModalBody>
            <ModalGrid>
              <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                {modal === "install" ? (
                  <Segments>
                    <Segment $active={targetMode === "missing"} onClick={() => changeMode("missing")}>Missing</Segment>
                    <Segment $active={targetMode === "eligible"} onClick={() => changeMode("eligible")}>Eligible</Segment>
                    <Segment $active={targetMode === "installed"} onClick={() => changeMode("installed")}>Installed</Segment>
                    <Segment $active={targetMode === "all"} onClick={() => changeMode("all")}>All</Segment>
                  </Segments>
                ) : (
                  <Segments>
                    <Segment $active>Installed</Segment>
                  </Segments>
                )}

                <SearchWrap>
                  <IoSearch />
                  <SearchInput
                    placeholder="Filter devices"
                    value={deviceSearch}
                    onChange={(event) => setDeviceSearch(event.target.value)}
                  />
                </SearchWrap>

                <DeviceList>
                  {visibleUdids.length === 0 ? <Empty>No devices in this target set.</Empty> : null}
                  {visibleUdids.map((udid) => {
                    const device = devicesByUdid.get(udid);
                    return (
                      <DeviceRow key={udid}>
                        <input
                          type="checkbox"
                          checked={selectedUdids.includes(udid)}
                          onChange={() => toggleUdid(udid)}
                        />
                        <div style={{ minWidth: 0 }}>
                          <AppName style={{ fontSize: 14 }}>{device?.DeviceName || udid}</AppName>
                          <Bundle>{udid}</Bundle>
                        </div>
                        <Pill $tone={installedSet.has(udid) ? "ok" : undefined}>
                          <IoPhonePortraitOutline />
                          {installedSet.has(udid) ? "Installed" : "Missing"}
                        </Pill>
                      </DeviceRow>
                    );
                  })}
                </DeviceList>
              </div>

              <Card style={{ alignContent: "start" }}>
                <Kicker>Selection</Kicker>
                <Title style={{ fontSize: 36 }}>{selectedUdids.length}</Title>
                <Sub>device{selectedUdids.length === 1 ? "" : "s"} selected</Sub>
                <Button
                  $primary={modal !== "remove"}
                  disabled={busy || selectedUdids.length === 0}
                  onClick={confirmDeployment}
                  style={{ marginTop: 8 }}
                >
                  {modal === "remove" ? <IoTrashOutline /> : <IoCloudUploadOutline />}
                  {busy ? "Working..." : modal === "remove" ? "Queue removal" : "Queue install"}
                </Button>
              </Card>
            </ModalGrid>
          </ModalBody>
        </Modal>
      </Overlay>

      <Overlay $open={modal === "details"}>
        <Modal>
          <ModalHeader>
            <div>
              <Kicker>App details</Kicker>
              <Title style={{ fontSize: 18 }}>{selectedApp ? getAppName(selectedApp) : "App"}</Title>
              <Sub>{selectedApp ? getBundleId(selectedApp) : ""}</Sub>
            </div>
            <Button onClick={closeModal}>Close</Button>
          </ModalHeader>
          <ModalBody>
            <Pre>{JSON.stringify(selectedApp || {}, null, 2)}</Pre>
          </ModalBody>
        </Modal>
      </Overlay>

      <Overlay $open={modal === "settings"}>
        <Modal>
          <ModalHeader>
            <div>
              <Kicker>Install settings</Kicker>
              <Title style={{ fontSize: 18 }}>{selectedApp ? getAppName(selectedApp) : "App"}</Title>
              <Sub>{selectedApp ? getBundleId(selectedApp) : ""}</Sub>
            </div>
            <Button onClick={closeModal}>Close</Button>
          </ModalHeader>
          <ModalBody>
            <AppInstallSettingsEditor app={selectedApp} onSaved={handleInstallSettingsSaved} />
          </ModalBody>
        </Modal>
      </Overlay>
    </Page>
  );
}

export default AppsPageV2;
