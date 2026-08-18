import React, { useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  IoAppsOutline,
  IoCheckmarkCircleOutline,
  IoListOutline,
  IoPhonePortraitOutline,
  IoRefreshOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
  IoTimeOutline,
  IoWarningOutline,
} from 'react-icons/io5';
import axiosInstance from '../../utils/axios';
import {
  checkInHealth,
  percent,
  platformFor,
  profileConfigurationStats,
  relativeTime,
  valueIsTrue,
} from './dashboardMetrics';

const Page = styled.main`flex: 1; min-width: 0; overflow: auto; padding: 16px; color: var(--text); background: var(--app-bg);`;
const Shell = styled.div`display: grid; gap: 12px; max-width: 1500px; margin: 0 auto;`;
const Header = styled.section`
  display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 16px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface);
`;
const Kicker = styled.div`color: var(--text-muted); font-size: 10px; font-weight: 900; letter-spacing: .09em; text-transform: uppercase;`;
const Title = styled.h1`margin: 3px 0 0; color: var(--text); font-size: 24px; line-height: 1.1;`;
const Sub = styled.div`margin-top: 5px; color: var(--text-muted); font-size: 12px; line-height: 1.45;`;
const Actions = styled.div`display: flex; align-items: center; gap: 7px; flex-wrap: wrap;`;
const Button = styled.button`
  min-height: 38px; display: inline-flex; align-items: center; gap: 7px; padding: 0 11px;
  border: 1px solid var(--border-strong); border-radius: 8px; color: var(--text); background: var(--surface); cursor: pointer; font-weight: 850;
  &:hover { background: var(--surface-soft); }
`;
const Pill = styled.span`
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 999px; font-size: 11px; font-weight: 850;
  color: ${({ $tone }) => $tone === 'bad' ? 'var(--bad)' : $tone === 'warn' ? '#a96b00' : $tone === 'ok' ? 'var(--ok)' : 'var(--text-muted)'};
  background: ${({ $tone }) => $tone === 'bad' ? 'rgba(220,53,69,.11)' : $tone === 'warn' ? 'rgba(255,178,36,.13)' : $tone === 'ok' ? 'rgba(40,167,69,.12)' : 'var(--surface-soft)'};
`;
const Metrics = styled.section`
  display: grid; grid-template-columns: repeat(6, minmax(150px, 1fr)); gap: 9px;
  @media (max-width: 1180px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 620px) { grid-template-columns: repeat(2, 1fr); }
`;
const Metric = styled(Link)`
  display: grid; grid-template-columns: 38px 1fr; gap: 10px; align-items: center; min-width: 0;
  padding: 13px; border: 1px solid var(--border); border-radius: 11px; color: var(--text); background: var(--surface); text-decoration: none;
  &:hover { border-color: var(--accent); background: var(--surface-soft); }
`;
const MetricIcon = styled.div`
  display: grid; place-items: center; width: 38px; height: 38px; border-radius: 10px;
  color: ${({ $tone }) => $tone === 'bad' ? 'var(--bad)' : $tone === 'warn' ? '#b87500' : 'var(--accent)'};
  background: ${({ $tone }) => $tone === 'bad' ? 'rgba(220,53,69,.11)' : $tone === 'warn' ? 'rgba(255,178,36,.13)' : 'var(--accent-soft)'};
  font-size: 19px;
`;
const MetricValue = styled.div`color: var(--text); font-size: 23px; font-weight: 900; line-height: 1;`;
const MetricLabel = styled.div`margin-top: 4px; color: var(--text-muted); font-size: 10px; font-weight: 800;`;
const Grid = styled.section`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; @media (max-width: 900px) { grid-template-columns: 1fr; }`;
const Card = styled.section`min-width: 0; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); overflow: hidden;`;
const CardHeader = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; padding: 13px 14px;
  border-bottom: 1px solid var(--border); background: var(--surface-soft);
`;
const CardTitle = styled.h2`margin: 2px 0 0; color: var(--text); font-size: 15px;`;
const CardBody = styled.div`display: grid; gap: 10px; padding: 13px;`;
const HealthRow = styled.div`display: grid; grid-template-columns: 112px 1fr 34px; gap: 9px; align-items: center; color: var(--text); font-size: 11px;`;
const Track = styled.div`height: 8px; overflow: hidden; border-radius: 999px; background: var(--surface-soft);`;
const Fill = styled.div`
  width: ${({ $value }) => `${Math.max(0, Math.min(100, $value))}%`}; height: 100%; border-radius: inherit;
  background: ${({ $tone }) => $tone === 'bad' ? 'var(--bad)' : $tone === 'warn' ? '#e0a12f' : $tone === 'ok' ? 'var(--ok)' : 'var(--accent)'};
`;
const Coverage = styled.div`display: grid; gap: 6px; padding: 10px; border: 1px solid var(--border); border-radius: 9px; background: var(--surface-soft);`;
const CoverageTop = styled.div`display: flex; justify-content: space-between; gap: 8px; color: var(--text); font-size: 11px; font-weight: 850;`;
const SettingsGrid = styled.div`display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; @media (max-width: 620px) { grid-template-columns: repeat(2, 1fr); }`;
const Setting = styled.div`padding: 10px; border: 1px solid var(--border); border-radius: 9px; background: var(--surface-soft);`;
const SettingValue = styled.div`color: var(--text); font-size: 20px; font-weight: 900;`;
const SettingLabel = styled.div`margin-top: 3px; color: var(--text-muted); font-size: 10px;`;
const Table = styled.div`display: grid;`;
const DeviceRow = styled(Link)`
  display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(110px, .7fr) auto; gap: 10px; align-items: center;
  padding: 10px 13px; border-bottom: 1px solid var(--border); color: var(--text); text-decoration: none;
  &:last-child { border-bottom: 0; }
  &:hover { background: var(--surface-soft); }
  @media (max-width: 620px) { grid-template-columns: 1fr auto; & > :nth-child(2) { display: none; } }
`;
const Name = styled.div`min-width: 0; overflow: hidden; font-size: 12px; font-weight: 850; text-overflow: ellipsis; white-space: nowrap;`;
const Meta = styled.div`margin-top: 2px; overflow: hidden; color: var(--text-muted); font-size: 9px; text-overflow: ellipsis; white-space: nowrap;`;
const Time = styled.div`color: var(--text-muted); font-size: 10px; text-align: right;`;
const Empty = styled.div`padding: 24px; color: var(--text-muted); font-size: 12px; text-align: center;`;
const PlatformRow = styled.div`display: flex; gap: 6px; flex-wrap: wrap;`;
const Warning = styled.div`padding: 10px 12px; border: 1px solid rgba(255,178,36,.35); border-radius: 9px; color: #9b6500; background: rgba(255,178,36,.1); font-size: 12px;`;

const fetchDevices = async () => (await axiosInstance.get('/v1/getDevicesSmall')).data || [];
const fetchApps = async () => (await axiosInstance.get('/v1/apps/get')).data || [];
const fetchProfiles = async () => (await axiosInstance.get('/v1/profiles/get')).data || [];

function MetricCard({ to, icon: Icon, value, label, tone }) {
  return <Metric to={to}><MetricIcon $tone={tone}><Icon /></MetricIcon><div><MetricValue>{value}</MetricValue><MetricLabel>{label}</MetricLabel></div></Metric>;
}

function HealthBar({ label, count, total, tone }) {
  return <HealthRow><span>{label}</span><Track><Fill $tone={tone} $value={percent(count, total)} /></Track><strong>{count}</strong></HealthRow>;
}

function DashboardPage() {
  const queryClient = useQueryClient();
  const devicesQuery = useQuery('devices', fetchDevices, { refetchInterval: 30000 });
  const appsQuery = useQuery('apps', fetchApps, { refetchInterval: 60000 });
  const profilesQuery = useQuery('profiles', fetchProfiles, { refetchInterval: 60000 });
  const now = Date.now();

  const devices = Array.isArray(devicesQuery.data) ? devicesQuery.data.filter((device) => device?.udid) : [];
  const apps = Array.isArray(appsQuery.data) ? appsQuery.data.filter((app) => app?.id || app?._id || app?.CFBundleIdentifier) : [];
  const profiles = Array.isArray(profilesQuery.data) ? profilesQuery.data.filter((profile) => profile?.PayloadUUID) : [];

  const summary = useMemo(() => {
    const enriched = devices.map((device) => ({ ...device, health: checkInHealth(device.lastCheckin, now) }));
    const enrolled = enriched.filter((device) => valueIsTrue(device.enrollment_status));
    const supervised = enrolled.filter((device) => valueIsTrue(device.IsSupervised));
    const health = {
      healthy: enrolled.filter((device) => device.health.key === 'healthy').length,
      attention: enrolled.filter((device) => device.health.key === 'attention').length,
      stale: enrolled.filter((device) => device.health.key === 'stale').length,
      never: enrolled.filter((device) => device.health.key === 'never').length,
    };
    const platforms = enrolled.reduce((counts, device) => {
      const platform = platformFor(device);
      counts[platform] = (counts[platform] || 0) + 1;
      return counts;
    }, {});
    const activeApps = apps.filter((app) => (app.lifecycleState || 'active') === 'active');
    const assignedApps = activeApps.filter((app) => Array.isArray(app.devices) && app.devices.length);
    const assignedProfiles = profiles.filter((profile) => Array.isArray(profile.devices) && profile.devices.length);
    const config = profileConfigurationStats(profiles);
    return {
      enriched,
      enrolled,
      supervised,
      health,
      platforms,
      activeApps,
      assignedApps,
      assignedProfiles,
      config,
      recent: [...enrolled].sort((left, right) => (right.health.date?.getTime() || 0) - (left.health.date?.getTime() || 0)).slice(0, 8),
      needsAttention: enrolled.filter((device) => ['attention', 'stale', 'never'].includes(device.health.key)).sort((left, right) => right.health.age - left.health.age).slice(0, 8),
    };
  }, [apps, devices, now, profiles]);

  const loading = devicesQuery.isLoading && appsQuery.isLoading && profilesQuery.isLoading;
  const partialError = devicesQuery.error || appsQuery.error || profilesQuery.error;
  const attentionCount = summary.health.attention + summary.health.stale + summary.health.never;
  const fleetTone = summary.health.stale + summary.health.never > 0 ? 'bad' : summary.health.attention > 0 ? 'warn' : 'ok';

  if (loading) return <Page><Empty>Loading fleet dashboard…</Empty></Page>;

  return <Page><Shell>
    <Header>
      <div><Kicker>Fleet overview</Kicker><Title>MDM Dashboard</Title><Sub>Enrollment, supervision, check-in health, deployments, and configured settings across the service.</Sub></div>
      <Actions>
        <Pill $tone={fleetTone}>{fleetTone === 'ok' ? <IoCheckmarkCircleOutline /> : <IoWarningOutline />}{attentionCount ? `${attentionCount} devices need attention` : 'Fleet checking in normally'}</Pill>
        <Button onClick={() => { queryClient.invalidateQueries('devices'); queryClient.invalidateQueries('apps'); queryClient.invalidateQueries('profiles'); }}><IoRefreshOutline />Refresh</Button>
      </Actions>
    </Header>

    {partialError ? <Warning>Some dashboard data could not be refreshed. Available sections are showing the most recent cached values.</Warning> : null}

    <Metrics>
      <MetricCard to="/devices" icon={IoPhonePortraitOutline} value={summary.enrolled.length} label={`${devices.length} device records`} />
      <MetricCard to="/devices" icon={IoShieldCheckmarkOutline} value={summary.supervised.length} label={`${percent(summary.supervised.length, summary.enrolled.length)}% supervised`} />
      <MetricCard to="/devices" icon={IoCheckmarkCircleOutline} value={summary.health.healthy} label="Checked in within 24h" />
      <MetricCard to="/devices" icon={IoTimeOutline} value={attentionCount} label="Not checked in recently" tone={attentionCount ? 'warn' : undefined} />
      <MetricCard to="/apps" icon={IoAppsOutline} value={summary.activeApps.length} label={`${summary.assignedApps.length} deployed apps`} />
      <MetricCard to="/profiles" icon={IoListOutline} value={profiles.length} label={`${summary.assignedProfiles.length} installed profiles`} />
    </Metrics>

    <Grid>
      <Card>
        <CardHeader><div><Kicker>Device health</Kicker><CardTitle>Check-in status</CardTitle></div><Pill $tone={fleetTone}>{percent(summary.health.healthy, summary.enrolled.length)}% current</Pill></CardHeader>
        <CardBody>
          <HealthBar label="Within 24 hours" count={summary.health.healthy} total={summary.enrolled.length} tone="ok" />
          <HealthBar label="1–7 days" count={summary.health.attention} total={summary.enrolled.length} tone="warn" />
          <HealthBar label="Over 7 days" count={summary.health.stale} total={summary.enrolled.length} tone="bad" />
          <HealthBar label="Never" count={summary.health.never} total={summary.enrolled.length} tone="bad" />
          <PlatformRow>{Object.entries(summary.platforms).map(([platform, count]) => <Pill key={platform}>{platform} · {count}</Pill>)}</PlatformRow>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><div><Kicker>Deployment coverage</Kicker><CardTitle>Apps and profiles</CardTitle></div></CardHeader>
        <CardBody>
          <Coverage><CoverageTop><span>Active apps assigned to devices</span><span>{summary.assignedApps.length}/{summary.activeApps.length}</span></CoverageTop><Track><Fill $value={percent(summary.assignedApps.length, summary.activeApps.length)} /></Track><Sub>{summary.activeApps.reduce((total, app) => total + (Array.isArray(app.devices) ? app.devices.length : 0), 0)} app installations assigned</Sub></Coverage>
          <Coverage><CoverageTop><span>Profiles assigned to devices</span><span>{summary.assignedProfiles.length}/{profiles.length}</span></CoverageTop><Track><Fill $value={percent(summary.assignedProfiles.length, profiles.length)} /></Track><Sub>{profiles.reduce((total, profile) => total + (Array.isArray(profile.devices) ? profile.devices.length : 0), 0)} profile installations assigned</Sub></Coverage>
          <Coverage><CoverageTop><span>Supervised enrolled devices</span><span>{summary.supervised.length}/{summary.enrolled.length}</span></CoverageTop><Track><Fill $tone="ok" $value={percent(summary.supervised.length, summary.enrolled.length)} /></Track><Sub>{summary.enrolled.length - summary.supervised.length} enrolled devices are not supervised</Sub></Coverage>
        </CardBody>
      </Card>
    </Grid>

    <Card>
      <CardHeader><div><Kicker>Configuration posture</Kicker><CardTitle>Settings currently defined</CardTitle></div><IoSettingsOutline /></CardHeader>
      <CardBody><SettingsGrid>
        <Setting><SettingValue>{summary.config.payloads}</SettingValue><SettingLabel>Configuration payloads</SettingLabel></Setting>
        <Setting><SettingValue>{summary.config.values}</SettingValue><SettingLabel>Configured values</SettingLabel></Setting>
        <Setting><SettingValue>{summary.config.restrictions}</SettingValue><SettingLabel>Restriction settings</SettingLabel></Setting>
        <Setting><SettingValue>{summary.config.wifi}</SettingValue><SettingLabel>Wi-Fi payloads</SettingLabel></Setting>
        <Setting><SettingValue>{summary.config.homeScreens}</SettingValue><SettingLabel>Home Screen layouts</SettingLabel></Setting>
        <Setting><SettingValue>{summary.config.custom}</SettingValue><SettingLabel>Apple/custom payloads</SettingLabel></Setting>
      </SettingsGrid></CardBody>
    </Card>

    <Grid>
      <Card>
        <CardHeader><div><Kicker>Latest activity</Kicker><CardTitle>Recent device check-ins</CardTitle></div><Link to="/devices">View all</Link></CardHeader>
        <Table>{summary.recent.length ? summary.recent.map((device) => <DeviceRow key={device.udid} to={`/devices/${device.udid}`}>
          <div><Name>{device.DeviceName || 'Unnamed device'}</Name><Meta>{device.ModelName || device.Model || 'Unknown model'} · {device.user?.name || device.user?.username || 'No assigned user'}</Meta></div>
          <Pill $tone={device.health.tone}>{device.health.label}</Pill><Time>{relativeTime(device.lastCheckin, now)}</Time>
        </DeviceRow>) : <Empty>No enrolled devices have checked in.</Empty>}</Table>
      </Card>

      <Card>
        <CardHeader><div><Kicker>Needs attention</Kicker><CardTitle>Devices not checking in recently</CardTitle></div><Pill $tone={attentionCount ? 'warn' : 'ok'}>{attentionCount}</Pill></CardHeader>
        <Table>{summary.needsAttention.length ? summary.needsAttention.map((device) => <DeviceRow key={device.udid} to={`/devices/${device.udid}`}>
          <div><Name>{device.DeviceName || 'Unnamed device'}</Name><Meta>{device.ModelName || device.Model || 'Unknown model'} · {device.user?.name || device.user?.username || 'No assigned user'}</Meta></div>
          <Pill $tone={device.health.tone}>{device.health.label}</Pill><Time>{relativeTime(device.lastCheckin, now)}</Time>
        </DeviceRow>) : <Empty>All enrolled devices have checked in within 24 hours.</Empty>}</Table>
      </Card>
    </Grid>
  </Shell></Page>;
}

export default DashboardPage;
