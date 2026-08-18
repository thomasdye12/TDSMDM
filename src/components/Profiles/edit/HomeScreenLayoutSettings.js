import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import styled from 'styled-components';
import axiosInstance from '../../../utils/axios';

const Container = styled.div`display: grid; gap: 14px; max-width: 1240px;`;
const Header = styled.div`display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap;`;
const Title = styled.h2`margin: 0 0 5px; color: var(--text); font-size: 24px;`;
const Help = styled.p`margin: 0; max-width: 780px; color: var(--text-muted); font-size: 13px; line-height: 1.5;`;
const Workspace = styled.div`
  display: grid; grid-template-columns: minmax(300px, .8fr) minmax(480px, 1.6fr); gap: 12px; align-items: start;
  @media (max-width: 940px) { grid-template-columns: 1fr; }
`;
const Card = styled.section`border: 1px solid var(--border); border-radius: 12px; background: var(--surface); overflow: hidden;`;
const CardHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; gap: 10px;
  padding: 12px 14px; border-bottom: 1px solid var(--border); background: var(--surface-soft);
`;
const CardTitle = styled.h3`margin: 0; color: var(--text); font-size: 14px;`;
const CardBody = styled.div`display: grid; gap: 11px; padding: 12px;`;
const Input = styled.input`
  width: 100%; min-height: 39px; box-sizing: border-box; padding: 8px 10px; color: var(--text);
  background: var(--surface); border: 1px solid var(--border-strong); border-radius: 8px; outline: none;
  &:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
`;
const Select = styled.select`
  width: 100%; min-height: 39px; padding: 8px 10px; color: var(--text); background: var(--surface);
  border: 1px solid var(--border-strong); border-radius: 8px; outline: none;
  &:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
`;
const Button = styled.button`
  min-height: 36px; padding: 0 11px; border-radius: 8px; cursor: pointer; font-weight: 800;
  color: ${({ $primary, $danger }) => ($primary ? 'white' : $danger ? 'var(--bad)' : 'var(--text)')};
  background: ${({ $primary }) => ($primary ? 'var(--accent)' : 'var(--surface)')};
  border: 1px solid ${({ $primary, $danger }) => ($primary ? 'var(--accent)' : $danger ? 'var(--bad)' : 'var(--border-strong)')};
  &:hover { filter: brightness(.96); }
  &:disabled { cursor: default; opacity: .5; }
`;
const Tabs = styled.div`display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; border-radius: 9px; background: var(--surface-soft);`;
const Tab = styled.button`
  min-height: 32px; border: 0; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 850;
  color: ${({ $active }) => ($active ? 'white' : 'var(--text-muted)')};
  background: ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
`;
const Label = styled.label`display: grid; gap: 5px; color: var(--text-muted); font-size: 11px; font-weight: 800;`;
const FormRow = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 8px; @media (max-width: 520px) { grid-template-columns: 1fr; }`;
const Palette = styled.div`display: grid; gap: 6px; max-height: 360px; overflow: auto;`;
const AppRow = styled.div`
  display: grid; grid-template-columns: 34px 1fr auto; gap: 8px; align-items: center;
  padding: 8px; border: 1px solid var(--border); border-radius: 9px; background: var(--surface);
`;
const AppIcon = styled.div`
  display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px;
  overflow: hidden; color: white; background: linear-gradient(145deg, var(--accent), #7756d8); font-size: 11px; font-weight: 900;
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const AppName = styled.div`
  min-width: 0; color: var(--text); font-size: 12px; font-weight: 800;
  small { display: block; margin-top: 2px; overflow: hidden; color: var(--text-muted); font-size: 9px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
`;
const TinyButton = styled.button`
  min-width: 28px; min-height: 28px; padding: 0 7px; border: 1px solid var(--border); border-radius: 7px;
  color: ${({ $danger }) => ($danger ? 'var(--bad)' : 'var(--text)')}; background: var(--surface); cursor: pointer; font-weight: 850;
  &:disabled { cursor: default; opacity: .35; }
`;
const Hint = styled.div`color: var(--text-muted); font-size: 11px; line-height: 1.45;`;
const Empty = styled.div`padding: 18px; color: var(--text-muted); text-align: center; font-size: 12px;`;
const LayoutArea = styled.div`display: grid; gap: 12px;`;
const PageCard = styled.div`border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: var(--surface-soft);`;
const PageHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
  padding: 9px 11px; border-bottom: 1px solid var(--border); color: var(--text); font-size: 12px; font-weight: 850;
`;
const FolderNameInput = styled.input`
  width: min(180px, 38vw); min-height: 29px; padding: 4px 7px; color: var(--text); background: var(--surface);
  border: 1px solid var(--border-strong); border-radius: 6px; font: inherit; outline: none;
  &:focus { border-color: var(--accent); }
`;
const Actions = styled.div`display: flex; gap: 5px; align-items: center; flex-wrap: wrap;`;
const IconGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 9px;
  min-height: 92px; padding: 12px;
`;
const Item = styled.div`
  position: relative; display: grid; justify-items: center; align-content: start; gap: 5px; min-width: 0;
  padding: 7px 4px 5px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface);
`;
const ItemIcon = styled.div`
  display: grid; place-items: center; width: 42px; height: 42px; border-radius: ${({ $folder }) => ($folder ? '10px' : '12px')};
  color: white; background: ${({ $folder, $webclip }) => $folder ? 'linear-gradient(145deg,#77839a,#485268)' : $webclip ? 'linear-gradient(145deg,#20a67a,#147b5c)' : 'linear-gradient(145deg,var(--accent),#7756d8)'};
  font-size: ${({ $folder }) => ($folder ? '18px' : '12px')}; font-weight: 900;
`;
const ItemName = styled.div`width: 100%; overflow: hidden; color: var(--text); font-size: 10px; font-weight: 750; text-align: center; text-overflow: ellipsis; white-space: nowrap;`;
const ItemActions = styled.div`display: flex; gap: 3px;`;
const Dock = styled.div`border: 1px solid var(--border); border-radius: 14px; background: color-mix(in srgb, var(--accent-soft) 58%, var(--surface)); overflow: hidden;`;
const EmptyLayout = styled.div`display: grid; place-items: center; gap: 10px; min-height: 360px; padding: 28px; color: var(--text-muted); text-align: center;`;

const fetchDevices = async () => (await axiosInstance.get('/v1/getDevicesSmall')).data || [];
const fetchDevice = async (udid) => (await axiosInstance.get(`/v1/device/${udid}/state`)).data || {};
const fetchUploadedApps = async () => (await axiosInstance.get('/v1/apps/get')).data || [];

function initials(name) {
  return String(name || 'App').split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}

function isIOSDevice(device) {
  const model = `${device?.ModelName || ''} ${device?.Model || ''}`.toLowerCase();
  return !model.includes('mac') && !model.includes('appletv') && !model.includes('apple tv') && !model.includes('vision') && !model.includes('reality');
}

function normalizeLayout(value) {
  return {
    Pages: Array.isArray(value?.Pages) && value.Pages.length ? value.Pages : [[]],
    Dock: Array.isArray(value?.Dock) ? value.Dock : [],
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getAt(root, path) {
  return path.reduce((value, key) => value?.[key], root);
}

function destinationValue(path) {
  return JSON.stringify(path);
}

function collectDestinations(layout) {
  const destinations = [];
  const visit = (items, path, label, depth = 0) => {
    destinations.push({ value: destinationValue(path), label });
    if (depth > 3) return;
    (items || []).forEach((item, itemIndex) => {
      if (item?.Type !== 'Folder') return;
      const folderName = item.DisplayName || 'Folder';
      (item.Pages || [[]]).forEach((page, pageIndex) => {
        visit(page, [...path, itemIndex, 'Pages', pageIndex], `${label} / ${folderName} ${pageIndex + 1}`, depth + 1);
      });
    });
  };
  visit(layout.Dock, ['Dock'], 'Dock');
  layout.Pages.forEach((page, index) => visit(page, ['Pages', index], `Home Screen · Page ${index + 1}`));
  return destinations;
}

function collectBundleIDs(value, output = new Set()) {
  (Array.isArray(value) ? value : []).forEach((item) => {
    if (item?.Type === 'Application' && item.BundleID) output.add(item.BundleID);
    if (item?.Type === 'Folder') (item.Pages || []).forEach((page) => collectBundleIDs(page, output));
  });
  return output;
}

function normalizeDeviceApps(device) {
  return (device?.InstalledApplicationList || []).filter((app) => app?.Identifier).map((app) => ({
    name: app.Name || app.Identifier,
    bundleId: app.Identifier,
    version: app.Version || '',
    source: 'device',
  }));
}

function normalizeUploadedApps(apps) {
  return (apps || []).map((app) => ({
    name: app.CFBundleDisplayName || app.name || app.CFBundleIdentifier,
    bundleId: app.CFBundleIdentifier,
    version: app.infolist?.CFBundleShortVersionString || '',
    iconUrl: app.iconURL || (app.icon ? `/TDSapi/files/icons/${encodeURIComponent(app.icon)}` : ''),
    source: 'uploaded',
  })).filter((app) => app.bundleId);
}

function ItemTile({ item, index, count, onMove, onRemove, appNames }) {
  const folder = item?.Type === 'Folder';
  const webclip = item?.Type === 'WebClip';
  const name = item?.DisplayName || appNames.get(item?.BundleID) || item?.BundleID || item?.URL || 'Untitled';
  const folderCount = folder ? (item.Pages || []).reduce((total, page) => total + page.length, 0) : 0;
  return <Item title={item?.BundleID || item?.URL || name}>
    <ItemIcon $folder={folder} $webclip={webclip}>{folder ? '▦' : webclip ? 'W' : initials(name)}</ItemIcon>
    <ItemName>{name}</ItemName>
    {folder ? <Hint>{folderCount} item{folderCount === 1 ? '' : 's'}</Hint> : null}
    <ItemActions>
      <TinyButton disabled={index === 0} onClick={() => onMove(index, index - 1)} title="Move left">‹</TinyButton>
      <TinyButton disabled={index === count - 1} onClick={() => onMove(index, index + 1)} title="Move right">›</TinyButton>
      <TinyButton $danger onClick={() => onRemove(index)} title="Remove">×</TinyButton>
    </ItemActions>
  </Item>;
}

function Collection({ items, path, onMove, onRemove, appNames }) {
  return <IconGrid>
    {items.map((item, index) => <ItemTile
      key={`${item.Type}-${item.BundleID || item.URL || item.DisplayName || 'item'}-${index}`}
      item={item}
      index={index}
      count={items.length}
      onMove={(from, to) => onMove(path, from, to)}
      onRemove={(itemIndex) => onRemove(path, itemIndex)}
      appNames={appNames}
    />)}
    {!items.length ? <Empty>Empty</Empty> : null}
  </IconGrid>;
}

function FolderSections({ items, path, onMove, onRemove, onRename, onAddPage, onRemovePage, appNames }) {
  return <>
    {items.map((item, itemIndex) => {
      if (item?.Type !== 'Folder') return null;
      const itemPath = [...path, itemIndex];
      const pages = Array.isArray(item.Pages) && item.Pages.length ? item.Pages : [[]];
      return <React.Fragment key={`folder-${itemIndex}`}>
        {pages.map((page, pageIndex) => <PageCard key={pageIndex}>
          <PageHeader>
            <Actions>
              <span>Folder</span>
              <FolderNameInput
                aria-label="Folder name"
                value={item.DisplayName || ''}
                onChange={(event) => onRename(itemPath, event.target.value)}
              />
              <span>· Page {pageIndex + 1}</span>
            </Actions>
            <Actions>
              <TinyButton onClick={() => onAddPage(itemPath)} title="Add folder page">+ page</TinyButton>
              <TinyButton $danger disabled={pages.length === 1} onClick={() => onRemovePage(itemPath, pageIndex)} title="Remove folder page">×</TinyButton>
            </Actions>
          </PageHeader>
          <Collection items={page} path={[...itemPath, 'Pages', pageIndex]} onMove={onMove} onRemove={onRemove} appNames={appNames} />
          <FolderSections
            items={page}
            path={[...itemPath, 'Pages', pageIndex]}
            onMove={onMove}
            onRemove={onRemove}
            onRename={onRename}
            onAddPage={onAddPage}
            onRemovePage={onRemovePage}
            appNames={appNames}
          />
        </PageCard>)}
      </React.Fragment>;
    })}
  </>;
}

function HomeScreenLayoutSettings({ settings, setSettings }) {
  const queryClient = useQueryClient();
  const configuredLayout = settings?.homeScreenLayoutSettings;
  const enabled = Boolean(configuredLayout && Array.isArray(configuredLayout.Pages));
  const layout = normalizeLayout(configuredLayout);
  const manualApps = Array.isArray(settings?.homeScreenAppCatalog) ? settings.homeScreenAppCatalog : [];
  const [source, setSource] = useState('device');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [search, setSearch] = useState('');
  const [destination, setDestination] = useState(destinationValue(['Pages', 0]));
  const [manualName, setManualName] = useState('');
  const [manualBundleID, setManualBundleID] = useState('');
  const [folderName, setFolderName] = useState('');
  const [webClipName, setWebClipName] = useState('');
  const [webClipURL, setWebClipURL] = useState('');
  const [inventoryMessage, setInventoryMessage] = useState('');

  const { data: devices = [], isLoading: devicesLoading } = useQuery('devices', fetchDevices);
  const { data: device = {}, isLoading: deviceLoading } = useQuery(
    ['home-screen-device-apps', selectedDevice],
    () => fetchDevice(selectedDevice),
    { enabled: Boolean(selectedDevice) }
  );
  const { data: uploadedApps = [], isLoading: uploadedLoading } = useQuery('apps', fetchUploadedApps);

  const iosDevices = useMemo(() => devices.filter(isIOSDevice), [devices]);
  const destinations = useMemo(() => collectDestinations(layout), [layout]);
  const usedBundleIDs = useMemo(() => {
    const output = collectBundleIDs(layout.Dock);
    layout.Pages.forEach((page) => collectBundleIDs(page, output));
    return output;
  }, [layout]);

  const sourceApps = useMemo(() => {
    if (source === 'device') return normalizeDeviceApps(device);
    if (source === 'uploaded') return normalizeUploadedApps(uploadedApps);
    return manualApps.map((app) => ({ ...app, source: 'manual' })).filter((app) => app.bundleId);
  }, [device, manualApps, source, uploadedApps]);

  const visibleApps = useMemo(() => {
    const term = search.trim().toLowerCase();
    const unique = new Map();
    sourceApps.forEach((app) => { if (!unique.has(app.bundleId)) unique.set(app.bundleId, app); });
    return [...unique.values()].filter((app) => !term || `${app.name} ${app.bundleId} ${app.version}`.toLowerCase().includes(term));
  }, [search, sourceApps]);

  const appNames = useMemo(() => {
    const names = new Map();
    [...normalizeUploadedApps(uploadedApps), ...normalizeDeviceApps(device), ...manualApps].forEach((app) => {
      if (app.bundleId && app.name) names.set(app.bundleId, app.name);
    });
    return names;
  }, [device, manualApps, uploadedApps]);

  const commitLayout = (nextLayout) => setSettings((current) => ({ ...current, homeScreenLayoutSettings: nextLayout }));
  const mutateLayout = (mutation) => {
    const next = clone(layout);
    mutation(next);
    commitLayout(next);
  };
  const safeDestination = destinations.some((item) => item.value === destination) ? destination : destinations[0]?.value;

  const addItem = (item) => {
    if (!enabled || !safeDestination) return;
    mutateLayout((next) => {
      const collection = getAt(next, JSON.parse(safeDestination));
      if (Array.isArray(collection)) collection.push(item);
    });
  };

  const moveItem = (path, from, to) => mutateLayout((next) => {
    const items = getAt(next, path);
    if (!Array.isArray(items) || to < 0 || to >= items.length) return;
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
  });

  const removeItem = (path, index) => mutateLayout((next) => {
    const items = getAt(next, path);
    if (Array.isArray(items)) items.splice(index, 1);
  });

  const renameFolder = (path, nextName) => mutateLayout((next) => {
    const folder = getAt(next, path);
    if (folder?.Type === 'Folder') folder.DisplayName = nextName;
  });

  const addFolderPage = (path) => mutateLayout((next) => {
    const folder = getAt(next, path);
    if (folder?.Type !== 'Folder') return;
    if (!Array.isArray(folder.Pages)) folder.Pages = [[]];
    folder.Pages.push([]);
  });

  const removeFolderPage = (path, pageIndex) => mutateLayout((next) => {
    const folder = getAt(next, path);
    if (folder?.Type === 'Folder' && Array.isArray(folder.Pages) && folder.Pages.length > 1) folder.Pages.splice(pageIndex, 1);
  });

  const refreshInventory = async () => {
    if (!selectedDevice) return;
    setInventoryMessage('Requesting an updated app inventory…');
    try {
      await axiosInstance.post(`/v1/sendcommand/${selectedDevice}`, { command: 'InstalledApplicationList' });
      window.setTimeout(() => queryClient.invalidateQueries(['home-screen-device-apps', selectedDevice]), 5000);
      window.setTimeout(() => queryClient.invalidateQueries(['home-screen-device-apps', selectedDevice]), 15000);
      setInventoryMessage('Refresh requested. The list will update after the device responds.');
    } catch {
      setInventoryMessage('Could not request an app inventory refresh.');
    }
  };

  const addManualApp = () => {
    const name = manualName.trim();
    const bundleId = manualBundleID.trim();
    if (!name || !bundleId) return;
    const next = [...manualApps.filter((app) => app.bundleId !== bundleId), { name, bundleId }];
    setSettings((current) => ({ ...current, homeScreenAppCatalog: next }));
    setManualName('');
    setManualBundleID('');
  };

  const addApplication = (app) => {
    addItem({ Type: 'Application', BundleID: app.bundleId });
    setSettings((current) => {
      const currentCatalog = Array.isArray(current.homeScreenAppCatalog) ? current.homeScreenAppCatalog : [];
      if (currentCatalog.some((item) => item.bundleId === app.bundleId)) return current;
      return { ...current, homeScreenAppCatalog: [...currentCatalog, { name: app.name, bundleId: app.bundleId }] };
    });
  };

  const removeManualApp = (bundleId) => setSettings((current) => ({
    ...current,
    homeScreenAppCatalog: manualApps.filter((app) => app.bundleId !== bundleId),
  }));

  const addPage = () => mutateLayout((next) => next.Pages.push([]));
  const movePage = (from, to) => mutateLayout((next) => {
    if (to < 0 || to >= next.Pages.length) return;
    const [page] = next.Pages.splice(from, 1);
    next.Pages.splice(to, 0, page);
  });
  const removePage = (index) => mutateLayout((next) => {
    if (next.Pages.length > 1) next.Pages.splice(index, 1);
  });

  return <Container>
    <Header>
      <div>
        <Title>Home Screen Layout</Title>
        <Help>Build the locked iPhone or iPad Home Screen using installed apps from a user’s device, uploaded MDM apps, or your own saved app list. Requires a supervised device.</Help>
      </div>
      {enabled
        ? <Button $danger onClick={() => setSettings((current) => ({ ...current, homeScreenLayoutSettings: null }))}>Remove payload</Button>
        : <Button $primary onClick={() => commitLayout({ Pages: [[]], Dock: [] })}>Create layout</Button>}
    </Header>

    {!enabled ? <Card><EmptyLayout><div><strong>No Home Screen layout configured</strong><Hint>Create a layout to arrange pages, folders, web clips, and the Dock.</Hint></div><Button $primary onClick={() => commitLayout({ Pages: [[]], Dock: [] })}>Create Home Screen Layout</Button></EmptyLayout></Card> : <Workspace>
      <Card>
        <CardHeader><CardTitle>App picker</CardTitle><Hint>{usedBundleIDs.size} apps placed</Hint></CardHeader>
        <CardBody>
          <Tabs>
            <Tab $active={source === 'device'} onClick={() => setSource('device')}>iOS device</Tab>
            <Tab $active={source === 'uploaded'} onClick={() => setSource('uploaded')}>Uploaded</Tab>
            <Tab $active={source === 'manual'} onClick={() => setSource('manual')}>My list</Tab>
          </Tabs>

          {source === 'device' ? <Label>Choose a user’s iOS device
            <Select value={selectedDevice} onChange={(event) => setSelectedDevice(event.target.value)}>
              <option value="">{devicesLoading ? 'Loading devices…' : 'Select a device…'}</option>
              {iosDevices.map((item) => <option key={item.udid} value={item.udid}>
                {item.DeviceName || 'Unnamed device'}{item.user?.name || item.user?.username ? ` — ${item.user.name || item.user.username}` : ''}{item.IsSupervised ? ' · supervised' : ' · not supervised'}
              </option>)}
            </Select>
            <Button disabled={!selectedDevice} onClick={refreshInventory}>Request fresh inventory</Button>
            {inventoryMessage ? <Hint>{inventoryMessage}</Hint> : null}
          </Label> : null}

          {source === 'manual' ? <>
            <FormRow>
              <Label>App name<Input value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="Safari" /></Label>
              <Label>Bundle ID<Input value={manualBundleID} onChange={(event) => setManualBundleID(event.target.value)} placeholder="com.apple.mobilesafari" /></Label>
            </FormRow>
            <Button onClick={addManualApp} disabled={!manualName.trim() || !manualBundleID.trim()}>Save to my list</Button>
          </> : null}

          <Label>Add new items to
            <Select value={safeDestination || ''} onChange={(event) => setDestination(event.target.value)}>
              {destinations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Select>
          </Label>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search apps or bundle IDs…" />

          <Palette>
            {(source === 'device' && deviceLoading) || (source === 'uploaded' && uploadedLoading) ? <Empty>Loading apps…</Empty> : null}
            {source === 'device' && !selectedDevice ? <Empty>Select an iOS device to use its installed apps.</Empty> : null}
            {visibleApps.map((app) => {
              const placed = usedBundleIDs.has(app.bundleId);
              return <AppRow key={app.bundleId}>
                <AppIcon>{app.iconUrl ? <img src={app.iconUrl} alt="" /> : initials(app.name)}</AppIcon>
                <AppName>{app.name}<small>{app.bundleId}{app.version ? ` · ${app.version}` : ''}</small></AppName>
                <Actions>
                  {source === 'manual' ? <TinyButton $danger onClick={() => removeManualApp(app.bundleId)} title="Remove from my list">×</TinyButton> : null}
                  <Button disabled={placed} onClick={() => addApplication(app)}>{placed ? 'Added' : 'Add'}</Button>
                </Actions>
              </AppRow>;
            })}
            {((source !== 'device' || selectedDevice) && !deviceLoading && !uploadedLoading && !visibleApps.length) ? <Empty>No apps match.</Empty> : null}
          </Palette>

          <Card>
            <CardHeader><CardTitle>Add a folder</CardTitle></CardHeader>
            <CardBody>
              <Input value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="Folder name" />
              <Button onClick={() => { addItem({ Type: 'Folder', DisplayName: folderName.trim() || 'Folder', Pages: [[]] }); setFolderName(''); }}>Add folder</Button>
              <Hint>After adding it, select the folder from the destination menu to place apps inside it.</Hint>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Add a web clip</CardTitle></CardHeader>
            <CardBody>
              <FormRow>
                <Input value={webClipName} onChange={(event) => setWebClipName(event.target.value)} placeholder="Display name" />
                <Input value={webClipURL} onChange={(event) => setWebClipURL(event.target.value)} placeholder="https://example.com" />
              </FormRow>
              <Button disabled={!webClipURL.trim()} onClick={() => {
                addItem({ Type: 'WebClip', DisplayName: webClipName.trim() || undefined, URL: webClipURL.trim() });
                setWebClipName(''); setWebClipURL('');
              }}>Add web clip</Button>
              <Hint>The matching Web Clip payload must also exist; this layout only positions it.</Hint>
            </CardBody>
          </Card>
        </CardBody>
      </Card>

      <LayoutArea>
        <Dock>
          <PageHeader><span>Dock · {layout.Dock.length} items</span><Hint>iPhone placement above four items may be undefined.</Hint></PageHeader>
          <Collection items={layout.Dock} path={['Dock']} onMove={moveItem} onRemove={removeItem} appNames={appNames} />
        </Dock>
        <FolderSections items={layout.Dock} path={['Dock']} onMove={moveItem} onRemove={removeItem} onRename={renameFolder} onAddPage={addFolderPage} onRemovePage={removeFolderPage} appNames={appNames} />

        {layout.Pages.map((page, pageIndex) => <PageCard key={pageIndex}>
          <PageHeader>
            <span>Page {pageIndex + 1} · {page.length} items</span>
            <Actions>
              <TinyButton disabled={pageIndex === 0} onClick={() => movePage(pageIndex, pageIndex - 1)} title="Move page left">‹</TinyButton>
              <TinyButton disabled={pageIndex === layout.Pages.length - 1} onClick={() => movePage(pageIndex, pageIndex + 1)} title="Move page right">›</TinyButton>
              <TinyButton $danger disabled={layout.Pages.length === 1} onClick={() => removePage(pageIndex)} title="Remove page">×</TinyButton>
            </Actions>
          </PageHeader>
          <Collection items={page} path={['Pages', pageIndex]} onMove={moveItem} onRemove={removeItem} appNames={appNames} />
          <FolderSections items={page} path={['Pages', pageIndex]} onMove={moveItem} onRemove={removeItem} onRename={renameFolder} onAddPage={addFolderPage} onRemovePage={removeFolderPage} appNames={appNames} />
        </PageCard>)}
        <Button onClick={addPage}>+ Add Home Screen page</Button>
      </LayoutArea>
    </Workspace>}
  </Container>;
}

export default HomeScreenLayoutSettings;
