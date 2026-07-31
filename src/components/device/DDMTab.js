import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useMutation, useQuery, useQueryClient } from "react-query";
import axiosInstance from "../../utils/axios";

const Layout = styled.div`display: grid; gap: 10px;`;
const Card = styled.section`
  min-width: 0; border: 1px solid var(--border); border-radius: 9px;
  background: var(--surface); overflow: hidden;
`;
const CardBody = styled.div`padding: 13px;`;
const Header = styled(CardBody)`
  display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
`;
const Heading = styled.div`min-width: 0;`;
const Kicker = styled.div`color: var(--text-muted); font-size: 10px; font-weight: 900; letter-spacing: .07em; text-transform: uppercase;`;
const Title = styled.h3`margin: 3px 0 0; color: var(--text); font-size: 16px; line-height: 1.2;`;
const Sub = styled.div`margin-top: 3px; color: var(--text-muted); font-size: 11px; line-height: 1.4;`;
const Actions = styled.div`display: flex; gap: 7px; align-items: center; flex-wrap: wrap;`;
const Button = styled.button`
  min-height: 34px; border: 1px solid ${({ $primary }) => ($primary ? "var(--accent)" : "var(--border-strong)")};
  border-radius: 8px; padding: 0 11px; color: ${({ $primary }) => ($primary ? "white" : "var(--text)")};
  background: ${({ $primary }) => ($primary ? "var(--accent)" : "var(--surface)")}; font-size: 12px; font-weight: 850; cursor: pointer;
  &:disabled { opacity: .45; cursor: default; }
`;
const Pill = styled.span`
  display: inline-flex; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 900;
  color: ${({ $tone }) => $tone === "ok" ? "var(--ok)" : $tone === "bad" ? "var(--bad)" : $tone === "warn" ? "var(--warn)" : $tone === "accent" ? "var(--accent)" : "var(--text-muted)"};
  background: ${({ $tone }) => $tone === "ok" ? "var(--ok-soft)" : $tone === "bad" ? "var(--bad-soft)" : $tone === "warn" ? "var(--warn-soft)" : $tone === "accent" ? "var(--accent-soft)" : "var(--surface-soft)"};
`;
const Metrics = styled.div`
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--border);
  @media (max-width: 680px) { grid-template-columns: repeat(2, 1fr); }
`;
const Metric = styled.div`
  min-width: 0; padding: 10px 12px; border-right: 1px solid var(--border);
  &:last-child { border-right: 0; }
  strong { display: block; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  span { display: block; margin-top: 2px; color: var(--text-muted); font-size: 9px; font-weight: 800; text-transform: uppercase; }
`;
const Search = styled.input`
  width: min(300px, 100%); min-height: 34px; border: 1px solid var(--border); border-radius: 8px;
  padding: 0 10px; color: var(--text); background: var(--surface-muted); font-size: 12px;
`;
const StateList = styled.div`border-top: 1px solid var(--border);`;
const StateRow = styled.div`
  display: grid; grid-template-columns: minmax(180px, .7fr) minmax(0, 1.3fr); gap: 14px;
  align-items: start; padding: 10px 13px; border-bottom: 1px solid var(--border);
  &:last-child { border-bottom: 0; }
  @media (max-width: 620px) { grid-template-columns: 1fr; gap: 4px; }
`;
const StateName = styled.div`font-size: 12px; font-weight: 850;`;
const StateKey = styled.code`display:block;margin-top:2px;color:var(--text-muted);font-size:9px;word-break:break-all;`;
const StateValue = styled.div`font-size: 12px; line-height: 1.4; word-break: break-word;`;
const Details = styled.details`
  border-top: 1px solid var(--border); background: var(--surface-muted);
  summary { padding: 11px 13px; cursor: pointer; color: var(--text-muted); font-size: 11px; font-weight: 850; }
`;
const DetailsBody = styled.div`padding: 0 13px 13px;`;
const Progress = styled.div`display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;@media(max-width:680px){grid-template-columns:repeat(2,1fr);}`;
const Stage = styled.div`
  padding:8px;border:1px solid ${({ $complete }) => ($complete ? "var(--ok)" : "var(--border)")};border-radius:7px;
  background:${({ $complete }) => ($complete ? "var(--ok-soft)" : "var(--surface)")};
  strong{display:block;font-size:10px;}span{display:block;margin-top:2px;color:var(--text-muted);font-size:9px;}
`;
const ErrorBox = styled.div`margin:10px 13px;padding:9px 10px;border-radius:7px;color:var(--bad);background:var(--bad-soft);font-size:11px;white-space:pre-wrap;`;
const Message = styled.div`
  padding:9px 11px;border-radius:8px;color:${({ $error }) => ($error ? "var(--bad)" : "var(--ok)")};
  background:${({ $error }) => ($error ? "var(--bad-soft)" : "var(--ok-soft)")};font-size:11px;font-weight:800;
`;
const Raw = styled.pre`max-height:260px;overflow:auto;margin:7px 0 0;padding:9px;border-radius:7px;background:#101010;color:#f5f5f5;font-size:9px;`;
const Empty = styled.div`padding:24px 13px;color:var(--text-muted);text-align:center;font-size:12px;`;

const fetchDDMState = async (udid) => (await axiosInstance.get(`/v1/ddm/admin/device/${udid}/state`)).data;

function formatTime(value) {
  if (!value) return "Not yet";
  const date = new Date(Number(value) * 1000);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function valueSummary(value) {
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (value && typeof value === "object") return `${Object.keys(value).length} value${Object.keys(value).length === 1 ? "" : "s"}`;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function DDMTab({ device }) {
  const queryClient = useQueryClient();
  const udid = device?.udid;
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const { data, isLoading, error } = useQuery(["ddmDeviceState", udid], () => fetchDDMState(udid), { enabled: !!udid, refetchInterval: 10000 });
  const enable = useMutation(() => axiosInstance.post(`/v1/ddm/admin/device/${udid}/enable`, {}), {
    onSuccess: () => { setMessage({ text: "Sync requested. This view will update when the device responds." }); queryClient.invalidateQueries(["ddmDeviceState", udid]); },
    onError: (requestError) => setMessage({ error: true, text: requestError?.response?.data?.error || "The DDM request could not be queued." }),
  });

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.statusSnapshot?.items || []).filter((item) => !term || `${item.label} ${item.key} ${valueSummary(item.value)}`.toLowerCase().includes(term));
  }, [data?.statusSnapshot?.items, search]);

  if (isLoading) return <Empty>Loading declarative state…</Empty>;
  if (error) return <Message $error>Could not load this device’s declarative state.</Message>;

  const overview = data?.overview || {};
  const state = data?.state || {};
  const support = overview.support || {};
  const phase = overview.phase || {};
  const snapshot = data?.statusSnapshot || {};
  const stages = [["Command", state.enableCommandSentAt], ["Tokens", state.lastTokenUpdate], ["Declarations", state.lastDeclarationItemsRequest], ["Status", state.lastStatusAt]];
  const completedStages = stages.filter(([, time]) => !!time).length;
  const actionLabel = phase.key === "active" ? "Request sync" : ["waiting", "syncing", "stale", "error"].includes(phase.key) ? "Retry setup" : "Enable DDM";

  return <Layout>
    {message ? <Message $error={message.error}>{message.text}</Message> : null}
    <Card>
      <Header>
        <Heading><Actions><Kicker>Declarative management</Kicker><Pill $tone={phase.tone}>{phase.label}</Pill></Actions><Title>{support.supported ? `${support.platform} ${support.version}` : "Not supported"}</Title><Sub>{phase.detail || support.reason}</Sub></Heading>
        <Button $primary disabled={!support.supported || !overview.enrolled || enable.isLoading} onClick={() => enable.mutate()}>{enable.isLoading ? "Sending…" : actionLabel}</Button>
      </Header>
      <Metrics>
        <Metric><strong>{completedStages}/4</strong><span>Handshake</span></Metric>
        <Metric><strong>{snapshot.items?.length || 0}</strong><span>Reported values</span></Metric>
        <Metric><strong>{snapshot.errors?.length || 0}</strong><span>Status errors</span></Metric>
        <Metric><strong>{formatTime(state.lastStatusAt)}</strong><span>Last report</span></Metric>
      </Metrics>
    </Card>

    <Card>
      <Header><Heading><Kicker>Reported state</Kicker><Title>Current values</Title><Sub>Latest accumulated state from full and incremental DDM reports.</Sub></Heading>{snapshot.items?.length ? <Search value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${snapshot.items.length} values…`} /> : null}</Header>
      {items.length ? <StateList>{items.map((item) => <StateRow key={item.key}><div><StateName>{item.label || item.key}</StateName><StateKey>{item.key}</StateKey></div><StateValue>{valueSummary(item.value)}{item.complex ? <details><summary style={{ cursor: "pointer", marginTop: 4, color: "var(--accent)", fontSize: 10 }}>View details</summary><Raw>{JSON.stringify(item.value, null, 2)}</Raw></details> : null}</StateValue></StateRow>)}</StateList> : <Empty>{snapshot.items?.length ? "No values match this search." : "No DDM status has been reported yet."}</Empty>}
      {(snapshot.errors || []).map((statusError, index) => <ErrorBox key={index}>{JSON.stringify(statusError, null, 2)}</ErrorBox>)}
    </Card>

    <Card>
      <Details>
        <summary>Setup and technical details</summary>
        <DetailsBody>
          <Progress>{stages.map(([label, time]) => <Stage key={label} $complete={!!time}><strong>{time ? "✓" : "○"} {label}</strong><span>{formatTime(time)}</span></Stage>)}</Progress>
          <Sub style={{ marginTop: 9 }}>Requires {support.platform} {support.minimumVersion}+ · {overview.enrolled ? "Enrolled" : "Not enrolled"}{overview.supervised ? " · Supervised" : ""} · Command {state.enableCommandUUID || "not sent"}</Sub>
          {(data?.statusReports || []).map((report, index) => <Details key={`${report.receivedAt}-${index}`}><summary>{index === 0 ? "Latest raw report" : `Raw report from ${formatTime(report.receivedAt)}`}</summary><DetailsBody><Raw>{JSON.stringify(report.body || {}, null, 2)}</Raw></DetailsBody></Details>)}
        </DetailsBody>
      </Details>
    </Card>
  </Layout>;
}

export default DDMTab;
