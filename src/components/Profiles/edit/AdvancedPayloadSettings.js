import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import catalog from "../../../data/appleProfileSchemas.json";

const Panel = styled.div`
  display: grid;
  gap: 16px;
  max-width: 1180px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  margin: 0 0 5px;
  color: var(--text);
  font-size: 22px;
`;

const Help = styled.p`
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.55;
`;

const Tabs = styled.div`
  display: flex;
  gap: 5px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-soft);
`;

const Tab = styled.button`
  min-height: 34px;
  border: 0;
  border-radius: 7px;
  padding: 0 12px;
  color: ${({ $active }) => ($active ? "white" : "var(--text)")};
  background: ${({ $active }) => ($active ? "var(--accent)" : "transparent")};
  font-weight: 800;
  cursor: pointer;
`;

const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(250px, 0.8fr) minmax(420px, 1.7fr);
  gap: 14px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 13px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-soft);
`;

const CardTitle = styled.h3`
  margin: 0;
  color: var(--text);
  font-size: 14px;
`;

const Controls = styled.div`
  display: grid;
  grid-template-columns: minmax(160px, 1fr) repeat(2, auto);
  gap: 8px;
  margin-top: 10px;

  @media (max-width: 720px) { grid-template-columns: 1fr; }
`;

const Input = styled.input`
  width: 100%;
  min-height: 38px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 10px;
  color: var(--text);
  background: var(--surface);
  box-sizing: border-box;

  &:focus { border-color: var(--accent); outline: none; }
`;

const Select = styled.select`
  width: 100%;
  min-height: 38px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 10px;
  color: var(--text);
  background: var(--surface);
`;

const Scroll = styled.div`
  max-height: 650px;
  overflow: auto;
  padding: 8px;
`;

const PayloadButton = styled.button`
  display: block;
  width: 100%;
  border: 1px solid ${({ $active }) => ($active ? "var(--accent)" : "transparent")};
  border-radius: 9px;
  padding: 10px;
  margin-bottom: 5px;
  text-align: left;
  color: ${({ disabled }) => (disabled ? "var(--text-muted)" : "var(--text)")};
  background: ${({ $active }) => ($active ? "var(--accent-soft)" : "transparent")};
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.62 : 1)};

  &:hover { background: var(--surface-soft); }
  strong { display: block; font-size: 13px; }
  span { display: block; margin-top: 3px; color: var(--text-muted); font-size: 11px; word-break: break-all; }
`;

const Empty = styled.div`
  padding: 28px 18px;
  color: var(--text-muted);
  text-align: center;
  font-size: 13px;
`;

const Editor = styled.div`
  display: grid;
  gap: 14px;
  padding: 14px;
`;

const EditorHeading = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;

  h3 { margin: 0 0 4px; color: var(--text); font-size: 18px; }
  code { color: var(--text-muted); font-size: 11px; word-break: break-all; }
`;

const Platforms = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const Badge = styled.span`
  border-radius: 99px;
  padding: 4px 8px;
  color: var(--accent);
  background: var(--accent-soft);
  font-size: 10px;
  font-weight: 800;
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
`;

const FieldHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;

  label { color: var(--text); font-size: 13px; font-weight: 800; }
  small { color: var(--text-muted); font-size: 10px; }
`;

const FieldHelp = styled.div`
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.45;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: ${({ $raw }) => ($raw ? "520px" : "110px")};
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px;
  box-sizing: border-box;
  color: ${({ $raw }) => ($raw ? "#f5f5f5" : "var(--text)")};
  background: ${({ $raw }) => ($raw ? "#101010" : "var(--surface)")};
  font: ${({ $raw }) => ($raw ? "12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit")};

  &:focus { border-color: var(--accent); outline: none; }
`;

const Button = styled.button`
  min-height: 36px;
  border: 1px solid ${({ $danger }) => ($danger ? "var(--bad)" : "var(--border)")};
  border-radius: 8px;
  padding: 0 11px;
  color: ${({ $primary, $danger }) => ($primary ? "white" : $danger ? "var(--bad)" : "var(--text)")};
  background: ${({ $primary }) => ($primary ? "var(--accent)" : "var(--surface)")};
  font-weight: 800;
  cursor: pointer;
`;

const Message = styled.div`
  color: ${({ $error }) => ($error ? "var(--bad)" : "var(--ok)")};
  font-size: 13px;
  font-weight: 750;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const CatalogSummary = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 8px 10px 0;
  color: var(--text-muted);
  font-size: 11px;
`;

const clone = (value) => JSON.parse(JSON.stringify(value));

function initialValue(field) {
  if (Object.prototype.hasOwnProperty.call(field, "default")) return clone(field.default);
  if (field.rangelist && field.rangelist.length) return clone(field.rangelist[0]);
  if (field.type === "boolean") return false;
  if (field.type === "integer" || field.type === "real") return 0;
  if (field.type === "array") return [];
  if (field.type === "dictionary") {
    const dictionary = {};
    (field.subkeys || []).filter((subkey) => subkey.presence === "required").forEach((subkey) => {
      dictionary[subkey.key] = initialValue(subkey);
    });
    return { __tdsPlistType: "dictionary", value: dictionary };
  }
  if (field.type === "any") return {};
  if (field.type === "date") return { __tdsPlistType: "date", value: new Date().toISOString() };
  if (field.type === "data") return { __tdsPlistType: "data", value: "" };
  return "";
}

function platformsFor(schema) {
  return Object.entries(schema.supportedOS || {})
    .filter(([, support]) => support && support.introduced !== "n/a")
    .map(([name, support]) => `${name} ${support.introduced || ""}`.trim());
}

function categoryFor(schema) {
  const value = `${schema.title} ${schema.payloadType}`.toLowerCase();
  if (value.includes("certificate") || value.includes("scep") || value.includes("acme")) return "Certificates";
  if (["account", "mail", "caldav", "carddav", "ldap", "exchange", "oauth"].some((term) => value.includes(term))) return "Accounts";
  if (["wifi", "vpn", "dns", "proxy", "ethernet", "cellular", "network", "relay"].some((term) => value.includes(term))) return "Network";
  if (["restriction", "passcode", "lock", "security", "filter", "removal"].some((term) => value.includes(term))) return "Security";
  if (["app", "home screen", "notification", "web clip", "font", "airplay", "airprint", "tv remote"].some((term) => value.includes(term))) return "Apps & experience";
  return "System";
}

function mergeSchemas(items) {
  const byType = new Map();
  items.forEach((schema) => {
    const existing = byType.get(schema.payloadType);
    if (!existing) {
      byType.set(schema.payloadType, { ...schema, variantTitles: [schema.title] });
      return;
    }
    const keys = new Map(existing.keys.map((key) => [key.key, key]));
    schema.keys.forEach((key) => { if (!keys.has(key.key)) keys.set(key.key, key); });
    const preferredTitle = schema.payloadType === "com.apple.MCX"
      ? "Managed Preferences (MCX)"
      : (existing.title.length <= schema.title.length ? existing.title : schema.title);
    byType.set(schema.payloadType, {
      ...existing,
      title: preferredTitle,
      keys: [...keys.values()],
      variantTitles: [...new Set([...existing.variantTitles, schema.title])],
    });
  });
  return [...byType.values()].map((schema) => ({ ...schema, category: categoryFor(schema) }));
}

const mergedCatalog = mergeSchemas(catalog.payloads);

function platformSupport(schema, platform) {
  if (platform === "all") return null;
  return schema.supportedOS?.[platform] || null;
}

function isRetired(schema, platform) {
  if (platform === "all") return false;
  const support = platformSupport(schema, platform);
  if (!support?.removed) return false;
  const current = catalog.osVersions?.[platform];
  return current ? String(support.removed).localeCompare(String(current), undefined, { numeric: true }) <= 0 : true;
}

function complexHint(field) {
  const keys = (field.subkeys || []).slice(0, 12).map((item) => item.key);
  return keys.length ? `Known keys: ${keys.join(", ")}${field.subkeys.length > keys.length ? "…" : ""}` : "Enter valid JSON.";
}

function JsonControl({ value, onChange }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState("");

  useEffect(() => setText(JSON.stringify(value, null, 2)), [value]);

  const apply = () => {
    try {
      onChange(JSON.parse(text));
      setError("");
    } catch (parseError) {
      setError(parseError.message);
    }
  };

  return <>
    <Textarea value={text} onChange={(event) => setText(event.target.value)} onBlur={apply} spellCheck={false} />
    {error ? <Message $error>{error}</Message> : null}
  </>;
}

function FieldControl({ field, value, onChange }) {
  if (field.type === "boolean") {
    return <Select value={String(value)} onChange={(event) => onChange(event.target.value === "true")}><option value="true">True</option><option value="false">False</option></Select>;
  }
  if (field.rangelist && field.rangelist.length) {
    return <Select value={String(value)} onChange={(event) => {
      const selectedValue = event.target.value;
      onChange(field.type === "integer" ? parseInt(selectedValue, 10) : field.type === "real" ? parseFloat(selectedValue) : selectedValue);
    }}>{field.rangelist.map((option) => <option key={String(option)} value={String(option)}>{String(option)}</option>)}</Select>;
  }
  if (field.type === "integer" || field.type === "real") {
    return <Input type="number" step={field.type === "real" ? "any" : "1"} value={value} onChange={(event) => onChange(field.type === "integer" ? parseInt(event.target.value || "0", 10) : parseFloat(event.target.value || "0"))} />;
  }
  if (field.type === "array" || field.type === "dictionary" || field.type === "any") {
    const structuredValue = field.type === "dictionary" && value?.__tdsPlistType === "dictionary" ? value.value : value;
    return <JsonControl value={structuredValue} onChange={(nextValue) => onChange(field.type === "dictionary" ? { __tdsPlistType: "dictionary", value: nextValue } : nextValue)} />;
  }
  if (field.type === "data") {
    return <Textarea value={value?.value || ""} onChange={(event) => onChange({ __tdsPlistType: "data", value: event.target.value.replace(/\s+/g, "") })} placeholder="Base64-encoded data" spellCheck={false} />;
  }
  if (field.type === "date") {
    return <Input type="datetime-local" value={(value?.value || "").replace("Z", "").slice(0, 16)} onChange={(event) => onChange({ __tdsPlistType: "date", value: event.target.value ? new Date(event.target.value).toISOString() : "" })} />;
  }
  return <Input value={value ?? ""} onChange={(event) => onChange(event.target.value)} />;
}

function AdvancedPayloadSettings({ settings, setSettings }) {
  const payloads = settings.customPayloads || [];
  const [mode, setMode] = useState("builder");
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [includeRetired, setIncludeRetired] = useState(false);
  const [selected, setSelected] = useState(payloads.length ? 0 : -1);
  const [fieldSearch, setFieldSearch] = useState("");
  const [rawText, setRawText] = useState("[]");
  const [message, setMessage] = useState(null);

  useEffect(() => setRawText(JSON.stringify(settings.customPayloads || [], null, 2)), [settings.customPayloads]);
  useEffect(() => {
    if (selected >= payloads.length) setSelected(payloads.length - 1);
  }, [payloads.length, selected]);

  const available = useMemo(() => mergedCatalog.map((schema) => {
    const term = search.trim().toLowerCase();
    const title = schema.title.toLowerCase();
    const type = schema.payloadType.toLowerCase();
    const variants = (schema.variantTitles || []).join(" ").toLowerCase();
    const matchesText = !term || title.includes(term) || type.includes(term) || variants.includes(term);
    const support = platformSupport(schema, platform);
    const matchesPlatform = platform === "all" || (support && support.introduced !== "n/a");
    const matchesCategory = category === "all" || schema.category === category;
    const configuredCount = payloads.filter((payload) => payload.PayloadType === schema.payloadType).length;
    const multiple = platform === "all"
      ? Object.values(schema.supportedOS || {}).some((item) => item?.multiple)
      : support?.multiple !== false;
    let score = 10;
    if (term && title === term) score = 0;
    else if (term && title.startsWith(term)) score = 1;
    else if (term && title.includes(term)) score = 2;
    else if (term && type.includes(term)) score = 3;
    return { ...schema, configuredCount, canAdd: multiple || configuredCount === 0, score, retired: isRetired(schema, platform), matchesText, matchesPlatform, matchesCategory };
  }).filter((schema) => schema.matchesText && schema.matchesPlatform && schema.matchesCategory && (includeRetired || !schema.retired)).sort((left, right) => left.score - right.score || left.title.localeCompare(right.title)), [search, platform, category, includeRetired, payloads]);

  const current = selected >= 0 ? payloads[selected] : null;
  const schema = current ? mergedCatalog.find((item) => item.payloadType === current.PayloadType) : null;

  const commit = (next) => setSettings((currentSettings) => ({ ...currentSettings, customPayloads: next }));
  const updateCurrent = (nextPayload) => commit(payloads.map((payload, index) => index === selected ? nextPayload : payload));

  const addPayload = (nextSchema) => {
    const payload = { PayloadType: nextSchema.payloadType };
    nextSchema.keys.filter((field) => field.presence === "required").forEach((field) => { payload[field.key] = initialValue(field); });
    commit([...payloads, payload]);
    setSelected(payloads.length);
    setFieldSearch("");
  };

  const applyRaw = () => {
    try {
      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) throw new Error("The root value must be an array.");
      parsed.forEach((payload, index) => {
        if (!payload || typeof payload !== "object" || !payload.PayloadType) throw new Error(`Payload ${index + 1} needs a PayloadType.`);
      });
      commit(parsed);
      setMessage({ text: `${parsed.length} payload(s) validated and applied.` });
    } catch (error) {
      setMessage({ error: true, text: error.message });
    }
  };

  if (mode === "raw") {
    return <Panel>
      <Header><div><Title>Apple payloads</Title><Help>Raw plist-compatible JSON for advanced or newly released Apple keys.</Help></div><Tabs><Tab onClick={() => setMode("builder")}>Builder</Tab><Tab $active>Raw JSON</Tab></Tabs></Header>
      <Textarea $raw value={rawText} onChange={(event) => setRawText(event.target.value)} spellCheck={false} />
      <Row><Button $primary onClick={applyRaw}>Validate and apply</Button>{message ? <Message $error={message.error}>{message.text}</Message> : null}</Row>
    </Panel>;
  }

  const visibleFields = schema ? schema.keys.filter((field) => {
    const term = fieldSearch.trim().toLowerCase();
    return !term || `${field.title} ${field.key} ${field.content || ""}`.toLowerCase().includes(term);
  }) : [];

  return <Panel>
    <Header>
      <div><Title>Apple payloads</Title><Help>{mergedCatalog.length} unique payload types from Apple’s device-management {catalog.branch} schemas. Apple variants sharing one payload type are combined into a single result.</Help></div>
      <Tabs><Tab $active>Builder</Tab><Tab onClick={() => setMode("raw")}>Raw JSON</Tab></Tabs>
    </Header>
    <Workspace>
      <Card>
        <CardHeader><CardTitle>Configured payloads ({payloads.length})</CardTitle></CardHeader>
        {payloads.length ? <Scroll>{payloads.map((payload, index) => {
          const item = mergedCatalog.find((candidate) => candidate.payloadType === payload.PayloadType);
          return <PayloadButton key={`${payload.PayloadType}-${index}`} $active={selected === index} onClick={() => { setSelected(index); setFieldSearch(""); }}><strong>{item?.title || payload.PayloadType}</strong><span>{payload.PayloadType}</span></PayloadButton>;
        })}</Scroll> : <Empty>No payloads added yet.</Empty>}
        <CardHeader><CardTitle>Add an Apple payload</CardTitle><Controls><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or payload type…" /><Select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="all">All platforms</option><option value="iOS">iOS</option><option value="macOS">macOS</option><option value="tvOS">tvOS</option><option value="visionOS">visionOS</option><option value="watchOS">watchOS</option></Select><Select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option><option>Accounts</option><option>Apps &amp; experience</option><option>Certificates</option><option>Network</option><option>Security</option><option>System</option></Select></Controls></CardHeader>
        <CatalogSummary><span>{available.length} matching unique payloads</span><label><input type="checkbox" checked={includeRetired} onChange={(event) => setIncludeRetired(event.target.checked)} /> Include removed payloads</label></CatalogSummary>
        <Scroll>{available.length ? available.map((item) => <PayloadButton key={item.payloadType} disabled={!item.canAdd} onClick={() => item.canAdd && addPayload(item)}><strong>{item.canAdd ? "+ " : "✓ "}{item.title}</strong><span>{item.category} · {item.payloadType}{item.configuredCount ? ` · ${item.configuredCount} configured${item.canAdd ? "" : " (single instance)"}` : ""}{item.variantTitles?.length > 1 ? ` · ${item.variantTitles.length} Apple variants combined` : ""}</span></PayloadButton>) : <Empty>No payloads match these filters.</Empty>}</Scroll>
      </Card>
      <Card>
        {!current ? <Empty>Select or add a payload to configure it.</Empty> : !schema ? <Editor><EditorHeading><div><h3>Custom payload</h3><code>{current.PayloadType}</code></div><Button $danger onClick={() => commit(payloads.filter((_, index) => index !== selected))}>Remove</Button></EditorHeading><Help>This payload is not in the current Apple catalog. Use Raw JSON to edit it.</Help></Editor> : <Editor>
          <EditorHeading><div><h3>{schema.title}</h3><code>{schema.payloadType}</code></div><Button $danger onClick={() => commit(payloads.filter((_, index) => index !== selected))}>Remove</Button></EditorHeading>
          {schema.description ? <Help>{schema.description}</Help> : null}
          <Platforms>{platformsFor(schema).map((item) => <Badge key={item}>{item}</Badge>)}</Platforms>
          <Input value={fieldSearch} onChange={(event) => setFieldSearch(event.target.value)} placeholder={`Search ${schema.keys.length} available settings…`} />
          {visibleFields.map((field) => {
            const present = Object.prototype.hasOwnProperty.call(current, field.key);
            return <Field key={field.key}>
              <FieldHeader><div><label>{field.title}</label><small> · {field.key} · {field.type}{field.presence === "required" ? " · required" : ""}</small></div>{present && field.presence !== "required" ? <Button onClick={() => { const next = { ...current }; delete next[field.key]; updateCurrent(next); }}>Remove</Button> : !present ? <Button onClick={() => updateCurrent({ ...current, [field.key]: initialValue(field) })}>Add</Button> : null}</FieldHeader>
              {field.content ? <FieldHelp>{String(field.content)}</FieldHelp> : null}
              {(field.type === "array" || field.type === "dictionary" || field.type === "any") ? <FieldHelp>{complexHint(field)}</FieldHelp> : null}
              {present ? <FieldControl field={field} value={current[field.key]} onChange={(value) => updateCurrent({ ...current, [field.key]: value })} /> : null}
            </Field>;
          })}
        </Editor>}
      </Card>
    </Workspace>
  </Panel>;
}

export default AdvancedPayloadSettings;
