import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useMutation, useQuery, useQueryClient } from "react-query";
import axiosInstance from "../../utils/axios";
import DeviceInfoItem from "./DeviceInfoItem";

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

const Button = styled.button`
  border: 0;
  border-radius: 12px;
  padding: 9px 11px;
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

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 900;
  background: ${({ $tone }) => $tone === "ok" ? "rgba(40,167,69,0.14)" : "rgba(0,0,0,0.06)"};
`;

const Pre = styled.pre`
  margin: 8px 0 0;
  max-height: 360px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.92);
  color: rgba(255,255,255,0.92);
  font-size: 12px;
`;

const Empty = styled.div`
  padding: 10px 0;
  opacity: 0.68;
`;

const CheckRow = styled.label`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 9px 0;
  border-top: 1px solid rgba(0,0,0,0.06);
  cursor: pointer;

  &:first-of-type {
    border-top: 0;
  }
`;

const Checkbox = styled.input`
  margin-top: 3px;
`;

const TextInput = styled.input`
  width: 100%;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;

  &:focus {
    border-color: rgba(0,123,255,0.6);
    box-shadow: 0 0 0 4px rgba(0,123,255,0.12);
  }
`;

const fetchDDMState = async (udid) => {
  const { data } = await axiosInstance.get(`/v1/ddm/admin/device/${udid}/state`);
  return data;
};

function formatTime(value) {
  if (!value) return "-";
  return new Date(value * 1000).toLocaleString();
}

function DDMTab({ device }) {
  const queryClient = useQueryClient();
  const udid = device?.udid;

  const { data, isLoading, error } = useQuery(
    ["ddmDeviceState", udid],
    () => fetchDDMState(udid),
    { enabled: !!udid, refetchInterval: 5000 }
  );

  const [selectedItems, setSelectedItems] = useState([]);
  const [customItem, setCustomItem] = useState("");

  const syncMutation = useMutation(() => axiosInstance.post("/v1/ddm/admin/sync", {}), {
    onSuccess: () => queryClient.invalidateQueries(["ddmDeviceState", udid]),
  });

  const enableMutation = useMutation(
    () => axiosInstance.post(`/v1/ddm/admin/device/${udid}/enable`, {}),
    {
      onSuccess: () => queryClient.invalidateQueries(["ddmDeviceState", udid]),
    }
  );

  const saveSubscriptionsMutation = useMutation(
    (items) => axiosInstance.post("/v1/ddm/admin/subscriptions/save", { items }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["ddmDeviceState", udid]);
        queryClient.invalidateQueries("ddmSummary");
      },
    }
  );

  useEffect(() => {
    if (data?.selectedSubscriptions) {
      setSelectedItems(data.selectedSubscriptions);
    }
  }, [data?.selectedSubscriptions]);

  const state = data?.state || {};
  const declarations = data?.declarations || [];
  const monitoring = data?.monitoring || [];
  const catalog = data?.subscriptionCatalog || [];
  const reports = data?.statusReports || [];
  const catalogGroups = useMemo(() => {
    return catalog.reduce((groups, item) => {
      const group = item.group || "Other";
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }, [catalog]);

  if (isLoading) return <div style={{ marginTop: 12 }}>Loading DDM state...</div>;
  if (error) return <div style={{ marginTop: 12 }}>Error loading DDM state</div>;

  const toggleItem = (key) => {
    setSelectedItems((current) => (
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    ));
  };

  const addCustomItem = () => {
    const item = customItem.trim();
    if (!item) return;
    setSelectedItems((current) => current.includes(item) ? current : [...current, item]);
    setCustomItem("");
  };

  const saveSubscriptions = () => {
    saveSubscriptionsMutation.mutate(selectedItems);
  };

  return (
    <Grid>
      <Panel>
        <Small>DDM State</Small>
        <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
          <DeviceInfoItem label="Enabled" value={state.enabled ? "YES" : "NO"} />
          <DeviceInfoItem label="Enrollment ID" value={state.enrollmentId || udid} />
          <DeviceInfoItem label="Last Token Update" value={formatTime(state.lastTokenUpdate)} />
          <DeviceInfoItem label="Last Declarations Request" value={formatTime(state.lastDeclarationItemsRequest)} />
          <DeviceInfoItem label="Last Status Report" value={formatTime(state.lastStatusAt)} />
          <DeviceInfoItem label="Enable Command UUID" value={state.enableCommandUUID || "-"} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <Button disabled={enableMutation.isLoading} onClick={() => enableMutation.mutate()}>
            {enableMutation.isLoading ? "Sending..." : "Enable DDM"}
          </Button>
          <GhostButton disabled={syncMutation.isLoading} onClick={() => syncMutation.mutate()}>
            {syncMutation.isLoading ? "Syncing..." : "Sync Declarations"}
          </GhostButton>
          <GhostButton onClick={() => queryClient.invalidateQueries(["ddmDeviceState", udid])}>
            Refresh
          </GhostButton>
        </div>
      </Panel>

      <Panel>
        <Small>Monitored Items</Small>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.68 }}>
          Save changes, then sync declarations so devices receive the updated subscription list.
        </div>
        {monitoring.length === 0 ? <Empty>No monitored items configured.</Empty> : monitoring.map((item) => (
          <Row key={item.key}>
            <div>
              <strong>{item.label}</strong>
              <div style={{ marginTop: 2, fontSize: 12, opacity: 0.7 }}>{item.key}</div>
            </div>
            <Pill>{item.source}</Pill>
          </Row>
        ))}
      </Panel>

      <Panel style={{ gridColumn: "1 / -1" }}>
        <Small>Status Subscriptions</Small>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.68 }}>
          These keys are written into the DDM status subscription declaration.
        </div>

        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
          {Object.entries(catalogGroups).map(([group, items]) => (
            <div key={group}>
              <Small>{group}</Small>
              <div style={{ marginTop: 6 }}>
                {items.map((item) => (
                  <CheckRow key={item.key}>
                    <Checkbox
                      type="checkbox"
                      checked={selectedItems.includes(item.key)}
                      onChange={() => toggleItem(item.key)}
                    />
                    <div>
                      <strong>{item.label}</strong>
                      <div style={{ marginTop: 2, fontSize: 12, opacity: 0.7 }}>{item.key}</div>
                    </div>
                  </CheckRow>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 10 }}>
          <TextInput
            value={customItem}
            onChange={(event) => setCustomItem(event.target.value)}
            placeholder="Add custom status item key..."
          />
          <GhostButton onClick={addCustomItem}>Add</GhostButton>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button disabled={saveSubscriptionsMutation.isLoading} onClick={saveSubscriptions}>
            {saveSubscriptionsMutation.isLoading ? "Saving..." : "Save Subscriptions"}
          </Button>
          <GhostButton disabled={syncMutation.isLoading} onClick={() => syncMutation.mutate()}>
            {syncMutation.isLoading ? "Syncing..." : "Sync Declarations"}
          </GhostButton>
        </div>
      </Panel>

      <Panel>
        <Small>Recent Status</Small>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.68 }}>
          Auto-refreshing every 5 seconds while this tab is open.
        </div>
        {reports.length === 0 ? (
          <Empty>No DDM status reports from this device yet.</Empty>
        ) : (
          reports.map((report, index) => (
            <div key={`${report.receivedAt}-${index}`} style={{ marginTop: index === 0 ? 8 : 12 }}>
              <DeviceInfoItem label="Received" value={formatTime(report.receivedAt)} />
              <Pre>{JSON.stringify(report.body || {}, null, 2)}</Pre>
            </div>
          ))
        )}
      </Panel>

      <Panel>
        <Small>Active Declarations</Small>
        {declarations.length === 0 ? <Empty>No declarations synced yet.</Empty> : declarations.map((declaration) => (
          <Row key={declaration.identifier}>
            <div>
              <strong>{declaration.identifier}</strong>
              <div style={{ marginTop: 2, fontSize: 12, opacity: 0.7 }}>{declaration.type}</div>
            </div>
            <Pill $tone={declaration.active ? "ok" : "idle"}>{declaration.category}</Pill>
          </Row>
        ))}
      </Panel>
    </Grid>
  );
}

export default DDMTab;
