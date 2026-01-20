import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import axiosInstance from "../../utils/axios";
import styled from "styled-components";
import Upload from "./UploadApp";
import AppSingleCell from "./AppSingleCell";

const fetchApps = async () => {
  const { data } = await axiosInstance.get("/v1/apps/get");
  return data;
};

const fetchDevices = async () => {
  const { data } = await axiosInstance.get("/v1/getDevicesSmall");
  return data;
};

/* ---------- Styling ---------- */

const Page = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #f6f7fb;
  padding: 22px;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

const TopBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0.98));
`;

const Left = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const H1 = styled.div`
  font-weight: 800;
  font-size: 16px;
`;

const Sub = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;

const Search = styled.input`
  width: 340px;
  max-width: 70vw;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.12);
  background: white;
  outline: none;

  &:focus {
    border-color: rgba(0, 123, 255, 0.6);
    box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.12);
  }
`;

const TableWrap = styled.div`
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 980px;
`;

const Thead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 5;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 14px;
  font-size: 12px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.65);
  background: #fbfbfd;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  white-space: nowrap;
`;

const Empty = styled.div`
  padding: 26px;
  text-align: center;
  opacity: 0.7;
`;

/* ---------- Modal ---------- */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 16, 0.55);
  display: ${({ $open }) => ($open ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const Modal = styled.div`
  width: min(980px, 96vw);
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 22px 70px rgba(0,0,0,0.35);
`;

const ModalHeader = styled.div`
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid rgba(0,0,0,0.08);
`;

const ModalTitle = styled.div`
  font-weight: 800;
`;

const CloseBtn = styled.button`
  border: 0;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
  opacity: 0.7;
  &:hover { opacity: 1; }
`;

const ModalBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 0;
  min-height: 520px;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
`;

const BodyLeft = styled.div`
  padding: 14px 16px;
  border-right: 1px solid rgba(0,0,0,0.08);

  @media (max-width: 880px) {
    border-right: 0;
    border-bottom: 1px solid rgba(0,0,0,0.08);
  }
`;

const BodyRight = styled.div`
  padding: 14px 16px;
`;

const Small = styled.div`
  font-size: 12px;
  opacity: 0.75;
`;

const StatRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
`;

const Stat = styled.div`
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(0,0,0,0.02);
  border-radius: 12px;
  padding: 10px 12px;
  min-width: 160px;

  div:first-child { font-size: 12px; opacity: 0.7; }
  div:last-child { font-weight: 800; margin-top: 2px; }
`;

const Segments = styled.div`
  display: inline-flex;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 12px;
  overflow: hidden;
`;

const Segment = styled.button`
  border: 0;
  padding: 10px 12px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "rgba(0,123,255,0.92)" : "white")};
  color: ${({ $active }) => ($active ? "white" : "rgba(0,0,0,0.75)")};
  font-weight: 800;
  font-size: 12px;

  &:hover {
    background: ${({ $active }) => ($active ? "rgba(0,123,255,1)" : "rgba(0,0,0,0.03)")};
  }
`;

const DeviceSearch = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.12);
  outline: none;

  &:focus {
    border-color: rgba(0, 123, 255, 0.6);
    box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.12);
  }
`;

const DeviceList = styled.div`
  margin-top: 10px;
  max-height: 360px;
  overflow: auto;
  padding-right: 6px;
`;

const DeviceRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  cursor: pointer;

  &:hover {
    background: rgba(0,0,0,0.03);
  }
`;

const DeviceLeft = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Pill = styled.span`
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: ${({ $tone }) =>
    $tone === "ok" ? "rgba(40,167,69,0.14)"
    : $tone === "warn" ? "rgba(255,193,7,0.16)"
    : "rgba(220,53,69,0.14)"};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
`;

const PrimaryBtn = styled.button`
  border: 0;
  border-radius: 12px;
  padding: 11px 14px;
  background: rgba(0, 123, 255, 0.92);
  color: white;
  font-weight: 900;
  cursor: pointer;

  &:hover { background: rgba(0, 123, 255, 1); }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GhostBtn = styled.button`
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 12px;
  padding: 11px 14px;
  background: white;
  font-weight: 800;
  cursor: pointer;

  &:hover { background: rgba(0,0,0,0.03); }
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
`;

const Tab = styled.button`
  border: 1px solid rgba(0,0,0,0.12);
  background: ${({ $active }) => ($active ? "rgba(0,0,0,0.06)" : "white")};
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 800;
  cursor: pointer;

  &:hover { background: rgba(0,0,0,0.05); }
`;

const Pre = styled.pre`
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(2, 6, 23, 0.92);
  color: rgba(255,255,255,0.92);
  font-size: 12px;
  max-height: 380px;
  overflow: auto;
`;

/* ---------- Component ---------- */

function AppList() {
  const {
    data: apps,
    isLoading: isAppsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useQuery("apps", fetchApps);

  const {
    data: devices,
    isLoading: isDevicesLoading,
    error: devicesError,
  } = useQuery("devices", fetchDevices);

  const [searchQuery, setSearchQuery] = useState("");

  // Push modal
  const [pushOpen, setPushOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [targetMode, setTargetMode] = useState("missing"); // all | missing | installed | eligible
  const [selectedUdids, setSelectedUdids] = useState([]);

  // Details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState("summary"); // summary | provision | entitlements | raw

  const devicesByUdid = useMemo(() => {
    const m = new Map();
    (devices || []).forEach((d) => m.set(d.udid, d));
    return m;
  }, [devices]);

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = apps || [];
    if (!q) return list;

    return list.filter((app) => {
      return (
        app.CFBundleDisplayName?.toLowerCase().includes(q) ||
        app.name?.toLowerCase().includes(q) ||
        app.CFBundleIdentifier?.toLowerCase().includes(q)
      );
    });
  }, [apps, searchQuery]);

  const installedSet = useMemo(() => {
    const udids = selectedApp?.devices || [];
    return new Set(Array.isArray(udids) ? udids : []);
  }, [selectedApp]);

  const eligibleSet = useMemo(() => {
    const udids = selectedApp?.mobileprovision?.ProvisionedDevices || [];
    return new Set(Array.isArray(udids) ? udids : []);
  }, [selectedApp]);

  const computedTargets = useMemo(() => {
    const all = (devices || []).map((d) => d.udid);
    const installed = all.filter((u) => installedSet.has(u));
    const missing = all.filter((u) => !installedSet.has(u));
    const eligible = all.filter((u) => eligibleSet.has(u));
    return { all, installed, missing, eligible };
  }, [devices, installedSet, eligibleSet]);

  const visibleDeviceUdids = useMemo(() => {
    const q = deviceSearch.trim().toLowerCase();
    const base =
      targetMode === "all"
        ? computedTargets.all
        : targetMode === "installed"
        ? computedTargets.installed
        : targetMode === "eligible"
        ? computedTargets.eligible
        : computedTargets.missing;

    if (!q) return base;

    return base.filter((udid) => {
      const d = devicesByUdid.get(udid);
      const name = (d?.DeviceName || "").toLowerCase();
      return name.includes(q) || udid.toLowerCase().includes(q);
    });
  }, [computedTargets, targetMode, deviceSearch, devicesByUdid]);

  const openPush = (app) => {
    setSelectedApp(app);
    setTargetMode("missing");
    setDeviceSearch("");
    // default selection: "missing"
    const defaults = (devices || [])
      .map((d) => d.udid)
      .filter((u) => !(app.devices || []).includes(u));
    setSelectedUdids(defaults);
    setPushOpen(true);
  };

  const openDetails = (app) => {
    setSelectedApp(app);
    setDetailsTab("summary");
    setDetailsOpen(true);
  };

  const toggleUdid = (udid) => {
    setSelectedUdids((prev) =>
      prev.includes(udid) ? prev.filter((x) => x !== udid) : [...prev, udid]
    );
  };

  const quickSelect = (mode) => {
    const list = computedTargets[mode] || [];
    setSelectedUdids(list);
  };

  const onChangeTargetMode = (mode) => {
    setTargetMode(mode);
    // refresh selection to match mode (feels nicer than leaving stale selection)
    const list = computedTargets[mode] || [];
    setSelectedUdids(list);
  };

  const handleConfirmPush = async () => {
    if (!selectedApp) return;
    if (selectedUdids.length === 0) {
      alert("Please select at least one device");
      return;
    }

    const payload = { appId: selectedApp.id, deviceUdids: selectedUdids };

    try {
      await axiosInstance.post("/v1/apps/device/push", payload);
      alert("App pushed successfully!");
      setPushOpen(false);
      setSelectedUdids([]);
      // optionally: refetchApps(); (only if your API updates installed list quickly)
      refetchApps();
    } catch (error) {
      console.error("Error pushing app:", error);
      alert("Failed to push app. Please try again.");
    }
  };

  if (isAppsLoading || isDevicesLoading) return <Page>Loading…</Page>;
  if (appsError || devicesError) return <Page>Error fetching data</Page>;

  return (
    <Page>
      <Card>
        <TopBar>
          <Left>
            <Title>
              <H1>Apps</H1>
              <Sub>
                {filteredApps.length} apps • {devices?.length || 0} devices
              </Sub>
            </Title>

            <Search
              placeholder="Search by name, bundle id…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Left>

          <Upload onUploadSuccess={refetchApps} />
        </TopBar>

        <TableWrap>
          <Table>
            <Thead>
              <tr>
                <Th style={{ width: 64 }}></Th>
                <Th>App</Th>
                <Th>Version</Th>
                <Th>Platform</Th>
                <Th>Uploaded</Th>
                <Th>Expires</Th>
                <Th>Installed on</Th>
                <Th style={{ width: 170, textAlign: "right" }}>Actions</Th>
              </tr>
            </Thead>

            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <Empty>No apps match your search.</Empty>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <AppSingleCell
                    key={app.id || app.CFBundleIdentifier}
                    app={app}
                    devicesByUdid={devicesByUdid}
                    onPush={openPush}
                    onMoreInfo={openDetails}
                  />
                ))
              )}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      {/* Push Modal */}
      <Overlay $open={pushOpen}>
        <Modal>
          <ModalHeader>
            <div>
              <ModalTitle>Push app</ModalTitle>
              <Small>
                {selectedApp?.CFBundleDisplayName || selectedApp?.name || "—"} •{" "}
                {selectedApp?.CFBundleIdentifier || "—"}
              </Small>
            </div>
            <CloseBtn onClick={() => setPushOpen(false)}>&times;</CloseBtn>
          </ModalHeader>

          <ModalBody>
            <BodyLeft>
              <Small>Target selection</Small>
              <div style={{ marginTop: 8 }}>
                <Segments>
                  <Segment
                    $active={targetMode === "missing"}
                    onClick={() => onChangeTargetMode("missing")}
                  >
                    Missing
                  </Segment>
                  <Segment
                    $active={targetMode === "installed"}
                    onClick={() => onChangeTargetMode("installed")}
                  >
                    Installed
                  </Segment>
                  <Segment
                    $active={targetMode === "eligible"}
                    onClick={() => onChangeTargetMode("eligible")}
                  >
                    Eligible
                  </Segment>
                  <Segment
                    $active={targetMode === "all"}
                    onClick={() => onChangeTargetMode("all")}
                  >
                    All
                  </Segment>
                </Segments>
              </div>

              <StatRow>
                <Stat>
                  <div>Selected</div>
                  <div>{selectedUdids.length}</div>
                </Stat>
                <Stat>
                  <div>Installed</div>
                  <div>{computedTargets.installed.length}</div>
                </Stat>
                <Stat>
                  <div>Missing</div>
                  <div>{computedTargets.missing.length}</div>
                </Stat>
                <Stat>
                  <div>Eligible (profile)</div>
                  <div>{computedTargets.eligible.length}</div>
                </Stat>
              </StatRow>

              <div style={{ marginTop: 14 }}>
                <Small>Quick actions</Small>
                <ActionRow>
                  <GhostBtn onClick={() => quickSelect("missing")}>Select missing</GhostBtn>
                  <GhostBtn onClick={() => quickSelect("all")}>Select all</GhostBtn>
                  <GhostBtn onClick={() => setSelectedUdids([])}>Clear</GhostBtn>
                </ActionRow>
              </div>

              <div style={{ marginTop: 16 }}>
                <Small>Device search</Small>
                <div style={{ marginTop: 8 }}>
                  <DeviceSearch
                    value={deviceSearch}
                    placeholder="Filter devices by name/udid…"
                    onChange={(e) => setDeviceSearch(e.target.value)}
                  />
                </div>

                <DeviceList>
                  {visibleDeviceUdids.map((udid) => {
                    const d = devicesByUdid.get(udid);
                    const name = d?.DeviceName || udid;

                    const isInstalled = installedSet.has(udid);
                    const isEligible = eligibleSet.has(udid);

                    const tone = !isEligible ? "bad" : isInstalled ? "ok" : "warn";
                    const label = !isEligible
                      ? "Not eligible"
                      : isInstalled
                      ? "Installed"
                      : "Not installed";

                    return (
                      <DeviceRow key={udid}>
                        <DeviceLeft>
                          <input
                            type="checkbox"
                            checked={selectedUdids.includes(udid)}
                            onChange={() => toggleUdid(udid)}
                          />
                          <div>
                            <div style={{ fontWeight: 800 }}>{name}</div>
                            <Small style={{ marginTop: 2 }}>{udid}</Small>
                          </div>
                        </DeviceLeft>
                        <Pill $tone={tone}>{label}</Pill>
                      </DeviceRow>
                    );
                  })}
                  {visibleDeviceUdids.length === 0 ? (
                    <Empty style={{ padding: 12 }}>No devices match filter.</Empty>
                  ) : null}
                </DeviceList>
              </div>
            </BodyLeft>

            <BodyRight>
              <Small>Push</Small>
              <div style={{ marginTop: 8 }}>
                <PrimaryBtn
                  onClick={handleConfirmPush}
                  disabled={!selectedApp || selectedUdids.length === 0}
                >
                  Push to {selectedUdids.length} device{selectedUdids.length === 1 ? "" : "s"}
                </PrimaryBtn>
              </div>

              <div style={{ marginTop: 12 }}>
                <Small>
                  Tip: “Eligible” uses <code>mobileprovision.ProvisionedDevices</code> so you
                  don’t accidentally target devices outside the profile.
                </Small>
              </div>
            </BodyRight>
          </ModalBody>
        </Modal>
      </Overlay>

      {/* Details Modal */}
      <Overlay $open={detailsOpen}>
        <Modal>
          <ModalHeader>
            <div>
              <ModalTitle>App details</ModalTitle>
              <Small>
                {selectedApp?.CFBundleDisplayName || selectedApp?.name || "—"} •{" "}
                {selectedApp?.CFBundleIdentifier || "—"}
              </Small>
              <Tabs>
                <Tab $active={detailsTab === "summary"} onClick={() => setDetailsTab("summary")}>
                  Summary
                </Tab>
                <Tab
                  $active={detailsTab === "provision"}
                  onClick={() => setDetailsTab("provision")}
                >
                  Provisioning
                </Tab>
                <Tab
                  $active={detailsTab === "entitlements"}
                  onClick={() => setDetailsTab("entitlements")}
                >
                  Entitlements
                </Tab>
                <Tab $active={detailsTab === "raw"} onClick={() => setDetailsTab("raw")}>
                  Raw
                </Tab>
              </Tabs>
            </div>
            <CloseBtn onClick={() => setDetailsOpen(false)}>&times;</CloseBtn>
          </ModalHeader>

          <div style={{ padding: "14px 16px" }}>
            {detailsTab === "summary" && (
              <Pre>
                {JSON.stringify(
                  {
                    name: selectedApp?.CFBundleDisplayName || selectedApp?.name,
                    bundleId: selectedApp?.CFBundleIdentifier,
                    version: selectedApp?.CFBundleShortVersionString,
                    platform: selectedApp?.infolist?.DTPlatformName,
                    minOS: selectedApp?.infolist?.MinimumOSVersion,
                    uploaded: selectedApp?.uploaded,
                    installedDevices: (selectedApp?.devices || []).length,
                  },
                  null,
                  2
                )}
              </Pre>
            )}

            {detailsTab === "provision" && (
              <Pre>
                {JSON.stringify(
                  {
                    TeamName: selectedApp?.mobileprovision?.TeamName,
                    AppIDName: selectedApp?.mobileprovision?.AppIDName,
                    UUID: selectedApp?.mobileprovision?.UUID,
                    CreationDate: selectedApp?.mobileprovision?.CreationDate,
                    ExpirationDate: selectedApp?.mobileprovision?.ExpirationDate,
                    TimeToLive: selectedApp?.mobileprovision?.TimeToLive,
                    ProvisionedDevicesCount:
                      selectedApp?.mobileprovision?.ProvisionedDevices?.length || 0,
                  },
                  null,
                  2
                )}
              </Pre>
            )}

            {detailsTab === "entitlements" && (
              <Pre>
                {JSON.stringify(selectedApp?.mobileprovision?.Entitlements || {}, null, 2)}
              </Pre>
            )}

            {detailsTab === "raw" && <Pre>{JSON.stringify(selectedApp || {}, null, 2)}</Pre>}
          </div>
        </Modal>
      </Overlay>
    </Page>
  );
}

export default AppList;
