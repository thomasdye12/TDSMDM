import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  IoAdd,
  IoAppsOutline,
  IoChevronBack,
  IoClipboardOutline,
  IoCloudDoneOutline,
  IoHardwareChipOutline,
  IoListOutline,
  IoPhonePortraitOutline,
} from "react-icons/io5";
import { userAccessToserviceSub } from "../../utils/axios";
import { disableV2Ui } from "../../utils/featureFlags";

const Shell = styled.header`
  flex: 0 0 auto;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  backdrop-filter: blur(14px);
  position: sticky;
  top: 0;
  z-index: 1500;
`;

const Bar = styled.div`
  min-height: 64px;
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(320px, 1.4fr) auto;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

const Brand = styled.div`
  min-width: 0;
`;

const Title = styled.div`
  font-size: 15px;
  font-weight: 850;
  color: var(--text);
`;

const Sub = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-muted);
`;

const Nav = styled.nav`
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  overflow-x: auto;
`;

const NavPill = styled(Link)`
  height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 11px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;

  &:hover {
    color: var(--text);
    background: var(--surface-soft);
  }

  &[data-active="true"] {
    color: var(--accent);
    border-color: var(--border);
    background: var(--accent-soft);
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
`;

const Button = styled.button`
  height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 11px;
  font-weight: 850;
  font-size: 13px;
  color: ${({ $primary }) => ($primary ? "white" : "var(--text)")};
  background: ${({ $primary }) => ($primary ? "var(--accent)" : "var(--surface)")};
  cursor: pointer;

  &:hover {
    background: ${({ $primary }) => ($primary ? "var(--accent-strong)" : "var(--surface-soft)")};
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: ${({ $open }) => ($open ? "grid" : "none")};
  place-items: center;
  padding: 20px;
  background: rgba(3, 7, 18, 0.58);
  z-index: 2200;
`;

const Modal = styled.div`
  width: min(820px, 94vw);
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid var(--border);
`;

const ModalBody = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(220px, 0.85fr);
  gap: 12px;
  padding: 16px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-muted);
  padding: 14px;
`;

const Mono = styled.code`
  display: block;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #020617;
  color: #f8fafc;
  font-size: 12px;
  overflow: auto;
`;

const Toast = styled.div`
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 3000;
  padding: 9px 12px;
  border-radius: 999px;
  background: var(--text);
  color: var(--surface);
  font-size: 13px;
  font-weight: 850;
`;

const navIcon = {
  Devices: IoPhonePortraitOutline,
  Apps: IoAppsOutline,
  Profiles: IoListOutline,
  Events: IoClipboardOutline,
  DDM: IoCloudDoneOutline,
};

function HeaderV2() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [access, setAccess] = useState({
    devices: false,
    apps: false,
    profiles: false,
    events: false,
    ddm: false,
  });

  const enrollLink = "https://device.server.thomasdye.net/TDSapi/v1/system/mdm/enroll";

  useEffect(() => {
    const checkAccess = async () => {
      const [devices, apps, profiles, events, ddm] = await Promise.all([
        userAccessToserviceSub("net.thomasdye.profilemanager.devices.all"),
        userAccessToserviceSub("net.thomasdye.profilemanager.apps.all"),
        userAccessToserviceSub("net.thomasdye.profilemanager.profiles.all"),
        userAccessToserviceSub("net.thomasdye.profilemanager.events.all"),
        userAccessToserviceSub("net.thomasdye.profilemanager.ddm.all"),
      ]);

      setAccess({ devices, apps, profiles, events, ddm });
    };

    checkAccess();
  }, []);

  const navItems = useMemo(() => {
    const items = [];
    if (access.devices) items.push({ to: "/devices", label: "Devices" });
    if (access.apps) items.push({ to: "/apps", label: "Apps" });
    if (access.profiles) items.push({ to: "/profiles", label: "Profiles" });
    if (access.events) items.push({ to: "/events", label: "Events" });
    if (access.ddm) items.push({ to: "/ddm", label: "DDM" });
    return items;
  }, [access]);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 1800);
  };

  const copyEnrollmentLink = async () => {
    try {
      await navigator.clipboard.writeText(enrollLink);
      showToast("Enrollment link copied");
    } catch {
      showToast("Copy failed");
    }
  };

  const leaveV2 = () => {
    disableV2Ui();
    window.location.href = `${window.location.pathname}?ui=classic`;
  };

  return (
    <>
      <Shell>
        <Bar>
          <Brand>
            <Title>Profile Manager</Title>
            <Sub>V2 operations workspace</Sub>
          </Brand>

          <Nav aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = navIcon[item.label] || IoHardwareChipOutline;
              return (
                <NavPill
                  key={item.to}
                  to={item.to}
                  data-active={location.pathname.startsWith(item.to)}
                >
                  <Icon />
                  {item.label}
                </NavPill>
              );
            })}
          </Nav>

          <Actions>
            <Button title="Return to classic UI" onClick={leaveV2}>
              <IoChevronBack />
              Classic
            </Button>
            <Button title="Copy enrollment link" onClick={copyEnrollmentLink}>
              <IoClipboardOutline />
              Copy
            </Button>
            <Button $primary title="Add device" onClick={() => setOpen(true)}>
              <IoAdd />
              Add
            </Button>
          </Actions>
        </Bar>
      </Shell>

      <Overlay $open={open}>
        <Modal>
          <ModalHeader>
            <div>
              <Title>Add Device</Title>
              <Sub>Download the enrollment profile or scan the QR code.</Sub>
            </div>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </ModalHeader>
          <ModalBody>
            <Panel>
              <Title>Enrollment URL</Title>
              <Mono>{enrollLink}</Mono>
              <Actions style={{ justifyContent: "flex-start", marginTop: 12 }}>
                <Button $primary onClick={() => { window.location.href = enrollLink; }}>
                  <IoAdd />
                  Download
                </Button>
                <Button onClick={copyEnrollmentLink}>
                  <IoClipboardOutline />
                  Copy link
                </Button>
              </Actions>
            </Panel>
            <Panel style={{ display: "grid", placeItems: "center", gap: 10 }}>
              <QRCodeCanvas value={enrollLink} size={184} />
              <Sub>Scan with Camera app</Sub>
            </Panel>
          </ModalBody>
        </Modal>
      </Overlay>

      <Toast $show={!!toast}>{toast}</Toast>
    </>
  );
}

export default HeaderV2;
