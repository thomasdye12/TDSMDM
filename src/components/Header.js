import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useMutation } from 'react-query';
import axiosInstance, { userAccessToserviceSub } from '../utils/axios';
import { QRCodeCanvas } from 'qrcode.react';  // Import QRCodeCanvas


// Styled Components
const HeaderContainer = styled.div`
  background-color: #f5f5f5;
  padding: 10px 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  top: 0;
  left: 0;
  right: 0;
  position: fixed;
  z-index: 1000;
`;

const HeaderList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
`;

const HeaderItem = styled.li`
  padding: 10px 15px;
  margin-right: 10px;
  background-color: #ffffff;
  border-radius: 8px;
  transition: background-color 0.3s, transform 0.3s;

  &:hover {
    background-color: #e0e0e0;
    transform: translateY(-2px);
  }

  a {
    text-decoration: none;
    color: #333;
    font-size: 16px;
    font-weight: 500;
    display: block;
  }
`;

const AddDeviceButton = styled.button`
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s, transform 0.3s;

  &:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
  z-index: 1000;
`;

const ModalContent = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  z-index: 1001;
  width: 300px;
  max-width: 100%;
`;

const ModalButton = styled.button`
  width: 100%;
  padding: 10px 20px;
  font-size: 16px;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
`;
const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
`;

function Header() {
  const [access, setAccess] = useState({
    devices: false,
    apps: false,
    profiles: false,
    events: false,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const enrollLink = "https://device.server.thomasdye.net/TDSapi/v1/system/mdm/enroll";

  useEffect(() => {
    const checkAccess = async () => {
      const devicesAccess = await userAccessToserviceSub('net.thomasdye.profilemanager.devices.all');
      const appsAccess = await userAccessToserviceSub('net.thomasdye.profilemanager.apps.all');
      const profilesAccess = await userAccessToserviceSub('net.thomasdye.profilemanager.profiles.all');
      const eventsAccess = await userAccessToserviceSub('net.thomasdye.profilemanager.events.all');

      setAccess({
        devices: devicesAccess,
        apps: appsAccess,
        profiles: profilesAccess,
        events: eventsAccess,
      });
    };

    checkAccess();
  }, []);

  const handleDownloadClick = () => {
    window.location.href = enrollLink;
  };

  const handleCopyLinkClick = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(enrollLink).then(() => {
        alert('Link copied to clipboard');
      }).catch((err) => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy the link');
      });
    } else {
      // Fallback: create a temporary input element to copy the link
      const textArea = document.createElement("textarea");
      textArea.value = enrollLink;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Link copied to clipboard');
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert('Failed to copy the link');
      }
      document.body.removeChild(textArea);
    }
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      <HeaderContainer>
        <HeaderList>
          {access.devices && (
            <HeaderItem>
              <Link to="/devices">Devices</Link>
            </HeaderItem>
          )}
          {access.apps && (
            <HeaderItem>
              <Link to="/apps">Apps</Link>
            </HeaderItem>
          )}
          {access.profiles && (
            <HeaderItem>
              <Link to="/profiles">Profiles</Link>
            </HeaderItem>
          )}
          {access.events && (
            <HeaderItem>
              <Link to="/events">Events</Link>
            </HeaderItem>
          )}
          {/* Add more links as needed */}
        </HeaderList>
        <AddDeviceButton onClick={toggleModal}>
          Add a New Device
        </AddDeviceButton>
      </HeaderContainer>

      <ModalOverlay isOpen={isModalOpen}>
        <ModalContent>
          <CloseButton onClick={toggleModal}>&times;</CloseButton>
          <ModalButton onClick={handleDownloadClick}>Download File</ModalButton>
          <ModalButton onClick={handleCopyLinkClick}>Copy Link</ModalButton>
          <QRCodeContainer>
            <QRCodeCanvas value={enrollLink} size={128} />
          </QRCodeContainer>
        </ModalContent>
      </ModalOverlay>
    </>
  );
}

export default Header;