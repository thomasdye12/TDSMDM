import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axiosInstance from '../../utils/axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Upload from './UploadApp';


// <tr key={app.GUUID || app.id}>
// <TableCell>
//   <AppIcon src={iconUrl} alt={`${app.name} icon`} />
// </TableCell>
// <TableCell>{app.CFBundleDisplayName || app.name}</TableCell>
// <TableCell>{app.CFBundleShortVersionString || app.version}</TableCell>
// <TableCell>{app.CFBundleIdentifier || app.bundleId}</TableCell>
// <TableCell>{new Date(app.uploaded * 1000).toLocaleString()}</TableCell>
// <TableCell>
//   <ActionButton onClick={() => handlePushApp(app)}>Push App</ActionButton>
// </TableCell>
// </tr>

const TableCell = styled.td`
  padding: 15px;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
`;

const AppIcon = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 10px;
  object-fit: cover;
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const RemoveButton = styled.button`
  padding: 8px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;


const AppSingleCell = ({ app,showpush,handlePushApp,ShowRemoveButton,handleRemoveApp }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    
    const { data: iconUrl } = useQuery(['app-icon', app.icon], async () => {
        const { data } = await axiosInstance.get(`/files/icons/${app.icon}`, {
        responseType: 'blob',
        });
    
        return URL.createObjectURL(data);
    });
    
    
    return (
        <>
        <tr key={app.CFBundleIdentifier}>
            <TableCell>
            <AppIcon src={iconUrl} />
            </TableCell>
            <TableCell>{app.CFBundleDisplayName || app.name}</TableCell>
            <TableCell>{app.CFBundleShortVersionString || app.version}</TableCell>
            <TableCell>{app.CFBundleIdentifier || app.bundleId}</TableCell>
            <TableCell>{new Date(app.uploaded * 1000).toLocaleString()}</TableCell>

            {/* <TableCell>
            <ActionButton onClick={() => handlePushApp(app)}>Push App</ActionButton>
            </TableCell> */}
            {showpush &&
             <TableCell>
            <ActionButton onClick={() => handlePushApp(app)}>Push App</ActionButton>
            </TableCell>}
            {ShowRemoveButton &&
            <TableCell>
            <RemoveButton onClick={() => handleRemoveApp(app)}>Remove App</RemoveButton>
            </TableCell>}

        </tr>
        </>
    );
    }

export default AppSingleCell;
