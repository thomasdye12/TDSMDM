import React from 'react';
import styled from 'styled-components';

const InfoItem = styled.p`
  margin: 8px 0;
  font-size: 14px;
  color: #555;

  strong {
    color: #333;
  }
`;

const DeviceInfoItem = ({ label, value }) => {
  return (
    <InfoItem>
      <strong>{label}:</strong> {value}
    </InfoItem>
  );
};

export default DeviceInfoItem;
