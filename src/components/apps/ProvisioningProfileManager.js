import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import styled from "styled-components";
import axiosInstance from "../../utils/axios";

const Panel = styled.div`
  display: grid;
  gap: 12px;
  color: var(--text, #172033);
`;

const Notice = styled.div`
  padding: 10px 12px;
  border: 1px solid ${({ $error }) => ($error ? "rgba(220,53,69,.35)" : "var(--border, rgba(0,0,0,.1))")};
  border-radius: 10px;
  background: ${({ $error }) => ($error ? "rgba(220,53,69,.08)" : "var(--surface-muted, rgba(0,0,0,.025))")};
  color: ${({ $error }) => ($error ? "#b4232f" : "inherit")};
  font-size: 13px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid var(--border, rgba(0,0,0,.1));
  border-radius: 9px;
  background: var(--surface-muted, rgba(0,0,0,.025));
`;

const Label = styled.div`
  color: var(--text-muted, rgba(0,0,0,.6));
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
`;

const Value = styled.div`
  margin-top: 3px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Section = styled.section`
  display: grid;
  gap: 9px;
  padding-top: 4px;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 900;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  min-height: 36px;
  border: 1px solid var(--border, rgba(0,0,0,.12));
  border-radius: 9px;
  padding: 0 12px;
  background: ${({ $primary }) => ($primary ? "var(--accent, #0878d1)" : "var(--surface, white)")};
  color: ${({ $primary }) => ($primary ? "white" : "inherit")};
  font-weight: 850;
  cursor: pointer;

  &:disabled {
    opacity: .5;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  max-width: 100%;
  font-size: 13px;
`;

const DeviceList = styled.div`
  display: grid;
  gap: 6px;
  max-height: 230px;
  overflow: auto;
  padding-right: 4px;
`;

const Device = styled.label`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px 9px;
  border: 1px solid var(--border, rgba(0,0,0,.08));
  border-radius: 8px;
  background: var(--surface-muted, rgba(0,0,0,.02));
  font-size: 12px;
`;

const DeviceName = styled.div`
  overflow: hidden;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Status = styled.span`
  color: ${({ $status }) =>
    $status === "Acknowledged" ? "#16803a" : $status === "Error" ? "#b4232f" : "var(--text-muted, #677)"};
  font-size: 11px;
  font-weight: 850;
`;

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(Number(value) * 1000);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function requestError(error) {
  return error?.response?.data?.error || error?.message || "The request failed";
}

function ProvisioningProfileManager({ app, devices = [], onUpdated }) {
  const appId = app?.id;
  const [file, setFile] = useState(null);
  const [selectedUdids, setSelectedUdids] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const {
    data: profileState,
    isLoading,
    refetch,
  } = useQuery(
    ["app-provisioning-profile", appId],
    async () => {
      const { data } = await axiosInstance.get(`/v1/apps/${appId}/provisioning-profile`);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    { enabled: Boolean(appId), retry: false }
  );

  const metadata = profileState?.current?.metadata || app?.mobileprovision || {};
  const provisioned = useMemo(
    () => new Set(Array.isArray(metadata.ProvisionedDevices) ? metadata.ProvisionedDevices : []),
    [metadata.ProvisionedDevices]
  );
  const allowsAll = Boolean(metadata.ProvisionsAllDevices);
  const assigned = useMemo(
    () => new Set(Array.isArray(app?.devices) ? app.devices : []),
    [app?.devices]
  );
  const targetDevices = useMemo(
    () => devices.filter((device) => assigned.has(device.udid) && (allowsAll || provisioned.has(device.udid))),
    [allowsAll, assigned, devices, provisioned]
  );
  const deploymentByUdid = useMemo(() => {
    const result = new Map();
    (profileState?.deployments || []).forEach((deployment) => {
      if (!result.has(deployment.udid)) result.set(deployment.udid, deployment);
    });
    return result;
  }, [profileState?.deployments]);

  useEffect(() => {
    setSelectedUdids((current) => current.filter((udid) => targetDevices.some((device) => device.udid === udid)));
  }, [targetDevices]);

  const upload = async () => {
    if (!file || !appId) return;
    setBusy(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("profile", file);
      const { data } = await axiosInstance.post(`/v1/apps/${appId}/provisioning-profile`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data?.error) {
        const details = data.validation?.errors?.join("; ");
        throw new Error(details ? `${data.error}: ${details}` : data.error);
      }
      setFile(null);
      setMessage({ text: "Profile validated and saved. It has not been sent to devices yet." });
      await refetch();
      if (onUpdated) onUpdated();
    } catch (error) {
      setMessage({ error: true, text: requestError(error) });
    } finally {
      setBusy(false);
    }
  };

  const deploy = async () => {
    if (!appId || selectedUdids.length === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await axiosInstance.post(`/v1/apps/${appId}/provisioning-profile/deploy`, {
        deviceUdids: selectedUdids,
      });
      if (data?.error) throw new Error(data.error);
      const failed = data?.failed?.length || 0;
      setMessage({
        error: failed > 0,
        text: failed > 0
          ? `${data.queuedDeviceUdids?.length || 0} queued; ${failed} failed.`
          : `Queued for ${data.queuedDeviceUdids?.length || 0} device(s).`,
      });
      await refetch();
    } catch (error) {
      setMessage({ error: true, text: requestError(error) });
    } finally {
      setBusy(false);
    }
  };

  const toggle = (udid) => {
    setSelectedUdids((current) =>
      current.includes(udid) ? current.filter((item) => item !== udid) : [...current, udid]
    );
  };

  if (!appId) return null;

  return (
    <Panel>
      <Notice>
        Uploading a renewed <code>.mobileprovision</code> updates app authorisation without uploading or reinstalling the IPA.
      </Notice>

      <Grid>
        <Field>
          <Label>Profile type</Label>
          <Value>{metadata.ProfileType || (allowsAll ? "In-house" : "Ad Hoc")}</Value>
        </Field>
        <Field>
          <Label>Profile UUID</Label>
          <Value title={metadata.UUID}>{metadata.UUID || "—"}</Value>
        </Field>
        <Field>
          <Label>Expires</Label>
          <Value>{formatDate(metadata.ExpirationDate)}</Value>
        </Field>
        <Field>
          <Label>Bundle authorisation</Label>
          <Value title={metadata.BundlePattern}>{metadata.BundlePattern || app.CFBundleIdentifier || "—"}</Value>
        </Field>
        <Field>
          <Label>Eligible devices</Label>
          <Value>{allowsAll ? "All devices" : `${provisioned.size} listed`}</Value>
        </Field>
        <Field>
          <Label>Saved override</Label>
          <Value>{profileState?.current ? formatDate(profileState.current.uploadedAt) : "Embedded profile only"}</Value>
        </Field>
      </Grid>

      <Section>
        <SectionTitle>1. Validate a renewed profile</SectionTitle>
        <Row>
          <FileInput
            type="file"
            accept=".mobileprovision,application/x-apple-aspen-config,application/octet-stream"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          <Button $primary disabled={busy || !file} onClick={upload}>
            {busy ? "Working…" : "Validate and save"}
          </Button>
        </Row>
      </Section>

      <Section>
        <SectionTitle>2. Send to assigned, eligible devices</SectionTitle>
        <Row>
          <Button
            disabled={busy || !profileState?.current || targetDevices.length === 0}
            onClick={() => setSelectedUdids(targetDevices.map((device) => device.udid))}
          >
            Select all eligible ({targetDevices.length})
          </Button>
          <Button disabled={busy || selectedUdids.length === 0} onClick={() => setSelectedUdids([])}>
            Unselect all
          </Button>
          <Button $primary disabled={busy || !profileState?.current || selectedUdids.length === 0} onClick={deploy}>
            Send profile to {selectedUdids.length}
          </Button>
        </Row>

        <DeviceList>
          {targetDevices.length === 0 ? (
            <Notice>
              No assigned devices are present in this profile. For Ad Hoc distribution, regenerate it with the required device UDIDs.
            </Notice>
          ) : targetDevices.map((device) => {
            const deployment = deploymentByUdid.get(device.udid);
            return (
              <Device key={device.udid}>
                <input
                  type="checkbox"
                  checked={selectedUdids.includes(device.udid)}
                  onChange={() => toggle(device.udid)}
                />
                <div>
                  <DeviceName>{device.DeviceName || device.udid}</DeviceName>
                  <div>{device.udid}</div>
                </div>
                <Status $status={deployment?.status}>{deployment?.status || "Not sent"}</Status>
              </Device>
            );
          })}
        </DeviceList>
      </Section>

      {isLoading ? <Notice>Loading provisioning state…</Notice> : null}
      {message ? <Notice $error={message.error}>{message.text}</Notice> : null}
      {profileState?.current?.validation?.warnings?.length ? (
        <Notice>{profileState.current.validation.warnings.join("; ")}</Notice>
      ) : null}
    </Panel>
  );
}

export default ProvisioningProfileManager;
