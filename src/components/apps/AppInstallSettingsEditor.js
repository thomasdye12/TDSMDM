import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  IoAddCircleOutline,
  IoSaveOutline,
  IoTrashOutline,
} from "react-icons/io5";
import axiosInstance from "../../utils/axios";

const DEFAULT_FUNCTIONS = [
  "deviceUdid",
  "deviceName",
  "deviceId",
  "serialNumber",
  "model",
  "modelName",
  "osVersion",
  "userId",
  "userName",
  "userEmail",
  "appId",
  "appName",
  "appBundleIdentifier",
  "appVersion",
  "installTimestamp",
];

const TYPE_OPTIONS = ["string", "boolean", "integer", "real", "function"];

const Wrap = styled.div`
  display: grid;
  gap: 14px;
`;

const Section = styled.section`
  display: grid;
  gap: 10px;
  border: 1px solid var(--border, rgba(0, 0, 0, 0.12));
  border-radius: 8px;
  background: var(--surface, white);
  padding: 12px;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const Heading = styled.div`
  font-weight: 900;
  font-size: 14px;
`;

const Hint = styled.div`
  color: var(--text-muted, rgba(0, 0, 0, 0.62));
  font-size: 12px;
  line-height: 1.35;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 5px;
  min-width: 0;
  color: var(--text, rgba(0, 0, 0, 0.88));
  font-size: 12px;
  font-weight: 800;
`;

const Input = styled.input`
  min-height: 36px;
  min-width: 0;
  border: 1px solid var(--border, rgba(0, 0, 0, 0.12));
  border-radius: 8px;
  padding: 0 10px;
  background: var(--surface, white);
  color: var(--text, rgba(0, 0, 0, 0.88));
  font-size: 13px;
`;

const Select = styled.select`
  min-height: 36px;
  min-width: 0;
  border: 1px solid var(--border, rgba(0, 0, 0, 0.12));
  border-radius: 8px;
  padding: 0 10px;
  background: var(--surface, white);
  color: var(--text, rgba(0, 0, 0, 0.88));
  font-size: 13px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(140px, 1.1fr) minmax(110px, 0.8fr) minmax(160px, 1.4fr) 38px;
  gap: 8px;
  align-items: end;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const ToggleRow = styled.label`
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border, rgba(0, 0, 0, 0.12));
  border-radius: 8px;
  padding: 0 10px;
  background: var(--surface, white);
  font-size: 13px;
  font-weight: 800;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--border, rgba(0, 0, 0, 0.12));
  border-radius: 8px;
  padding: 0 11px;
  background: ${({ $primary }) => ($primary ? "var(--accent, #0d6efd)" : "var(--surface, white)")};
  color: ${({ $primary }) => ($primary ? "white" : "var(--text, rgba(0, 0, 0, 0.88))")};
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const IconButton = styled(Button)`
  width: 38px;
  padding: 0;
`;

const Notice = styled.div`
  color: ${({ $error }) => ($error ? "var(--danger, #dc3545)" : "var(--ok, #198754)")};
  font-size: 12px;
  font-weight: 800;
`;

function defaultSettings() {
  return {
    changeManagementState: "Managed",
    managementFlags: 1,
    iOSApp: true,
    attributes: {
      Removable: { type: "boolean", value: false },
    },
    configuration: [
      { key: "MDM-DevieID", type: "function", function: "deviceUdid" },
    ],
  };
}

function normalizeAttributeRows(attributes) {
  const source = attributes && typeof attributes === "object" ? attributes : defaultSettings().attributes;
  return Object.entries(source).map(([key, entry]) => ({
    key,
    type: entry?.type || "string",
    value: entry?.value ?? "",
  }));
}

function normalizeConfigRows(configuration) {
  const source = Array.isArray(configuration) ? configuration : defaultSettings().configuration;
  return source.map((entry) => ({
    key: entry?.key || "",
    type: entry?.type || (entry?.function ? "function" : "string"),
    value: entry?.value ?? "",
    function: entry?.function || "deviceUdid",
  }));
}

function coerceValue(type, value) {
  if (type === "boolean") return Boolean(value);
  if (type === "integer") return Number.parseInt(value || 0, 10);
  if (type === "real") return Number.parseFloat(value || 0);
  return value ?? "";
}

function valueInput(row, onChange, functions) {
  if (row.type === "function") {
    return (
      <Select value={row.function || functions[0]} onChange={(event) => onChange({ function: event.target.value })}>
        {functions.map((fn) => (
          <option key={fn} value={fn}>{fn}</option>
        ))}
      </Select>
    );
  }

  if (row.type === "boolean") {
    return (
      <ToggleRow>
        <input
          type="checkbox"
          checked={Boolean(row.value)}
          onChange={(event) => onChange({ value: event.target.checked })}
        />
        {Boolean(row.value) ? "true" : "false"}
      </ToggleRow>
    );
  }

  return (
    <Input
      type={row.type === "integer" || row.type === "real" ? "number" : "text"}
      step={row.type === "real" ? "0.01" : "1"}
      value={row.value ?? ""}
      onChange={(event) => onChange({ value: event.target.value })}
    />
  );
}

function AppInstallSettingsEditor({ app, onSaved }) {
  const [functionNames, setFunctionNames] = useState(DEFAULT_FUNCTIONS);
  const [changeManagementState, setChangeManagementState] = useState("Managed");
  const [managementFlags, setManagementFlags] = useState(1);
  const [iOSApp, setIOSApp] = useState(true);
  const [attributeRows, setAttributeRows] = useState(normalizeAttributeRows());
  const [configRows, setConfigRows] = useState(normalizeConfigRows());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    axiosInstance.get("/v1/apps/install-setting-functions")
      .then(({ data }) => {
        if (Array.isArray(data?.functions) && data.functions.length > 0) {
          setFunctionNames(data.functions);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const settings = app?.installSettings || defaultSettings();
    setChangeManagementState(settings.changeManagementState || "Managed");
    setManagementFlags(settings.managementFlags ?? 1);
    setIOSApp(settings.iOSApp ?? true);
    setAttributeRows(normalizeAttributeRows(settings.attributes));
    setConfigRows(normalizeConfigRows(settings.configuration));
    setNotice("");
    setError("");
  }, [app]);

  const settingsPayload = useMemo(() => {
    const attributes = {};
    attributeRows.forEach((row) => {
      const key = row.key.trim();
      if (!key) return;
      attributes[key] = {
        type: row.type,
        value: coerceValue(row.type, row.value),
      };
    });

    const configuration = configRows
      .map((row) => {
        const key = row.key.trim();
        if (!key) return null;
        if (row.type === "function") {
          return { key, type: "function", function: row.function || functionNames[0] };
        }
        return { key, type: row.type, value: coerceValue(row.type, row.value) };
      })
      .filter(Boolean);

    return {
      changeManagementState,
      managementFlags: Number.parseInt(managementFlags || 0, 10),
      iOSApp,
      attributes,
      configuration,
    };
  }, [attributeRows, changeManagementState, configRows, functionNames, iOSApp, managementFlags]);

  const updateAttribute = (index, patch) => {
    setAttributeRows((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  };

  const updateConfig = (index, patch) => {
    setConfigRows((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  };

  const save = async () => {
    if (!app?.id) return;
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const { data } = await axiosInstance.post(`/v1/apps/${app.id}/install-settings`, settingsPayload);
      setNotice("Install settings saved.");
      onSaved?.(data?.installSettings || settingsPayload);
    } catch (saveError) {
      console.error("Error saving app install settings:", saveError);
      setError("Could not save install settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrap>
      <Section>
        <SectionHead>
          <div>
            <Heading>Install Command</Heading>
            <Hint>These values are applied when the app install command is generated.</Hint>
          </div>
          <Button $primary onClick={save} disabled={saving || !app?.id}>
            <IoSaveOutline />
            {saving ? "Saving" : "Save"}
          </Button>
        </SectionHead>

        <Grid>
          <Field>
            Change management state
            <Select value={changeManagementState} onChange={(event) => setChangeManagementState(event.target.value)}>
              <option value="Managed">Managed</option>
              <option value="Unmanaged">Unmanaged</option>
            </Select>
          </Field>

          <Field>
            Management flags
            <Input
              type="number"
              min="0"
              value={managementFlags}
              onChange={(event) => setManagementFlags(event.target.value)}
            />
          </Field>

          <Field>
            iOS app
            <ToggleRow>
              <input type="checkbox" checked={Boolean(iOSApp)} onChange={(event) => setIOSApp(event.target.checked)} />
              {iOSApp ? "true" : "false"}
            </ToggleRow>
          </Field>
        </Grid>
      </Section>

      <Section>
        <SectionHead>
          <div>
            <Heading>Attributes</Heading>
            <Hint>Install attributes such as whether the managed app can be removed.</Hint>
          </div>
          <ButtonRow>
            <Button onClick={() => setAttributeRows((rows) => [...rows, { key: "", type: "string", value: "" }])}>
              <IoAddCircleOutline />
              Add
            </Button>
          </ButtonRow>
        </SectionHead>

        {attributeRows.map((row, index) => (
          <Row key={`${row.key}-${index}`}>
            <Field>
              Key
              <Input value={row.key} onChange={(event) => updateAttribute(index, { key: event.target.value })} />
            </Field>
            <Field>
              Type
              <Select value={row.type} onChange={(event) => updateAttribute(index, { type: event.target.value })}>
                {TYPE_OPTIONS.filter((type) => type !== "function").map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </Field>
            <Field>
              Value
              {valueInput(row, (patch) => updateAttribute(index, patch), functionNames)}
            </Field>
            <IconButton
              title="Remove attribute"
              onClick={() => setAttributeRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}
            >
              <IoTrashOutline />
            </IconButton>
          </Row>
        ))}
      </Section>

      <Section>
        <SectionHead>
          <div>
            <Heading>Managed App Configuration</Heading>
            <Hint>These keys are sent inside the MDM Configuration dictionary and can be read by the installed app.</Hint>
          </div>
          <Button onClick={() => setConfigRows((rows) => [...rows, { key: "", type: "string", value: "", function: functionNames[0] }])}>
            <IoAddCircleOutline />
            Add
          </Button>
        </SectionHead>

        {configRows.map((row, index) => (
          <Row key={`${row.key}-${index}`}>
            <Field>
              Key
              <Input value={row.key} onChange={(event) => updateConfig(index, { key: event.target.value })} />
            </Field>
            <Field>
              Type
              <Select value={row.type} onChange={(event) => updateConfig(index, { type: event.target.value })}>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </Field>
            <Field>
              Value
              {valueInput(row, (patch) => updateConfig(index, patch), functionNames)}
            </Field>
            <IconButton
              title="Remove configuration key"
              onClick={() => setConfigRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}
            >
              <IoTrashOutline />
            </IconButton>
          </Row>
        ))}
      </Section>

      {notice ? <Notice>{notice}</Notice> : null}
      {error ? <Notice $error>{error}</Notice> : null}
    </Wrap>
  );
}

export default AppInstallSettingsEditor;
