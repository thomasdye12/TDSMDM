import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axiosInstance from '../../utils/axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import MDMIcons from '../../icons/MDMIcons.module.css' ;

// Fetch events from the API
const fetchEvents = async () => {
  const { data } = await axiosInstance.get('/v1/EventQueue/list');
  return data;
};

// Styled components
const EventListContainer = styled.div`
  width: 100%;
  background-color: #f7f7f7;
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 300px;
  padding: 10px;
  border-radius: 20px;
  border: 1px solid #ccc;
  font-size: 14px;
  outline: none;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.th`
  padding: 15px;
  background-color: #007bff;
  color: white;
  text-align: left;
  border-bottom: 1px solid #ddd;
`;

const TableCell = styled.td`
  padding: 15px;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
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
  width: 400px;
  max-width: 100%;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  color: white;
  background-color: #28a745;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #218838;
  }
`;

function EventQueue() {
  const { data: events, isLoading: isEventsLoading, error: eventsError } = useQuery('events', fetchEvents);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleConfirmAction = () => {
    // Perform the action for the selected event
    // For example, send a request to the server to update the event status
    axiosInstance.post('/v1/events/update', { id: selectedEvent._id });

    // Close the modal
    setIsModalOpen(false);
  };

  if (isEventsLoading) return <div>Loading...</div>;
  if (eventsError) return <div>Error fetching data</div>;

  const filteredEvents = events?.filter(event => {
    if (searchQuery === '') return true;
    return event.command.request_type.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <EventListContainer>
      <HeaderContainer>
        <SearchInput
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </HeaderContainer>
      <Table>
        <thead>
          <tr>
          <TableHeader></TableHeader>
            <TableHeader>Command UUID</TableHeader>
            <TableHeader>Request Type</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Created At</TableHeader>
            <TableHeader>Action</TableHeader>
          </tr>
        </thead>
        <tbody>
          {filteredEvents.map((event) => (
            <tr key={event.command_uuid}>
                <TableCell><div className={MDMIcons[event.eventicon]}> </div></TableCell>
              <TableCell>{event.command_uuid}</TableCell>
              <TableCell>{event.command.request_type}</TableCell>
              <TableCell>{event.status}</TableCell>
              <TableCell>{new Date(event.created_at * 1000).toLocaleString()}</TableCell>
              <TableCell>
                <ActionButton onClick={() => handleViewEvent(event)}>
                  View Details
                </ActionButton>
              </TableCell>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal for event details */}
      <ModalOverlay isOpen={isModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Event Details</ModalTitle>
            <CloseButton onClick={() => setIsModalOpen(false)}>&times;</CloseButton>
          </ModalHeader>
          {selectedEvent && (
            <div>
              <p><strong>Command UUID:</strong> {selectedEvent.command_uuid}</p>
              <p><strong>Request Type:</strong> {selectedEvent.command.request_type}</p>
              <p><strong>Status:</strong> {selectedEvent.status}</p>
              <p><strong>Created At:</strong> {new Date(selectedEvent.created_at * 1000).toLocaleString()}</p>
              {/* <ConfirmButton onClick={handleConfirmAction}>Confirm Action</ConfirmButton> */}
            </div>
          )}
        </ModalContent>
      </ModalOverlay>
    </EventListContainer>
  );
}

export default EventQueue;
