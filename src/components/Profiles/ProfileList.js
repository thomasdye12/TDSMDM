import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import axiosInstance from "../../utils/axios";
import styled from "styled-components";
import Upload from "./UploadProfile";
import ProfileTableRow from "./ProfilelistCell";

/* ---------- API ---------- */

const fetchProfiles = async () => {
  const { data } = await axiosInstance.get("/v1/profiles/get");
  return data;
};

const fetchDevices = async () => {
  const { data } = await axiosInstance.get("/v1/getDevicesSmall");
  return data;
};

/* ---------- Styling (same style as Apps) ---------- */

const Page = styled.div`
  width: 100%;
  min-height: 100vh;
  background: var(--surface-muted);
  padding: 22px;

  @media (max-width: 700px) { min-height: 100%; padding: 10px; }
`;

const Card = styled.div`
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  overflow: hidden;
`;

const TopBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);

  @media (max-width: 700px) {
    align-items: stretch;
    flex-direction: column;
    padding: 12px;
  }
`;

const Left = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 700px) { display: grid; }
`;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const H1 = styled.div`
  font-weight: 900;
  font-size: 16px;
`;

const Sub = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;

const Search = styled.input`
  width: 360px;
  max-width: 70vw;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  outline: none;

  &:focus {
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
  }

  @media (max-width: 700px) { width: 100%; max-width: none; }
`;

const TableWrap = styled.div`
  overflow: auto;

  @media (max-width: 700px) { overflow: visible; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 980px;

  @media (max-width: 700px) {
    display: block;
    min-width: 0;
    padding: 10px;
    tbody { display: grid; gap: 10px; }
  }
`;

const Thead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 5;

  @media (max-width: 700px) { display: none; }
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 14px;
  font-size: 12px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--text-muted);
  background: var(--surface-muted);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
`;

const Empty = styled.div`
  padding: 26px;
  text-align: center;
  opacity: 0.7;
`;

/* ---------- Modal styling ---------- */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 16, 0.55);
  display: ${({ $open }) => ($open ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;

  @media (max-width: 700px) { align-items: flex-end; padding: 0; }
`;

const Modal = styled.div`
  width: min(980px, 96vw);
  background: var(--surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 22px 70px rgba(0,0,0,0.35);

  @media (max-width: 700px) {
    width: 100%;
    max-height: calc(100dvh - env(safe-area-inset-top));
    overflow: auto;
    border-radius: 14px 14px 0 0;
  }
`;

const ModalHeader = styled.div`
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid var(--border);
`;

const ModalTitle = styled.div`
  font-weight: 900;
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
    min-height: 0;
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
  font-weight: 800;
`;

const Segments = styled.div`
  display: inline-flex;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  overflow: hidden;
`;

const Segment = styled.button`
  border: 0;
  padding: 10px 12px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "var(--accent)" : "var(--surface)")};
  color: ${({ $active }) => ($active ? "white" : "var(--text)")};
  font-weight: 900;
  font-size: 12px;

  &:hover {
    background: ${({ $active }) => ($active ? "var(--accent-hover)" : "var(--surface-hover)")};
  }
`;

const StatRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
`;

const Stat = styled.div`
  border: 1px solid var(--border);
  background: var(--surface-muted);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  min-width: 160px;

  div:first-child { font-size: 12px; opacity: 0.7; }
  div:last-child { font-weight: 900; margin-top: 2px; }
`;

const DeviceSearch = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  outline: none;

  &:focus {
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
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

  &:hover { background: rgba(0,0,0,0.03); }
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
  font-weight: 900;
  background: ${({ $tone }) =>
    $tone === "ok" ? "rgba(40,167,69,0.14)"
    : $tone === "warn" ? "rgba(255,193,7,0.16)"
    : "rgba(220,53,69,0.14)"};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
`;

const PrimaryBtn = styled.button`
  border: 0;
  border-radius: 12px;
  padding: 11px 14px;
  background: var(--accent);
  color: white;
  font-weight: 900;
  cursor: pointer;

  &:hover { background: var(--accent-hover); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const DangerBtn = styled(PrimaryBtn)`
  background: rgba(220, 53, 69, 0.92);
  &:hover { background: rgba(220, 53, 69, 1); }
`;

const GhostBtn = styled.button`
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 11px 14px;
  background: var(--surface);
  font-weight: 900;
  cursor: pointer;

  &:hover { background: var(--surface-hover); }
`;

/* ---------- Component ---------- */

function ProfileList() {
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: isProfilesLoading, error: profilesError } = useQuery("profiles", fetchProfiles);
  const { data: devices, isLoading: isDevicesLoading, error: devicesError } = useQuery("devices", fetchDevices);

  const [searchQuery, setSearchQuery] = useState("");

  // action modal
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState("push"); // push | remove
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [targetMode, setTargetMode] = useState("missing"); // all | missing | installed
  const [selectedUdids, setSelectedUdids] = useState([]);

  // details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProfile, setDetailsProfile] = useState(null);
  const [detailsTab, setDetailsTab] = useState("summary"); // summary | devices | raw

  const devicesByUdid = useMemo(() => {
    const m = new Map();
    (devices || []).forEach((d) => m.set(d.udid, d));
    return m;
  }, [devices]);

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = profiles || [];
    if (!q) return list;

    return list.filter((p) => {
      const name = (p.PayloadDisplayName || p.name || "").toLowerCase();
      const uuid = (p.PayloadUUID || "").toLowerCase();
      return name.includes(q) || uuid.includes(q);
    });
  }, [profiles, searchQuery]);

  const installedSet = useMemo(() => {
    const udids = selectedProfile?.devices || [];
    return new Set(Array.isArray(udids) ? udids : []);
  }, [selectedProfile]);

  const computedTargets = useMemo(() => {
    const all = (devices || []).map((d) => d.udid);
    const installed = all.filter((u) => installedSet.has(u));
    const missing = all.filter((u) => !installedSet.has(u));
    return { all, installed, missing };
  }, [devices, installedSet]);

  const visibleDeviceUdids = useMemo(() => {
    const base =
      targetMode === "all" ? computedTargets.all :
      targetMode === "installed" ? computedTargets.installed :
      computedTargets.missing;

    const q = deviceSearch.trim().toLowerCase();
    if (!q) return base;

    return base.filter((udid) => {
      const d = devicesByUdid.get(udid);
      const name = (d?.DeviceName || "").toLowerCase();
      return name.includes(q) || udid.toLowerCase().includes(q);
    });
  }, [targetMode, computedTargets, deviceSearch, devicesByUdid]);

  const openActionModal = (profile, type) => {
    setSelectedProfile(profile);
    setActionType(type);
    setDeviceSearch("");

    // default selection:
    const installed = Array.isArray(profile.devices) ? profile.devices : [];
    const defaults =
      type === "push"
        ? (devices || []).map((d) => d.udid).filter((u) => !installed.includes(u)) // push missing
        : installed; // remove installed

    setTargetMode(type === "push" ? "missing" : "installed");
    setSelectedUdids(defaults);
    setOpen(true);
  };

  const openDetails = (profile) => {
    setDetailsProfile(profile);
    setDetailsTab("summary");
    setDetailsOpen(true);
  };

  const toggleUdid = (udid) => {
    setSelectedUdids((prev) => (prev.includes(udid) ? prev.filter((x) => x !== udid) : [...prev, udid]));
  };

  const quickSelect = (mode) => {
    setSelectedUdids(computedTargets[mode] || []);
  };

  const handleConfirmAction = async () => {
    if (!selectedProfile) return;
    if (selectedUdids.length === 0) {
      alert("Please select at least one device");
      return;
    }

    const payload = {
      profileId: selectedProfile.PayloadUUID,
      deviceUdids: selectedUdids,
    };

    try {
      if (actionType === "push") {
        await axiosInstance.post("/v1/profiles/device/push", payload);
      } else {
        await axiosInstance.post("/v1/profiles/device/remove", payload);
      }

      setOpen(false);
      setSelectedUdids([]);
      queryClient.invalidateQueries("profiles");
    } catch (e) {
      console.error(e);
      alert("Action failed. Check server logs / try again.");
    }
  };

  if (isProfilesLoading || isDevicesLoading) return <Page>Loading…</Page>;
  if (profilesError || devicesError) return <Page>Error fetching data</Page>;

  return (
    <Page>
      <Card>
        <TopBar>
          <Left>
            <Title>
              <H1>Profiles</H1>
              <Sub>{filteredProfiles.length} profiles • {devices?.length || 0} devices</Sub>
            </Title>

            <Search
              placeholder="Search profiles by name / UUID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Left>

          <Upload onUploadSuccess={() => queryClient.invalidateQueries("profiles")} />
        </TopBar>

        <TableWrap>
          <Table>
            <Thead>
              <tr>
                <Th>Profile</Th>
                <Th>Installed on</Th>
                <Th style={{ width: 220, textAlign: "right" }}>Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <Empty>No profiles match your search.</Empty>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((profile) => (
                  <ProfileTableRow
                    key={profile.PayloadUUID}
                    profile={profile}
                    devicesByUdid={devicesByUdid}
                    onPush={() => openActionModal(profile, "push")}
                    onRemove={() => openActionModal(profile, "remove")}
                    onDetails={() => openDetails(profile)}
                  />
                ))
              )}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      {/* Action Modal (push/remove) */}
      <Overlay $open={open}>
        <Modal>
          <ModalHeader>
            <div>
              <ModalTitle>
                {actionType === "push" ? "Push profile" : "Remove profile"}
              </ModalTitle>
              <Sub style={{ marginTop: 2 }}>
                {selectedProfile?.PayloadDisplayName || "—"} • {selectedProfile?.PayloadUUID || "—"}
              </Sub>
            </div>
            <CloseBtn onClick={() => setOpen(false)}>&times;</CloseBtn>
          </ModalHeader>

          <ModalBody>
            <BodyLeft>
              <Small>Target selection</Small>
              <div style={{ marginTop: 8 }}>
                <Segments>
                  <Segment $active={targetMode === "missing"} onClick={() => { setTargetMode("missing"); quickSelect("missing"); }}>
                    Missing
                  </Segment>
                  <Segment $active={targetMode === "installed"} onClick={() => { setTargetMode("installed"); quickSelect("installed"); }}>
                    Installed
                  </Segment>
                  <Segment $active={targetMode === "all"} onClick={() => { setTargetMode("all"); quickSelect("all"); }}>
                    All
                  </Segment>
                </Segments>
              </div>

              <StatRow>
                <Stat><div>Selected</div><div>{selectedUdids.length}</div></Stat>
                <Stat><div>Installed</div><div>{computedTargets.installed.length}</div></Stat>
                <Stat><div>Missing</div><div>{computedTargets.missing.length}</div></Stat>
              </StatRow>

              <div style={{ marginTop: 14 }}>
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
                    const isInstalled = (selectedProfile?.devices || []).includes(udid);
                    const tone = isInstalled ? "ok" : "warn";
                    const label = isInstalled ? "Installed" : "Not installed";

                    return (
                      <DeviceRow key={udid}>
                        <DeviceLeft>
                          <input
                            type="checkbox"
                            checked={selectedUdids.includes(udid)}
                            onChange={() => toggleUdid(udid)}
                          />
                          <div>
                            <div style={{ fontWeight: 900 }}>{name}</div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>{udid}</div>
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
              <Small>Confirm</Small>
              <div style={{ marginTop: 8 }}>
                {actionType === "push" ? (
                  <PrimaryBtn onClick={handleConfirmAction} disabled={selectedUdids.length === 0}>
                    Push to {selectedUdids.length} device{selectedUdids.length === 1 ? "" : "s"}
                  </PrimaryBtn>
                ) : (
                  <DangerBtn onClick={handleConfirmAction} disabled={selectedUdids.length === 0}>
                    Remove from {selectedUdids.length} device{selectedUdids.length === 1 ? "" : "s"}
                  </DangerBtn>
                )}
              </div>

              <ActionRow>
                <GhostBtn onClick={() => quickSelect("all")}>Select all devices</GhostBtn>
                <GhostBtn onClick={() => quickSelect("installed")}>Select installed</GhostBtn>
                <GhostBtn onClick={() => quickSelect("missing")}>Select missing</GhostBtn>
                <GhostBtn onClick={() => setSelectedUdids([])}>Unselect all</GhostBtn>
              </ActionRow>
            </BodyRight>
          </ModalBody>
        </Modal>
      </Overlay>

      {/* Details Modal */}
      <Overlay $open={detailsOpen}>
        <Modal>
          <ModalHeader>
            <div>
              <ModalTitle>Profile details</ModalTitle>
              <Sub style={{ marginTop: 2 }}>
                {detailsProfile?.PayloadDisplayName || "—"} • {detailsProfile?.PayloadUUID || "—"}
              </Sub>
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <GhostBtn onClick={() => setDetailsTab("summary")} style={{ fontWeight: 900 }}>
                  Summary
                </GhostBtn>
                <GhostBtn onClick={() => setDetailsTab("devices")} style={{ fontWeight: 900 }}>
                  Devices
                </GhostBtn>
                <GhostBtn onClick={() => setDetailsTab("raw")} style={{ fontWeight: 900 }}>
                  Raw
                </GhostBtn>
              </div>
            </div>
            <CloseBtn onClick={() => setDetailsOpen(false)}>&times;</CloseBtn>
          </ModalHeader>

          <div style={{ padding: 14 }}>
            <pre style={{
              margin: 0,
              padding: 12,
              borderRadius: 14,
              background: "rgba(2,6,23,0.92)",
              color: "rgba(255,255,255,0.92)",
              fontSize: 12,
              maxHeight: 520,
              overflow: "auto"
            }}>
              {detailsTab === "summary" && JSON.stringify({
                name: detailsProfile?.PayloadDisplayName,
                uuid: detailsProfile?.PayloadUUID,
                installedCount: detailsProfile?.devices?.length || 0,
              }, null, 2)}
              {detailsTab === "devices" && JSON.stringify(
                (detailsProfile?.devices || []).map((udid) => ({
                  udid,
                  name: devicesByUdid.get(udid)?.DeviceName || null
                })),
                null,
                2
              )}
              {detailsTab === "raw" && JSON.stringify(detailsProfile || {}, null, 2)}
            </pre>
          </div>
        </Modal>
      </Overlay>
    </Page>
  );
}

export default ProfileList;
