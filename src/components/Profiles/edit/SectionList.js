import React from 'react';
import styled from 'styled-components';

const ListContainer = styled.div`
  // width: 20%;
  background-color: #f0f0f0;
  padding: 20px;
  border-right: 1px solid #ccc;
  overflow-y: auto;
`;

const SectionButton = styled.button`
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  background-color: ${({ isActive }) => (isActive ? '#007bff' : '#ffffff')};
  color: ${({ isActive }) => (isActive ? '#ffffff' : '#000000')};
  border: 1px solid #ccc;
  border-radius: 5px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: ${({ isActive }) => (isActive ? '#0056b3' : '#f0f0f0')};
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
        
      {/* Add more sections as needed */}
    </ListContainer>
  );
};

export default SectionList;
