import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios";

const Page = styled.div`
  flex: 1;
  overflow: auto;
  background: var(--app-bg);
  color: var(--text);
  padding: 18px;

  @media (max-width: 600px) { padding: 10px; }
`;

const Shell = styled.div`
  display: grid;
  gap: 14px;
  width: min(1420px, 100%);
  margin: 0 auto;
`;

const Card = styled.section`
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  padding: 16px;

  @media (max-width: 600px) { padding: 12px; }
`;

const Header = styled(Card)`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  flex-wrap: wrap;
`;

const Kicker = styled.div`
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 4px 0 0;
  font-size: 24px;
  line-height: 1.15;
`;

const SectionTitle = styled.h2`
  margin: 3px 0 0;
  font-size: 18px;
`;

const Sub = styled.div`
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.45;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 600px) { width: 100%; > * { flex: 1 1 auto; justify-content: center; } }
`;

const Button = styled.button`
  min-height: 38px;
  border: 1px solid ${({ $primary }) => ($primary ? "var(--accent)" : "var(--border-strong)")};
  border-radius: var(--radius-sm);
  padding: 0 12px;
  color: ${({ $primary }) => ($primary ? "white" : "var(--text)")};
  background: ${({ $primary }) => ($primary ? "var(--accent)" : "var(--surface)")};
  font-weight: 850;
  cursor: pointer;

  &:hover { background: ${({ $primary }) => ($primary ? "var(--accent-hover)" : "var(--surface-hover)")}; }
  &:disabled { opacity: 0.48; cursor: default; }
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 9px;
  color: ${({ $tone }) => $tone === "ok" ? "var(--ok)" : $tone === "bad" ? "var(--bad)" : $tone === "warn" ? "var(--warn)" : $tone === "accent" ? "var(--accent)" : "var(--text-muted)"};
  background: ${({ $tone }) => $tone === "ok" ? "var(--ok-soft)" : $tone === "bad" ? "var(--bad-soft)" : $tone === "warn" ? "var(--warn-soft)" : $tone === "accent" ? "var(--accent-soft)" : "var(--surface-soft)"};
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 430px) { gap: 7px; }
`;

const Stat = styled(Card)`padding: 13px;`;
const StatValue = styled.div`margin-top: 5px; font-size: 25px; font-weight: 950;`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(0, 1.5fr);
  gap: 14px;
  align-items: start;
  @media (max-width: 980px) { grid-template-columns: 1fr; }
`;

const Steps = styled.div`display: grid; gap: 8px; margin-top: 14px;`;
const Step = styled.div`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: ${({ $complete }) => ($complete ? "var(--ok-soft)" : "var(--surface-muted)")};
`;
const StepIcon = styled.div`
  width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%;
  color: ${({ $complete }) => ($complete ? "white" : "var(--text-muted)")};
  background: ${({ $complete }) => ($complete ? "var(--ok)" : "var(--surface-soft)")};
  font-size: 12px; font-weight: 950;
`;

const CodeRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  margin-top: 12px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;
const Code = styled.code`
  min-width: 0;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 8px;
  color: #fff;
  background: #101010;
  font-size: 11px;
  white-space: nowrap;
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: 10px;
  margin-top: 12px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`;

const Input = styled.input`
  width: 100%; min-height: 38px; border: 1px solid var(--border); border-radius: 8px;
  padding: 0 11px; color: var(--text); background: var(--surface-muted);
`;

const Segments = styled.div`
  display: flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
  @media (max-width: 600px) { overflow-x: auto; > * { flex: 1 0 auto; } }
`;
const Segment = styled.button`
  min-height: 36px; border: 0; border-right: 1px solid var(--border); padding: 0 10px;
  color: ${({ $active }) => ($active ? "var(--accent)" : "var(--text-muted)")};
  background: ${({ $active }) => ($active ? "var(--accent-soft)" : "var(--surface)")};
  font-size: 11px; font-weight: 850; cursor: pointer;
  &:last-child { border-right: 0; }
`;

const DeviceList = styled.div`display: grid; gap: 7px; margin-top: 12px;`;
const DeviceRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 11px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface-muted);
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;
const DeviceName = styled.div`font-size: 14px; font-weight: 900;`;
const DeviceMeta = styled.div`margin-top: 3px; color: var(--text-muted); font-size: 11px;`;

const Groups = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 12px;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;
const Check = styled.label`
  display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px; align-items: start;
  padding: 7px 0; border-top: 1px solid var(--border); cursor: pointer;
  &:first-of-type { border-top: 0; }
  strong { font-size: 12px; }
  span { display: block; margin-top: 2px; color: var(--text-muted); font-size: 10px; }
`;

const Message = styled.div`
  margin-top: 10px; padding: 9px 11px; border-radius: 8px;
  color: ${({ $error }) => ($error ? "var(--bad)" : "var(--ok)")};
  background: ${({ $error }) => ($error ? "var(--bad-soft)" : "var(--ok-soft)")};
  font-size: 12px; font-weight: 800;
`;

const Empty = styled.div`padding: 24px 8px; color: var(--text-muted); text-align: center; font-size: 13px;`;

const fetchSummary = async () => (await axiosInstance.get("/v1/ddm/admin/summary")).data;
const fetchSubscriptions = async () => (await axiosInstance.get("/v1/ddm/admin/subscriptions")).data;

function formatTime(value) {
  if (!value) return "Never";
  const numeric = Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function DDMDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("supported");
  const [selectedItems, setSelectedItems] = useState([]);
  const [message, setMessage] = useState(null);
  const { data: summary, isLoading, error } = useQuery("ddmSummary", fetchSummary, { refetchInterval: 15000 });
  const { data: subscriptions } = useQuery("ddmSubscriptions", fetchSubscriptions);

  useEffect(() => {
    if (subscriptions?.selected) setSelectedItems(subscriptions.selected);
  }, [subscriptions?.selected]);

  const prepare = useMutation(() => axiosInstance.post("/v1/ddm/admin/sync", {}), {
    onSuccess: ({ data }) => {
      setMessage({ text: `Prepared ${data.profilesSynced || 0} profiles and ${data.appsSynced || 0} apps.` });
      queryClient.invalidateQueries("ddmSummary");
    },
    onError: (requestError) => setMessage({ error: true, text: requestError?.response?.data?.error || "Could not prepare declarations." }),
  });

  const enable = useMutation((udid) => axiosInstance.post(`/v1/ddm/admin/device/${udid}/enable`, {}), {
    onSuccess: (_, udid) => {
      setMessage({ text: `DDM sync requested for ${summary?.devices?.find((device) => device.udid === udid)?.name || udid}.` });
      queryClient.invalidateQueries("ddmSummary");
    },
    onError: (requestError) => setMessage({ error: true, text: requestError?.response?.data?.error || "The DDM command could not be queued." }),
  });

  const saveSubscriptions = useMutation((items) => axiosInstance.post("/v1/ddm/admin/subscriptions/save", { items }), {
    onSuccess: () => {
      setMessage({ text: "Monitoring choices saved. Request sync on active devices to apply them immediately." });
      queryClient.invalidateQueries("ddmSummary");
      queryClient.invalidateQueries("ddmSubscriptions");
    },
    onError: (requestError) => setMessage({ error: true, text: requestError?.response?.data?.error || "Could not save monitoring choices." }),
  });

  const devices = useMemo(() => (summary?.devices || []).filter((device) => {
    if (filter === "supported" && !device.support?.supported) return false;
    if (filter === "active" && device.phase?.key !== "active") return false;
    if (filter === "attention" && !["waiting", "syncing", "stale", "error"].includes(device.phase?.key)) return false;
    const term = search.trim().toLowerCase();
    return !term || `${device.name} ${device.model} ${device.udid} ${device.support?.platform}`.toLowerCase().includes(term);
  }), [summary?.devices, filter, search]);

  const groups = useMemo(() => (subscriptions?.catalog || []).reduce((output, item) => {
    const group = item.group || "Other";
    output[group] = output[group] || [];
    output[group].push(item);
    return output;
  }, {}), [subscriptions?.catalog]);

  if (isLoading) return <Page><Empty>Loading declarative management…</Empty></Page>;
  if (error) return <Page><Message $error>Could not load the DDM service state.</Message></Page>;

  const counts = summary?.counts || {};
  return <Page><Shell>
    <Header>
      <div><Kicker>Modern management</Kicker><Title>Declarative Device Management</Title><Sub>Prepare the service, connect supported devices, and see exactly where each device is in the setup process.</Sub></div>
      <Actions>
        <Pill $tone={summary?.setup?.complete ? "ok" : "warn"}>{summary?.setup?.complete ? "Setup healthy" : "Setup needs attention"}</Pill>
        <Button onClick={() => queryClient.invalidateQueries("ddmSummary")}>Refresh</Button>
        <Button $primary disabled={prepare.isLoading} onClick={() => prepare.mutate()}>{prepare.isLoading ? "Preparing…" : "Prepare declarations"}</Button>
      </Actions>
    </Header>

    {message ? <Message $error={message.error}>{message.text}</Message> : null}

    <Stats>
      <Stat><Kicker>Supported</Kicker><StatValue>{counts.supportedDevices || 0}</StatValue><Sub>of {counts.devices || 0} enrolled records</Sub></Stat>
      <Stat><Kicker>Active</Kicker><StatValue>{counts.ddmEnabledDevices || 0}</StatValue><Sub>reporting DDM status</Sub></Stat>
      <Stat><Kicker>Attention</Kicker><StatValue>{counts.attentionDevices || 0}</StatValue><Sub>waiting, stale or failed</Sub></Stat>
      <Stat><Kicker>Active declarations</Kicker><StatValue>{counts.activeDeclarations || 0}</StatValue><Sub>{counts.statusReports || 0} status reports stored</Sub></Stat>
    </Stats>

    <TwoCol>
      <Card>
        <Kicker>Setup assistant</Kicker><SectionTitle>Service readiness</SectionTitle>
        <Steps>{(summary?.setup?.steps || []).map((step, index) => <Step key={step.key} $complete={step.complete}><StepIcon $complete={step.complete}>{step.complete ? "✓" : index + 1}</StepIcon><div><DeviceName>{step.title}</DeviceName><Sub>{step.detail}</Sub></div></Step>)}</Steps>
        <CodeRow><Code>{summary?.recommendedMicroMdmFlag}</Code><Button onClick={() => navigator.clipboard?.writeText(summary?.recommendedMicroMdmFlag || "")}>Copy</Button></CodeRow>
      </Card>

      <Card>
        <Kicker>Fleet readiness</Kicker><SectionTitle>Devices</SectionTitle><Sub>Unsupported devices are identified before any command is sent.</Sub>
        <Toolbar>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search device, platform or UDID…" />
          <Segments>{[["supported", "Supported"], ["active", "Active"], ["attention", "Attention"], ["all", "All"]].map(([key, label]) => <Segment key={key} $active={filter === key} onClick={() => setFilter(key)}>{label}</Segment>)}</Segments>
        </Toolbar>
        <DeviceList>{devices.length ? devices.map((device) => {
          const canEnable = device.support?.supported && device.enrolled;
          const actionLabel = device.phase?.key === "active" ? "Request sync" : ["waiting", "syncing", "stale", "error"].includes(device.phase?.key) ? "Retry sync" : "Enable DDM";
          return <DeviceRow key={device.udid}>
            <div><Actions><DeviceName>{device.name}</DeviceName><Pill $tone={device.phase?.tone}>{device.phase?.label}</Pill></Actions><DeviceMeta>{device.model} · {device.support?.platform} {device.osVersion || "unknown"} · Last status {formatTime(device.state?.lastStatusAt)}</DeviceMeta><Sub>{device.phase?.detail}</Sub></div>
            <Actions><Button onClick={() => navigate(`/devices/${device.udid}`)}>Open</Button><Button $primary disabled={!canEnable || enable.isLoading} onClick={() => enable.mutate(device.udid)}>{actionLabel}</Button></Actions>
          </DeviceRow>;
        }) : <Empty>No devices match this view.</Empty>}</DeviceList>
      </Card>
    </TwoCol>

    <Card>
      <Actions style={{ justifyContent: "space-between" }}><div><Kicker>Status reporting</Kicker><SectionTitle>Monitoring subscriptions</SectionTitle><Sub>Choose only the status areas useful to you. These choices apply to all DDM-enabled devices.</Sub></div><Actions><Button onClick={() => setSelectedItems([])}>Clear</Button><Button onClick={() => setSelectedItems((subscriptions?.catalog || []).map((item) => item.key))}>Select all</Button><Button $primary disabled={saveSubscriptions.isLoading} onClick={() => saveSubscriptions.mutate(selectedItems)}>{saveSubscriptions.isLoading ? "Saving…" : `Save ${selectedItems.length} items`}</Button></Actions></Actions>
      <Groups>{Object.entries(groups).map(([group, items]) => <div key={group}><Kicker>{group}</Kicker>{items.map((item) => <Check key={item.key}><input type="checkbox" checked={selectedItems.includes(item.key)} onChange={() => setSelectedItems((current) => current.includes(item.key) ? current.filter((key) => key !== item.key) : [...current, item.key])} /><div><strong>{item.label}</strong><span>{item.key}</span></div></Check>)}</div>)}</Groups>
    </Card>

    <Card>
      <Kicker>Declaration service</Kicker><SectionTitle>Recently updated declarations</SectionTitle>
      <DeviceList>{(summary?.recentDeclarations || []).map((declaration) => <DeviceRow key={declaration.identifier}><div><DeviceName>{declaration.identifier}</DeviceName><DeviceMeta>{declaration.type} · {declaration.sourceType} · Updated {formatTime(declaration.updatedAt)}</DeviceMeta></div><Pill $tone={declaration.active ? "ok" : "muted"}>{declaration.active ? declaration.category : "Inactive"}</Pill></DeviceRow>)}</DeviceList>
    </Card>
  </Shell></Page>;
}

export default DDMDashboard;
