import React from 'react';
import styled from 'styled-components';

const PanelContainer = styled.div`
  flex: 1;
  padding: 20px;
  background-color: #ffffff;
`;

const SettingsPanel = ({ children }) => {
  return <PanelContainer>{children}</PanelContainer>;
};

export default SettingsPanel;
