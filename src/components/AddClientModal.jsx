import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, Select, FormControl, FormLabel, useToast
} from '@chakra-ui/react';
import API from '../api';

export default function AddClientModal({ isOpen, onClose, conversationId, onClientAdded }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchUsers = async () => {
      try {
        const { data } = await API.get('/users');
        // You might filter this further based on role or let them add any staff/client
        setUsers(data);
      } catch (err) {
        toast({ title: 'Failed to load users', status: 'error', isClosable: true });
      }
    };
    fetchUsers();
  }, [isOpen, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);

    try {
      await API.put(`/chat/conversations/${conversationId}/add-participant`, { userId: selectedUser });
      toast({ title: 'User added to chat', status: 'success', isClosable: true });
      if (onClientAdded) onClientAdded(selectedUser);
      onClose();
      setSelectedUser('');
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err.response?.data?.message || 'Failed to add user', 
        status: 'error', 
        isClosable: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>Add User to Project Chat</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>Select User / Client</FormLabel>
            <Select 
              placeholder="Select user..." 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </Select>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={loading}>
            Cancel
          </Button>
          <Button colorScheme="brand" type="submit" isLoading={loading} loadingText="Adding...">
            Add User
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
