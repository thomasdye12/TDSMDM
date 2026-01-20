import React, { useMemo } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

/* ---------- Styling ---------- */

const Tr = styled.tr`
  transition: background 0.15s ease;

  &:hover {
    background: rgba(0, 123, 255, 0.06);
  }
`;

const Td = styled.td`
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  vertical-align: middle;
  font-size: 14px;
`;

const NameBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Primary = styled.div`
  font-weight: 900;
  line-height: 1.1;
`;

const Sub = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.05);
`;

const Muted = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.05);
  opacity: 0.75;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  cursor: pointer;
  font-weight: 900;
  font-size: 13px;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }
`;

const PrimaryBtn = styled(Button)`
  background: rgba(0, 123, 255, 0.92);
  color: white;
  border-color: transparent;

  &:hover {
    background: rgba(0, 123, 255, 1);
  }
`;

const DangerBtn = styled(Button)`
  background: rgba(220, 53, 69, 0.92);
  color: white;
  border-color: transparent;

  &:hover {
    background: rgba(220, 53, 69, 1);
  }
`;

// make Link look like a button
const EditLink = styled(Link)`
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(40, 167, 69, 0.92);
  color: white;
  cursor: pointer;
  font-weight: 900;
  font-size: 13px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;

  &:hover {
    background: rgba(40, 167, 69, 1);
  }
`;

function ProfileTableRow({
  profile,
  devicesByUdid,
  onPush,
  onRemove,
  onDetails,
  maxChips = 3,
}) {
  const installedUdids = Array.isArray(profile.devices) ? profile.devices : [];

  const installedNames = useMemo(() => {
    return installedUdids
      .map((udid) => devicesByUdid?.get(udid)?.DeviceName || udid)
      .filter(Boolean);
  }, [installedUdids, devicesByUdid]);

  const shown = installedNames.slice(0, maxChips);
  const overflow = installedNames.length - shown.length;

  const canEdit = !!profile.edit; // same flag you used before

  return (
    <Tr>
      <Td>
        <NameBlock>
          <Primary>{profile.PayloadDisplayName || profile.name || "Unnamed profile"}</Primary>
          <Sub>{profile.PayloadUUID || "—"}</Sub>
        </NameBlock>
      </Td>

      <Td>
        {installedNames.length === 0 ? (
          <Muted>Not installed</Muted>
        ) : (
          <ChipRow>
            {shown.map((n) => (
              <Chip key={n}>{n}</Chip>
            ))}
            {overflow > 0 ? <Chip>+{overflow}</Chip> : null}
          </ChipRow>
        )}
      </Td>

      <Td style={{ textAlign: "right" }}>
        <BtnRow>
          <PrimaryBtn onClick={onPush}>Push</PrimaryBtn>
          <DangerBtn onClick={onRemove}>Remove</DangerBtn>

          {canEdit ? (
            <EditLink to={`/profiles/${profile.PayloadUUID}/edit`}>Edit</EditLink>
          ) : null}

          <Button onClick={onDetails}>Details</Button>
          <Button onClick={() => window.open(`/TDSapi/v1/profiles/${profile.PayloadUUID}/download`)}>
            Download
          </Button>
        </BtnRow>
      </Td>
    </Tr>
  );
}

export default ProfileTableRow;
