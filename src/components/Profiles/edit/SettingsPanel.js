import React from 'react';
import styled from 'styled-components';

const PanelContainer = styled.div`
  flex: 1;
  padding: 20px;
  color: var(--text);
  background-color: var(--surface);
`;

const SettingsPanel = ({ children }) => {
  return <PanelContainer>{children}</PanelContainer>;
};

export default SettingsPanel;
