import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import axiosInstance from "../utils/axios";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { deviceIconName } from "./device/deviceIconfunction";

const fetchDevices = async () => {
  const { data } = await axiosInstance.get("/v1/getDevicesSmall");
  return data;
};

/* ---------- Styling ---------- */

const Side = styled.div`
  width: clamp(320px, 32vw, 660px);
  max-width: 92vw;
  background: #f6f7fb;
  border-right: 1px solid rgba(0,0,0,0.06);
  padding: 16px;
  overflow: auto;
`;


const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(0,0,0,0.06);
  overflow: hidden;
`;

const Top = styled.div`
  padding: 12px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
`;

const Title = styled.div`
  font-weight: 900;
  font-size: 14px;
`;

const Sub = styled.div`
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.7;
`;

const Search = styled.input`
  width: 100%;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.12);
  outline: none;

  &:focus {
    border-color: rgba(0,123,255,0.6);
    box-shadow: 0 0 0 4px rgba(0,123,255,0.12);
  }
`;

const Segments = styled.div`
  margin-top: 10px;
  display: inline-flex;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
`;

const Seg = styled.button`
  flex: 1;
  border: 0;
  padding: 10px 10px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "rgba(0,123,255,0.92)" : "white")};
  color: ${({ $active }) => ($active ? "white" : "rgba(0,0,0,0.75)")};
  font-weight: 900;
  font-size: 12px;

  &:hover {
    background: ${({ $active }) => ($active ? "rgba(0,123,255,1)" : "rgba(0,0,0,0.03)")};
  }
`;

const List = styled.div`
  padding: 10px;
  display: grid;
  gap: 10px;
`;

const Row = styled.button`
  text-align: left;
  border: 1px solid rgba(0,0,0,0.08);
  background: white;
  border-radius: 16px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(0,0,0,0.02);
  }
`;

const RowTop = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
`;

const Left = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
`;

const IconWrap = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(0,0,0,0.05);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
`;

const Name = styled.div`
  font-weight: 900;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Meta = styled.div`
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Pills = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 0 0 auto;
`;

const Pill = styled.span`
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  background: ${({ $tone }) =>
    $tone === "ok" ? "rgba(40,167,69,0.14)" :
    $tone === "warn" ? "rgba(255,193,7,0.16)" :
    $tone === "bad" ? "rgba(220,53,69,0.14)" :
    "rgba(0,0,0,0.06)"};
`;

const Bottom = styled.div`
  margin-top: 10px;
  display: grid;
  gap: 4px;
  font-size: 12px;
  opacity: 0.8;
`;

const Empty = styled.div`
  padding: 18px;
  text-align: center;
  opacity: 0.7;
`;

/* ---------- Helpers ---------- */

function DeviceCard({ device }) {
  const iconClass = deviceIconName(device.ModelName);

  const enrolled = !!device.enrollment_status;
  const supervised = !!device.IsSupervised;

  return (
    <>
      <RowTop>
        <Left>
          <IconWrap>
            <span className={iconClass} />
          </IconWrap>
          <div style={{ minWidth: 0 }}>
            <Name>{device.DeviceName || "Unnamed device"}</Name>
            <Meta>
              {device.ModelName || "—"} • iOS {device.OSVersion || "—"}
            </Meta>
          </div>
        </Left>

        <Pills>
          {supervised ? <Pill $tone="ok">🔒 Supervised</Pill> : <Pill>Unsupervised</Pill>}
          {enrolled ? <Pill $tone="ok">Enrolled</Pill> : <Pill $tone="bad">Not enrolled</Pill>}
        </Pills>
      </RowTop>

      <Bottom>
        {device.user?.name || device.user?.username ? (
          <div><strong>User:</strong> {device.user?.name ?? device.user?.username}</div>
        ) : null}
        {device.udid ? (
          <div style={{ opacity: 0.7 }}><strong>UDID:</strong> {device.udid}</div>
        ) : null}
      </Bottom>
    </>
  );
}

function DeviceList() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery("devices", fetchDevices);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | enrolled | not | supervised



  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = data || [];

    return list.filter((d) => {
      if (filter === "enrolled" && !d.enrollment_status) return false;
      if (filter === "not" && d.enrollment_status) return false;
      if (filter === "supervised" && !d.IsSupervised) return false;

      if (!q) return true;
      return (
        d.DeviceName?.toLowerCase().includes(q) ||
        d.ModelName?.toLowerCase().includes(q) ||
        d.udid?.toLowerCase().includes(q) ||
        d.user?.name?.toLowerCase().includes(q) ||
        d.user?.username?.toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery, filter]);


  if (isLoading) return <Side>Loading…</Side>;
  if (error) return <Side>Error fetching devices</Side>;


  return (
    <Side>
      <Card>
        <Top>
          <Title>Devices</Title>
          <Sub>{filtered.length} shown • {data?.length || 0} total</Sub>

          <Search
            placeholder="Search name, model, udid, user…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Segments>
            <Seg $active={filter === "all"} onClick={() => setFilter("all")}>All</Seg>
            <Seg $active={filter === "enrolled"} onClick={() => setFilter("enrolled")}>Enrolled</Seg>
            <Seg $active={filter === "not"} onClick={() => setFilter("not")}>Not</Seg>
            <Seg $active={filter === "supervised"} onClick={() => setFilter("supervised")}>Supervised</Seg>
          </Segments>
        </Top>

        <List>
          {filtered.length === 0 ? (
            <Empty>No devices match your search/filter.</Empty>
          ) : (
            filtered.map((device) => (
              <Row key={device.udid} onClick={() => navigate(`/devices/${device.udid}`)}>
                <DeviceCard device={device} />
              </Row>
            ))
          )}
        </List>
      </Card>
    </Side>
  );
}

export default DeviceList;
