import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { userAccessToserviceSub } from "../utils/axios";

/* ---------- Styling ---------- */

const Shell = styled.div`
  position: sticky;
  top: 0;
  z-index: 1500;
  padding: 14px 22px;
  background: linear-gradient(to bottom, rgba(246,247,251,1), rgba(246,247,251,0.85));
  backdrop-filter: blur(8px);
`;

const Bar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 16px;
  background: white;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
`;

const Left = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-right: 8px;
`;

const Title = styled.div`
  font-weight: 900;
  font-size: 14px;
`;

const Sub = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;

const Nav = styled.nav`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const NavPill = styled(Link)`
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 13px;
  border: 1px solid rgba(0,0,0,0.10);
  color: rgba(0,0,0,0.75);
  background: white;

  &:hover {
    background: rgba(0,0,0,0.03);
  }

  &[data-active="true"] {
    background: rgba(0,123,255,0.12);
    border-color: rgba(0,123,255,0.25);
    color: rgba(0,123,255,0.95);
  }
`;

const Right = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const PrimaryBtn = styled.button`
  border: 0;
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(0,123,255,0.92);
  color: white;
  font-weight: 900;
  cursor: pointer;

  &:hover { background: rgba(0,123,255,1); }
`;

const GhostBtn = styled.button`
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 12px;
  padding: 10px 12px;
  background: white;
  font-weight: 900;
  cursor: pointer;

  &:hover { background: rgba(0,0,0,0.03); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 16, 0.55);
  display: ${({ $open }) => ($open ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const Modal = styled.div`
  width: min(820px, 96vw);
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 22px 70px rgba(0,0,0,0.35);
`;

const ModalHeader = styled.div`
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid rgba(0,0,0,0.08);
`;

const ModalTitle = styled.div`
  font-weight: 900;
`;

const CloseBtn = styled.button`
  border: 0;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
  opacity: 0.7;
  &:hover { opacity: 1; }
`;

const ModalBody = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 0;
  padding: 14px 16px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`;

const Panel = styled.div`
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(0,0,0,0.02);
  border-radius: 16px;
  padding: 14px;
`;

const Label = styled.div`
  font-size: 12px;
  opacity: 0.75;
  font-weight: 800;
`;

const Mono = styled.div`
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.92);
  color: rgba(255,255,255,0.92);
  font-size: 12px;
  overflow: auto;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
`;

const Toast = styled.div`
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(2, 6, 23, 0.92);
  color: white;
  padding: 10px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 13px;
  z-index: 3000;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  pointer-events: none;
  transition: opacity 0.2s ease;
`;

/* ---------- Component ---------- */

function Header() {
  const location = useLocation();

  const [access, setAccess] = useState({
    devices: false,
    apps: false,
    profiles: false,
    events: false,
    ddm: false,
  });

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");

  const enrollLink = "https://device.server.thomasdye.net/TDSapi/v1/system/mdm/enroll";

  useEffect(() => {
    const checkAccess = async () => {
      const devicesAccess = await userAccessToserviceSub("net.thomasdye.profilemanager.devices.all");
      const appsAccess = await userAccessToserviceSub("net.thomasdye.profilemanager.apps.all");
      const profilesAccess = await userAccessToserviceSub("net.thomasdye.profilemanager.profiles.all");
      const eventsAccess = await userAccessToserviceSub("net.thomasdye.profilemanager.events.all");
      const ddmAccess = await userAccessToserviceSub("net.thomasdye.profilemanager.ddm.all");

      setAccess({ devices: devicesAccess, apps: appsAccess, profiles: profilesAccess, events: eventsAccess, ddm: ddmAccess });
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

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 1800);
  };

  const handleDownload = () => {
    window.location.href = enrollLink;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(enrollLink);
      showToast("Copied enrollment link");
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = enrollLink;
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
        showToast("Copied enrollment link");
      } catch {
        showToast("Copy failed");
      }
      document.body.removeChild(el);
    }
  };

  return (
    <>
      <Shell>
        <Bar>
          <Left>
            <Brand>
              <Title>Profile Manager</Title>
              <Sub>Quick navigation & enrollment</Sub>
            </Brand>

            <Nav>
              {navItems.map((it) => (
                <NavPill
                  key={it.to}
                  to={it.to}
                  data-active={location.pathname.startsWith(it.to)}
                >
                  {it.label}
                </NavPill>
              ))}
            </Nav>
          </Left>

          <Right>
            <GhostBtn onClick={handleCopy}>Copy Enroll Link</GhostBtn>
            <PrimaryBtn onClick={() => setOpen(true)}>Add device</PrimaryBtn>
          </Right>
        </Bar>
      </Shell>

      <Overlay $open={open}>
        <Modal>
          <ModalHeader>
            <div>
              <ModalTitle>Add a new device</ModalTitle>
              <Sub style={{ marginTop: 2 }}>
                Download the enrollment profile or scan the QR code.
              </Sub>
            </div>
            <CloseBtn onClick={() => setOpen(false)}>&times;</CloseBtn>
          </ModalHeader>

          <ModalBody>
            <Panel>
              <Label>Enrollment URL</Label>
              <Mono>{enrollLink}</Mono>

              <ActionRow>
                <PrimaryBtn onClick={handleDownload}>Download enrollment file</PrimaryBtn>
                <GhostBtn onClick={handleCopy}>Copy link</GhostBtn>
              </ActionRow>

              <Sub style={{ marginTop: 10 }}>
                Tip: Opening this link on iOS should prompt profile download/install.
              </Sub>
            </Panel>

            <Panel style={{ display: "grid", placeItems: "center" }}>
              <Label style={{ marginBottom: 10 }}>Scan to enroll</Label>
              <QRCodeCanvas value={enrollLink} size={176} />
              <Sub style={{ marginTop: 10, textAlign: "center" }}>
                Scan with Camera app
              </Sub>
            </Panel>
          </ModalBody>
        </Modal>
      </Overlay>

      <Toast $show={!!toast}>{toast}</Toast>
    </>
  );
}

export default Header;
