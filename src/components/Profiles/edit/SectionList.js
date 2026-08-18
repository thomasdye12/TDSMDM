import React from 'react';
import styled from 'styled-components';

const ListContainer = styled.div`
  width: 250px;
  flex: 0 0 250px;
  background: var(--surface);
  padding: 14px;
  border-right: 1px solid var(--border);
  overflow-y: auto;

  @media (max-width: 800px) {
    width: 100%;
    flex: 0 0 auto;
    display: flex;
    gap: 6px;
    padding: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    border-right: 0;
    border-bottom: 1px solid var(--border);
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
`;

const SectionButton = styled.button`
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 6px;
  background: ${({ isActive }) => (isActive ? 'var(--accent-soft)' : 'transparent')};
  color: ${({ isActive }) => (isActive ? 'var(--accent)' : 'var(--text)')};
  border: 1px solid ${({ isActive }) => (isActive ? 'var(--accent)' : 'transparent')};
  border-radius: 8px;
  text-align: left;
  cursor: pointer;

  @media (max-width: 800px) {
    width: auto;
    min-height: 42px;
    flex: 0 0 auto;
    margin: 0;
    white-space: nowrap;
  }

  &:hover {
    background: ${({ isActive }) => (isActive ? 'var(--accent-soft)' : 'var(--surface-soft)')};
  }
`;

const SectionList = ({ activeSection, setActiveSection }) => {
  return (
    <ListContainer>
      <SectionButton
        isActive={activeSection === 'General'}
        onClick={() => setActiveSection('General')}
      >
        General
      </SectionButton>
      <SectionButton
        isActive={activeSection === 'Certificates'}
        onClick={() => setActiveSection('Certificates')}
      >
        Certificates
      </SectionButton>
      <SectionButton
        isActive={activeSection === 'Wi-Fi'}
        onClick={() => setActiveSection('Wi-Fi')}
      >
        Wi-Fi
      </SectionButton>
      <SectionButton
        isActive={activeSection === 'Domains'}
        onClick={() => setActiveSection('Domains')}
      >
        Domains
      </SectionButton>
      {/* LoginWindow */}
      <SectionButton
        isActive={activeSection === 'LoginWindow'}
        onClick={() => setActiveSection('LoginWindow')}
      >
        Login Window
        </SectionButton>

        <SectionButton
        isActive={activeSection === 'SharedDeviceSettings'}
        onClick={() => setActiveSection('SharedDeviceSettings')}
      >
       Shared Device 
        </SectionButton>
      <SectionButton
        isActive={activeSection === 'RestrictionsSettings'}
        onClick={() => setActiveSection('RestrictionsSettings')} 
      >
        Restrictions 
      </SectionButton>
      <SectionButton
        isActive={activeSection === 'HomeScreenLayoutSettings'}
        onClick={() => setActiveSection('HomeScreenLayoutSettings')}
      >
        Home Screen Layout
      </SectionButton>
      <SectionButton
        isActive={activeSection === 'SingleAppModeSettings'}
        onClick={() => setActiveSection('SingleAppModeSettings')}
      >
        Single App Mode
      </SectionButton>
      <SectionButton
        isActive={activeSection === 'AdvancedPayloads'}
        onClick={() => setActiveSection('AdvancedPayloads')}
      >
        Apple Payloads
      </SectionButton>
        
      {/* Add more sections as needed */}
    </ListContainer>
  );
};

export default SectionList;
