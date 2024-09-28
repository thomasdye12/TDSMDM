import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SectionList from './SectionList';
import SettingsPanel from './SettingsPanel';
import SaveButton from './SaveButton';
import GeneralSettings from './GeneralSettings';
import axiosInstance from '../../../utils/axios';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import CertificateSettings from './CertificateSettings';
import WifiSettings from './WifiSettings'; // import the new component
import DomainSettings from './DomainSettings'; // import the new component
import LoginWindowSettings from './LoginWindowSettings'; // import the new component

const Container = styled.div`
  display: flex;
  height: 100vh;
`;

const fetchProfile = async (profileId) => {
  const { data } = await axiosInstance.get(`/v1/profiles/${profileId}/get`);
  return data;
};


const ProfileEdit = () => {
  const { profileid } = useParams();
  const [activeSection, setActiveSection] = useState('General');
  // const { data: profiles, isLoading, error } = useQuery('profile
  //  get the profile id, then fetch the profile, using Query
  const { data: profile, isLoading, error } = useQuery(['profile', profileid], () => fetchProfile(profileid));
  const [settings, setSettings] = useState({});

  useEffect(() => {
    if (profile) {
      console.log(profile);
      setSettings(profile);
    }
  }, [profile]);

  if (isLoading) return <p>Loading...</p>;


  return (
    <Container>
      <SectionList activeSection={activeSection} setActiveSection={setActiveSection} />
      <SettingsPanel>
        {activeSection === 'General' && (
          <GeneralSettings settings={settings} setSettings={setSettings} />
        )}
         {activeSection === 'Certificates' && (
          <CertificateSettings settings={settings} setSettings={setSettings} />
        )}
         {activeSection === 'Wi-Fi' && (
          <WifiSettings settings={settings} setSettings={setSettings} />
        )}
         {activeSection === 'Domains' && (
          <DomainSettings settings={settings} setSettings={setSettings} />
        )}
         {activeSection === 'LoginWindow' && (
          <LoginWindowSettings settings={settings} setSettings={setSettings} />
        )}

        {/* Add other sections similarly */}
      </SettingsPanel>
      <SaveButton settings={settings} />
    </Container>
  );
};

export default ProfileEdit;
