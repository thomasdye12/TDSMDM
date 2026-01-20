import React, { useEffect, useMemo } from "react";
import { useQuery } from "react-query";
import axiosInstance from "../../utils/axios";
import styled from "styled-components";

const Tr = styled.tr`
  background: ${({ $rowTint }) => $rowTint || "transparent"};
  transition: background 0.15s ease;

  &:hover {
    background: rgba(0, 123, 255, 0.06);
  }
`;

const TableCell = styled.td`
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  vertical-align: middle;
  font-size: 14px;
`;

const IconWrap = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const AppIcon = styled.img`
  width: 44px;
  height: 44px;
  object-fit: cover;
`;

const NameBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PrimaryText = styled.div`
  font-weight: 600;
  line-height: 1.1;
`;

const SubText = styled.div`
  font-size: 12px;
  opacity: 0.7;
  line-height: 1.2;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.05);
  white-space: nowrap;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.button`
  border: 0;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(0, 123, 255, 0.1);
  color: rgba(0, 123, 255, 0.95);

  &:hover {
    background: rgba(0, 123, 255, 0.16);
  }
`;

const MutedChip = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.05);
`;

const BtnRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }
`;

const PrimaryButton = styled(Button)`
  background: rgba(0, 123, 255, 0.92);
  color: white;
  border-color: transparent;

  &:hover {
    background: rgba(0, 123, 255, 1);
  }
`;

function getExpirationTint(expirationTimestamp) {
  if (!expirationTimestamp) return "transparent";
  const exp = new Date(expirationTimestamp * 1000);
  const now = new Date();
  const diffDays = Math.floor((exp - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "rgba(220,53,69,0.18)"; // expired
  if (diffDays < 20) return "rgba(220,53,69,0.12)"; // soon
  if (diffDays < 70) return "rgba(255,193,7,0.12)"; // warning
  return "transparent";
}

function formatTs(ts) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

const AppSingleCell = React.memo(function AppSingleCell({
  app,
  devicesByUdid,          // Map<udid, device>
  onPush,                 // (app) => void
  onMoreInfo,             // (app) => void
  maxDeviceChips = 3,
}) {
  const { data: iconUrl } = useQuery(
    ["app-icon", app.icon],
    async () => {
      const { data } = await axiosInstance.get(`/files/icons/${app.icon}`, {
        responseType: "blob",
      });
      return URL.createObjectURL(data);
    },
    {
      staleTime: 1000 * 60 * 10,
      cacheTime: 1000 * 60 * 30,
    }
  );

  // IMPORTANT: cleanup blob URL to avoid memory leak
  useEffect(() => {
    return () => {
      if (iconUrl) URL.revokeObjectURL(iconUrl);
    };
  }, [iconUrl]);

  const displayName = app.CFBundleDisplayName || app.name || "Unnamed App";
  const bundleId = app.CFBundleIdentifier || "—";
  const version = app.CFBundleShortVersionString || app.version || "—";
  const platform = app.infolist?.DTPlatformName || "—";
  const uploaded = formatTs(app.uploaded);
  const expiration = app.mobileprovision?.ExpirationDate
    ? formatTs(app.mobileprovision.ExpirationDate)
    : "N/A";

  const installedUdids = Array.isArray(app.devices) ? app.devices : [];
  const installedNames = useMemo(() => {
    return installedUdids
      .map((udid) => devicesByUdid?.get(udid)?.DeviceName || udid)
      .filter(Boolean);
  }, [installedUdids, devicesByUdid]);

  const shown = installedNames.slice(0, maxDeviceChips);
  const overflow = installedNames.length - shown.length;

  return (
    <Tr $rowTint={getExpirationTint(app.mobileprovision?.ExpirationDate)}>
      <TableCell>
        <IconWrap>{iconUrl ? <AppIcon src={iconUrl} alt="" /> : null}</IconWrap>
      </TableCell>

      <TableCell>
        <NameBlock>
          <PrimaryText>{displayName}</PrimaryText>
          <SubText>{bundleId}</SubText>
        </NameBlock>
      </TableCell>

      <TableCell>
        <Badge>{version}</Badge>
      </TableCell>

      <TableCell>{platform}</TableCell>

      <TableCell>{uploaded}</TableCell>

      <TableCell>{expiration}</TableCell>

      <TableCell>
        {installedNames.length === 0 ? (
          <MutedChip>Not installed</MutedChip>
        ) : (
          <ChipRow>
            {shown.map((n) => (
              <MutedChip key={n}>{n}</MutedChip>
            ))}
            {overflow > 0 ? <MutedChip>+{overflow}</MutedChip> : null}
          </ChipRow>
        )}
      </TableCell>

      <TableCell>
        <BtnRow>
          <PrimaryButton onClick={() => onPush(app)}>Push</PrimaryButton>
          <Button onClick={() => onMoreInfo(app)}>More</Button>
        </BtnRow>
      </TableCell>
    </Tr>
  );
});

export default AppSingleCell;
