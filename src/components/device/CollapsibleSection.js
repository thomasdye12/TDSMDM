import React, { useState } from 'react';
import styled from 'styled-components';

const CollapsibleSectionContainer = styled.div`
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fdfdfd;
`;

const SectionHeader = styled.div`
  padding: 15px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  font-weight: bold;
  color: #333;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const SectionContent = styled.div`
  padding: 15px;
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
`;

const Icon = styled.span`
  transform: ${({ isOpen }) => (isOpen ? 'rotate(90deg)' : 'rotate(0deg)')};
  transition: transform 0.2s ease;
`;

const CollapsibleSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CollapsibleSectionContainer>
      <SectionHeader onClick={() => setIsOpen(!isOpen)}>
        {title}
        <Icon isOpen={isOpen}>▶</Icon>
      </SectionHeader>
      <SectionContent isOpen={isOpen}>{children}</SectionContent>
    </CollapsibleSectionContainer>
  );
};

export default CollapsibleSection;
