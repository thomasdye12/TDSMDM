import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import styled from "styled-components";
import axiosInstance from "../../utils/axios";
import MDMIcons from "../../icons/MDMIcons.module.css";

const fetchEvents = async () => {
  const { data } = await axiosInstance.get("/v1/EventQueue/list");
  return Array.isArray(data) ? data : [];
};

const Page = styled.main`
  width: 100%;
  min-height: 100vh;
  padding: 22px;
  background: var(--surface-muted);
`;

const Shell = styled.section`
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
`;

const Header = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  padding: 20px;
  border-bottom: 1px solid var(--border);

  @media (max-width: 720px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const Kicker = styled.div`
  color: var(--accent);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 4px 0 0;
  font-size: 24px;
  letter-spacing: -0.03em;
`;

const Sub = styled.div`
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 13px;
`;

const Search = styled.input`
  width: min(380px, 100%);
  padding: 10px 12px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
  }
`;

const TableWrap = styled.div`
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 850px;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 11px 14px;
  color: var(--text-muted);
  background: var(--surface-muted);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-align: left;
  text-transform: uppercase;
`;

const Td = styled.td`
  padding: 13px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
`;

const Row = styled.tr`
  cursor: pointer;
  &:hover { background: var(--surface-hover); }
  &:last-child ${Td} { border-bottom: 0; }
`;

const Mono = styled.code`
  color: var(--text-muted);
  font-size: 12px;
`;

const Pill = styled.span`
  display: inline-flex;
  padding: 5px 9px;
  color: ${({ $ok }) => ($ok ? "#126b35" : "var(--text)")};
  background: ${({ $ok }) => ($ok ? "#e8f7ee" : "var(--surface-muted)")};
  border: 1px solid ${({ $ok }) => ($ok ? "#b9e4c9" : "var(--border)")};
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
`;

const Empty = styled.div`
  padding: 48px 20px;
  color: var(--text-muted);
  text-align: center;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.62);
`;

const Modal = styled.section`
  width: min(680px, 100%);
  max-height: 84vh;
  overflow: auto;
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
`;

const ModalHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
`;

const Close = styled.button`
  padding: 6px 10px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
`;

const Details = styled.dl`
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr);
  gap: 10px 16px;
  margin: 0;

  dt { color: var(--text-muted); font-size: 12px; font-weight: 700; }
  dd { margin: 0; overflow-wrap: anywhere; font-size: 13px; }
`;

const Raw = styled.pre`
  margin: 18px 0 0;
  padding: 14px;
  overflow: auto;
  color: #f5f5f5;
  background: #111;
  border-radius: var(--radius-sm);
  font-size: 11px;
`;

function eventRequestType(event) {
  return event?.command?.request_type || event?.request_type || "Unknown command";
}

function EventQueue() {
  const { data: events = [], isLoading, error } = useQuery("events", fetchEvents);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((event) => [
      eventRequestType(event),
      event?.command_uuid,
      event?.status,
      event?.udid,
    ].some((value) => String(value || "").toLowerCase().includes(needle)));
  }, [events, search]);

  return (
    <Page>
      <Shell>
        <Header>
          <div>
            <Kicker>Audit trail</Kicker>
            <Title>Command Events</Title>
            <Sub>{filtered.length} shown from {events.length} queued and completed commands</Sub>
          </div>
          <Search
            aria-label="Search events"
            placeholder="Search command, status, device or UUID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Header>

        {isLoading ? <Empty>Loading command events…</Empty> : null}
        {error ? <Empty>Command events could not be loaded.</Empty> : null}
        {!isLoading && !error && filtered.length === 0 ? <Empty>No command events match this view.</Empty> : null}

        {!isLoading && !error && filtered.length > 0 ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th aria-label="Type" />
                  <Th>Command</Th>
                  <Th>Status</Th>
                  <Th>Device</Th>
                  <Th>Created</Th>
                  <Th>Command UUID</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <Row key={event.command_uuid || event._id?.$oid} onClick={() => setSelected(event)}>
                    <Td><span className={MDMIcons[event.eventicon]} /></Td>
                    <Td><strong>{eventRequestType(event)}</strong></Td>
                    <Td><Pill $ok={event.status === "Acknowledged"}>{event.status || "Queued"}</Pill></Td>
                    <Td>{event.udid || "—"}</Td>
                    <Td>{event.created_at ? new Date(event.created_at * 1000).toLocaleString() : "—"}</Td>
                    <Td><Mono>{event.command_uuid || "—"}</Mono></Td>
                  </Row>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : null}
      </Shell>

      {selected ? (
        <Overlay role="presentation" onMouseDown={() => setSelected(null)}>
          <Modal role="dialog" aria-modal="true" aria-label="Event details" onMouseDown={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <Kicker>Command detail</Kicker>
                <Title>{eventRequestType(selected)}</Title>
              </div>
              <Close onClick={() => setSelected(null)}>Close</Close>
            </ModalHeader>
            <Details>
              <dt>Status</dt><dd>{selected.status || "Queued"}</dd>
              <dt>Device</dt><dd>{selected.udid || "—"}</dd>
              <dt>Command UUID</dt><dd><Mono>{selected.command_uuid || "—"}</Mono></dd>
              <dt>Created</dt><dd>{selected.created_at ? new Date(selected.created_at * 1000).toLocaleString() : "—"}</dd>
            </Details>
            <Raw>{JSON.stringify(selected.command || selected, null, 2)}</Raw>
          </Modal>
        </Overlay>
      ) : null}
    </Page>
  );
}

export default EventQueue;
