import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, Text, Avatar, Flex, Input, Spinner, useColorModeValue, Box,
  Tabs, TabList, TabPanels, Tab, TabPanel, Checkbox
} from '@chakra-ui/react';
import { Search } from 'lucide-react';
import API from '../api';

export default function NewChatModal({ isOpen, onClose, onChatCreated, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Group Chat State
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const hoverBg = useColorModeValue('brand.50', 'gray.700');
  const searchBg = useColorModeValue('gray.100', 'gray.800');
  const inputBorder = useColorModeValue('gray.200', 'gray.700');
  const footerBorder = useColorModeValue('gray.100', 'gray.800');

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/users');
        // Filter out the current user
        const otherUsers = (data.users || data).filter(u => u._id !== currentUser._id);
        setUsers(otherUsers);
      } catch (err) {
        console.error("Failed to load staff list", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [isOpen, currentUser]);

  const handleStartChat = async (userId) => {
    if (isGroupMode) return; // Handled differently
    try {
      const res = await API.post('/chat/conversations', { 
        participantId: userId, 
        isGroup: false 
      });
      onChatCreated(res.data);
      onClose();
    } catch (err) {
      console.error("Failed to create conversation", err);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    try {
      const res = await API.post('/chat/conversations', {
        isGroup: true,
        name: groupName,
        participantIds: selectedUsers
      });
      onChatCreated(res.data);
      setGroupName('');
      setSelectedUsers([]);
      onClose();
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader pb={0}>New Conversation</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody mt={2} overflowY="hidden" display="flex" flexDirection="column">
          <Tabs isFitted colorScheme="brand" onChange={(idx) => setIsGroupMode(idx === 1)}>
            <TabList mb="1em">
              <Tab>Direct Message</Tab>
              <Tab>Group Chat</Tab>
            </TabList>

            <TabPanels flex="1" overflowY="auto">
              {/* DIRECT MESSAGE PANEL */}
              <TabPanel p={0} pt={2}>
                <Flex align="center" bg={searchBg} p={2} rounded="lg" mb={4}>
                  <Search size={18} color="gray" />
                  <Input 
                    variant="unstyled" 
                    placeholder="Search staff..." 
                    ml={2} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Flex>

                <VStack align="stretch" spacing={1} maxH="50vh" overflowY="auto" pb={4}>
                  {loading ? (
                    <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>
                  ) : filteredUsers.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={4}>No users found.</Text>
                  ) : (
                    filteredUsers.map(user => (
                      <Flex key={user._id} align="center" gap={3} p={3} rounded="lg" cursor="pointer" _hover={{ bg: hoverBg }} onClick={() => handleStartChat(user._id)} transition="all 0.2s">
                        <Avatar size="sm" name={user.name} />
                        <Box flex="1">
                          <Text fontWeight="bold" fontSize="sm">{user.name}</Text>
                          <Text fontSize="xs" color="gray.500">{user.email}</Text>
                        </Box>
                        <Text fontSize="xs" color="brand.500" fontWeight="bold">Message</Text>
                      </Flex>
                    ))
                  )}
                </VStack>
              </TabPanel>

              {/* GROUP CHAT PANEL */}
              <TabPanel p={0} pt={2}>
                <Input 
                  placeholder="Group Name (e.g. Marketing Team)" 
                  mb={4}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  border="1px solid" borderColor={inputBorder}
                />

                <Flex align="center" bg={searchBg} p={2} rounded="lg" mb={4}>
                  <Search size={18} color="gray" />
                  <Input variant="unstyled" placeholder="Search staff to add..." ml={2} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </Flex>

                <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={2} px={1}>
                  Select Members ({selectedUsers.length} selected)
                </Text>

                <VStack align="stretch" spacing={1} maxH="40vh" overflowY="auto" pb={4}>
                  {filteredUsers.map(user => (
                    <Flex key={user._id} align="center" gap={3} p={3} rounded="lg" cursor="pointer" _hover={{ bg: hoverBg }} onClick={() => toggleUserSelection(user._id)} transition="all 0.2s">
                      <Checkbox colorScheme="brand" isChecked={selectedUsers.includes(user._id)} onChange={() => toggleUserSelection(user._id)} />
                      <Avatar size="sm" name={user.name} />
                      <Box flex="1">
                        <Text fontWeight="bold" fontSize="sm">{user.name}</Text>
                        <Text fontSize="xs" color="gray.500">{user.email}</Text>
                      </Box>
                    </Flex>
                  ))}
                </VStack>
              </TabPanel>

            </TabPanels>
          </Tabs>
        </ModalBody>
        
        {isGroupMode && (
          <ModalFooter borderTop="1px solid" borderColor={footerBorder}>
             <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
             <Button colorScheme="brand" onClick={handleCreateGroup} isDisabled={!groupName.trim() || selectedUsers.length === 0}>
               Create Group
             </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
