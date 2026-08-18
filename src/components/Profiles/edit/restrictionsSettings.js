import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import catalog from '../../../data/appleProfileSchemas.json';

const Container = styled.div`display: grid; gap: 16px; max-width: 1180px;`;
const Header = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;
`;
const Title = styled.h2`margin: 0 0 5px; font-size: 24px; color: var(--text);`;
const Help = styled.p`margin: 0; max-width: 720px; color: var(--text-muted); font-size: 13px; line-height: 1.5;`;
const Count = styled.div`
  min-width: 104px; padding: 9px 12px; border: 1px solid var(--border); border-radius: 10px;
  color: var(--text-muted); background: var(--surface); text-align: center; font-size: 11px;
  strong { display: block; color: var(--text); font-size: 18px; }
`;
const Toolbar = styled.div`
  display: grid; grid-template-columns: minmax(240px, 1fr) 170px auto; gap: 8px;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;
const Input = styled.input`
  width: 100%; min-height: 40px; box-sizing: border-box; padding: 9px 10px; font-size: 14px;
  color: var(--text); background: var(--surface); border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm); outline: none;
  &:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
`;
const Select = styled.select`
  width: 100%; min-height: 40px; padding: 9px 10px; font-size: 14px; color: var(--text);
  background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); outline: none;
  &:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
`;
const Tabs = styled.div`
  display: flex; gap: 4px; padding: 4px; border: 1px solid var(--border);
  border-radius: 9px; background: var(--surface-soft);
`;
const Tab = styled.button`
  min-height: 30px; padding: 0 10px; border: 0; border-radius: 6px; cursor: pointer;
  color: ${({ $active }) => ($active ? 'white' : 'var(--text-muted)')};
  background: ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
  font-size: 12px; font-weight: 800;
`;
const Workspace = styled.div`
  display: grid; grid-template-columns: minmax(280px, 0.85fr) minmax(400px, 1.6fr);
  min-height: 560px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: var(--surface);
  @media (max-width: 860px) { grid-template-columns: 1fr; }
`;
const BrowserPane = styled.div`
  min-width: 0; border-right: 1px solid var(--border); background: var(--surface-soft);
  @media (max-width: 860px) { border-right: 0; border-bottom: 1px solid var(--border); }
`;
const PaneHeader = styled.div`
  display: flex; justify-content: space-between; gap: 10px; padding: 11px 12px;
  border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 11px; font-weight: 750;
`;
const OptionList = styled.div`
  max-height: 620px; overflow: auto; padding: 6px;
  @media (max-width: 860px) { max-height: 300px; }
`;
const Option = styled.button`
  display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; width: 100%;
  padding: 9px 10px; margin-bottom: 3px; border: 1px solid ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
  border-radius: 8px; cursor: pointer; text-align: left; color: var(--text);
  background: ${({ $active }) => ($active ? 'var(--accent-soft)' : 'transparent')};
  &:hover { background: var(--surface); }
`;
const OptionName = styled.span`
  min-width: 0; font-size: 12px; font-weight: 750;
  small { display: block; margin-top: 2px; overflow: hidden; color: var(--text-muted); font-size: 10px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
`;
const StatusDot = styled.span`
  display: grid; place-items: center; width: 20px; height: 20px; border-radius: 99px;
  color: ${({ $configured }) => ($configured ? 'white' : 'var(--text-muted)')};
  background: ${({ $configured }) => ($configured ? 'var(--accent)' : 'transparent')};
  border: 1px solid ${({ $configured }) => ($configured ? 'var(--accent)' : 'var(--border-strong)')};
  font-size: 11px; font-weight: 900;
`;
const EditorPane = styled.div`min-width: 0; background: var(--surface);`;
const Editor = styled.div`display: grid; gap: 18px; padding: 22px;`;
const EditorHeader = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start; gap: 14px;
`;
const FieldTitle = styled.div`
  color: var(--text); font-size: 19px; font-weight: 850;
  code { display: block; margin-top: 5px; color: var(--text-muted); font-size: 11px; font-weight: 500; word-break: break-all; }
`;
const FieldHelp = styled.div`max-width: 760px; color: var(--text-muted); font-size: 13px; line-height: 1.55;`;
const Badges = styled.div`display: flex; flex-wrap: wrap; gap: 5px;`;
const Badge = styled.span`
  padding: 4px 8px; border-radius: 99px; color: var(--accent); background: var(--accent-soft);
  font-size: 10px; font-weight: 800;
`;
const ValueCard = styled.div`
  display: grid; gap: 9px; padding: 14px; border: 1px solid var(--border);
  border-radius: 10px; background: var(--surface-soft);
`;
const ValueLabel = styled.div`
  display: flex; justify-content: space-between; gap: 10px; color: var(--text); font-size: 12px; font-weight: 800;
  span { color: var(--text-muted); font-weight: 500; }
`;
const Button = styled.button`
  min-height: 36px; padding: 0 12px; flex: 0 0 auto; border-radius: var(--radius-sm); cursor: pointer; font-weight: 800;
  color: ${({ $primary, $danger }) => ($primary ? 'white' : $danger ? 'var(--bad)' : 'var(--text)')};
  background: ${({ $primary }) => ($primary ? 'var(--accent)' : 'var(--surface)')};
  border: 1px solid ${({ $primary, $danger }) => ($primary ? 'var(--accent)' : $danger ? 'var(--bad)' : 'var(--border-strong)')};
  &:hover { filter: brightness(0.96); }
`;
const BooleanControl = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px;
  border: 1px solid var(--border); border-radius: 9px; background: var(--surface);
`;
const BooleanChoice = styled.button`
  min-height: 38px; border: 0; border-radius: 6px; cursor: pointer; font-weight: 850;
  color: ${({ $active }) => ($active ? 'white' : 'var(--text-muted)')};
  background: ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
`;
const List = styled.div`display: grid; gap: 7px;`;
const ListRow = styled.div`display: grid; grid-template-columns: 1fr auto; gap: 8px;`;
const Empty = styled.div`display: grid; place-items: center; min-height: 260px; padding: 28px; color: var(--text-muted); text-align: center;`;

const restrictionSchema = catalog.payloads.find(
  (payload) => payload.payloadType === 'com.apple.applicationaccess' && payload.source === 'com.apple.applicationaccess.yaml'
);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function initialValue(field) {
  if (Object.prototype.hasOwnProperty.call(field, 'default')) return clone(field.default);
  if (field.rangelist?.length) return clone(field.rangelist[0]);
  if (field.type === 'boolean') return false;
  if (field.type === 'integer' || field.type === 'real') return field.range?.min ?? 0;
  if (field.type === 'array') return [];
  return '';
}

function supportedPlatforms(field) {
  return Object.entries(field.supportedOS || {})
    .filter(([, support]) => support && support.introduced !== 'n/a')
    .map(([platform, support]) => ({
      label: `${platform}${support.introduced ? ` ${support.introduced}` : ''}${support.supervised ? ' · supervised' : ''}`,
      platform,
    }));
}

function supportsPlatform(field, platform) {
  if (platform === 'all') return true;
  const support = field.supportedOS?.[platform];
  return Boolean(support && support.introduced !== 'n/a');
}

function ArrayControl({ field, value, onChange }) {
  const values = Array.isArray(value) ? value : [];
  const itemName = field.subkeys?.[0]?.title || 'Item';
  return <List>
    {values.map((item, index) => <ListRow key={index}>
      <Input
        value={item ?? ''}
        onChange={(event) => onChange(values.map((current, itemIndex) => itemIndex === index ? event.target.value : current))}
        placeholder={itemName}
      />
      <Button $danger onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
    </ListRow>)}
    <div><Button onClick={() => onChange([...values, ''])}>+ Add {itemName}</Button></div>
  </List>;
}

function FieldControl({ field, value, onChange }) {
  if (field.type === 'boolean') {
    return <BooleanControl>
      <BooleanChoice $active={value === true} onClick={() => onChange(true)}>True</BooleanChoice>
      <BooleanChoice $active={value === false} onClick={() => onChange(false)}>False</BooleanChoice>
    </BooleanControl>;
  }
  if (field.rangelist?.length) {
    return <Select value={String(value)} onChange={(event) => {
      const next = event.target.value;
      onChange(field.type === 'integer' ? parseInt(next, 10) : field.type === 'real' ? parseFloat(next) : next);
    }}>
      {field.rangelist.map((option) => <option key={String(option)} value={String(option)}>{String(option)}</option>)}
    </Select>;
  }
  if (field.type === 'integer' || field.type === 'real') {
    return <Input
      type="number"
      min={field.range?.min}
      max={field.range?.max}
      step={field.type === 'real' ? 'any' : '1'}
      value={value}
      onChange={(event) => onChange(field.type === 'integer'
        ? parseInt(event.target.value || String(field.range?.min ?? 0), 10)
        : parseFloat(event.target.value || String(field.range?.min ?? 0)))}
    />;
  }
  if (field.type === 'array') return <ArrayControl field={field} value={value} onChange={onChange} />;
  return <Input value={value ?? ''} onChange={(event) => onChange(event.target.value)} />;
}

const RestrictionsSettings = ({ settings, setSettings }) => {
  const configured = settings?.restrictionsSettings || {};
  const firstConfigured = restrictionSchema?.keys.find((field) => Object.prototype.hasOwnProperty.call(configured, field.key));
  const [selectedKey, setSelectedKey] = useState(firstConfigured?.key || restrictionSchema?.keys[0]?.key || '');
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [view, setView] = useState('all');

  const visibleFields = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (restrictionSchema?.keys || []).filter((field) => {
      const isConfigured = Object.prototype.hasOwnProperty.call(configured, field.key);
      const matchesView = view === 'all' || (view === 'configured' ? isConfigured : !isConfigured);
      const matchesSearch = !term || `${field.title} ${field.key} ${field.content || ''}`.toLowerCase().includes(term);
      return matchesView && matchesSearch && supportsPlatform(field, platform);
    });
  }, [configured, platform, search, view]);

  const selectedField = visibleFields.find((field) => field.key === selectedKey) || visibleFields[0] || null;
  const selectedPresent = selectedField ? Object.prototype.hasOwnProperty.call(configured, selectedField.key) : false;
  const configuredCount = Object.keys(configured).filter((key) => restrictionSchema?.keys.some((field) => field.key === key)).length;

  const setField = (field, value) => {
    setSettings((current) => ({
      ...(current || {}),
      restrictionsSettings: { ...((current && current.restrictionsSettings) || {}), [field]: value },
    }));
  };

  const removeField = (field) => {
    setSettings((current) => {
      const nextRestrictions = { ...((current && current.restrictionsSettings) || {}) };
      delete nextRestrictions[field];
      const next = { ...(current || {}) };
      if (Object.keys(nextRestrictions).length) next.restrictionsSettings = nextRestrictions;
      else delete next.restrictionsSettings;
      return next;
    });
  };

  return <Container>
    <Header>
      <div>
        <Title>Restrictions</Title>
        <Help>Choose an option on the left, then configure it on the right. Only options you add are included in <code>com.apple.applicationaccess</code>.</Help>
      </div>
      <Count><strong>{configuredCount}</strong>configured</Count>
    </Header>
    <Toolbar>
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${restrictionSchema?.keys.length || 0} restriction options…`} />
      <Select value={platform} onChange={(event) => setPlatform(event.target.value)}>
        <option value="all">All platforms</option>
        <option value="iOS">iOS</option>
        <option value="macOS">macOS</option>
        <option value="tvOS">tvOS</option>
        <option value="visionOS">visionOS</option>
        <option value="watchOS">watchOS</option>
      </Select>
      <Tabs>
        <Tab $active={view === 'all'} onClick={() => setView('all')}>All</Tab>
        <Tab $active={view === 'configured'} onClick={() => setView('configured')}>Configured</Tab>
        <Tab $active={view === 'available'} onClick={() => setView('available')}>Available</Tab>
      </Tabs>
    </Toolbar>
    <Workspace>
      <BrowserPane>
        <PaneHeader><span>Restriction options</span><span>{visibleFields.length} shown</span></PaneHeader>
        <OptionList>
          {visibleFields.map((field) => {
            const present = Object.prototype.hasOwnProperty.call(configured, field.key);
            return <Option key={field.key} $active={selectedField?.key === field.key} onClick={() => setSelectedKey(field.key)}>
              <OptionName>{field.title}<small>{field.key}</small></OptionName>
              <StatusDot $configured={present}>{present ? '✓' : '+'}</StatusDot>
            </Option>;
          })}
          {!visibleFields.length ? <Empty>No options match these filters.</Empty> : null}
        </OptionList>
      </BrowserPane>
      <EditorPane>
        {!selectedField ? <Empty>Select a restriction option to edit it.</Empty> : <Editor>
          <EditorHeader>
            <FieldTitle>{selectedField.title}<code>{selectedField.key} · {selectedField.type}</code></FieldTitle>
            {selectedPresent
              ? <Button $danger onClick={() => removeField(selectedField.key)}>Remove</Button>
              : <Button $primary onClick={() => setField(selectedField.key, initialValue(selectedField))}>Add restriction</Button>}
          </EditorHeader>
          {selectedField.content ? <FieldHelp>{String(selectedField.content)}</FieldHelp> : null}
          <Badges>{supportedPlatforms(selectedField).map((item) => <Badge key={item.platform}>{item.label}</Badge>)}</Badges>
          {selectedPresent ? <ValueCard>
            <ValueLabel>Configured value <span>{selectedField.type}</span></ValueLabel>
            <FieldControl field={selectedField} value={configured[selectedField.key]} onChange={(value) => setField(selectedField.key, value)} />
          </ValueCard> : <ValueCard>
            <ValueLabel>Not configured</ValueLabel>
            <FieldHelp>This option currently has no effect on the profile. Add it to use Apple’s default value, then adjust it here.</FieldHelp>
          </ValueCard>}
        </Editor>}
      </EditorPane>
    </Workspace>
  </Container>;
};

export default RestrictionsSettings;
