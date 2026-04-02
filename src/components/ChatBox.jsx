import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Flex, Text, Input, IconButton, VStack, Avatar, Spinner, HStack, Typography,
  Menu, MenuButton, MenuList, MenuItem, useColorModeValue, useDisclosure,
  Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, Button 
} from '@chakra-ui/react';
import { Send, MoreVertical, UserPlus, Users, ArrowLeft, Trash2 } from 'lucide-react';
import API from '../api';
import { io } from 'socket.io-client';
import AddClientModal from './AddClientModal';

export default function ChatBox({ conversationId, activeConversation, projectId, participantId, currentUser, onBack, onAddClient }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(activeConversation || null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const bottomRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();

  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  const userBubbleBg = useColorModeValue('brand.500', 'brand.400');
  const otherBubbleBg = useColorModeValue('gray.100', 'gray.700');
  const userTextColor = 'white';
  const otherTextColor = useColorModeValue('gray.800', 'gray.100');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    // Initialize socket
    const backendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const newSocket = io(backendUrl, {
      auth: { userId: currentUser?._id },
      withCredentials: true
    });
    setSocket(newSocket);

    return () => newSocket.close();
  }, [currentUser]);

  useEffect(() => {
    if (activeConversation) {
      setConversation(activeConversation);
    }
  }, [activeConversation]);

  useEffect(() => {
    async function loadChat() {
      if (!currentUser) return;
      setLoading(true);
      try {
        let convId = conversationId;
        
        if (!convId && (projectId || participantId)) {
          // fetch or create conversation
          const res = await API.post('/chat/conversations', { 
             projectId, participantId, isGroup: false 
          });
          setConversation(res.data);
          convId = res.data._id;
        } else if (convId) {
          // could just fetch conversation details or rely on list wrapper
          // assuming parent provided it or we get it from messages fetch
        }

        if (convId) {
          const msgRes = await API.get(`/chat/messages/${convId}`);
          setMessages(msgRes.data);
          
          if (socket) {
             socket.emit("joinRoom", convId);
          }
        }
      } catch (err) {
        console.error("Failed to load chat", err);
      } finally {
        setLoading(false);
      }
    }
    loadChat();
  }, [conversationId, projectId, participantId, currentUser, socket]);

  useEffect(() => {
    if (!socket) return;
    
    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    
    return () => {
       socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const targetConvId = conversation?._id || activeConversation?._id || conversationId;
    
    if (!newMessage.trim() || !targetConvId) return;

    try {
      const text = newMessage;
      setNewMessage('');
      
      await API.post('/chat/messages', {
        conversationId: targetConvId,
        content: text
      });

    } catch (err) {
      console.error("Failed to send", err);
    }
  };

  const handleRemoveParticipant = async (userId) => {
    try {
      await API.put(`/chat/conversations/${conversation._id}/remove-participant`, { userId });
      setConversation(prev => ({
        ...prev,
        participants: prev.participants.filter(p => p._id !== userId)
      }));
    } catch(err) {
      console.error("Failed to remove participant", err);
    }
  };

  const isProjectOwner = useMemo(() => {
    if (!conversation || !conversation.project) return false;
    return conversation.project.createdBy === currentUser._id;
  }, [conversation, currentUser]);

  const chatTitle = conversation?.name || (conversation?.isGroup ? 'Group Chat' : 'Direct Message');
  
  const isGroupOwner = (conversation?.createdBy?._id || conversation?.createdBy)?.toString() === currentUser?._id?.toString() || isProjectOwner;

  if (loading) {
    return <Flex h="full" w="full" align="center" justify="center"><Spinner color="brand.500" /></Flex>;
  }

  return (
    <Flex direction="column" h="full" bg={bg} w="full">
      {/* Header */}
      <Flex p={4} borderBottom="1px solid" borderColor={border} align="center" justify="space-between">
        <HStack spacing={3}>
          {onBack && (
             <IconButton aria-label="Go back" icon={<ArrowLeft size={18} />} size="sm" variant="ghost" onClick={onBack} />
          )}
          <Avatar size="sm" icon={<Users size={16} />} bg="brand.500" color="white" />
          <Box 
            as={conversation?.isGroup ? "button" : "div"} 
            textAlign="left" 
            onClick={conversation?.isGroup ? onProfileOpen : undefined} 
            _hover={{ opacity: conversation?.isGroup ? 0.8 : 1 }}
            transition="opacity 0.2s"
          >
            <Text fontWeight="bold" fontSize="md">{chatTitle}</Text>
            {conversation?.isGroup && (
               <Text fontSize="xs" color="brand.500" fontWeight="bold">Tap to view {conversation.participants?.length || 0} members</Text>
            )}
          </Box>
        </HStack>
        
        {conversation?.isGroup && isGroupOwner && (
          <Menu>
            <MenuButton as={IconButton} icon={<MoreVertical size={18} />} variant="ghost" size="sm" />
            <MenuList>
               <MenuItem icon={<UserPlus size={16} />} onClick={onOpen}>
                 Add User to Group
               </MenuItem>
            </MenuList>
          </Menu>
        )}
      </Flex>

      {/* Messages */}
      <Flex flex={1} overflowY="auto" direction="column" p={4} gap={3}>
        {messages.length === 0 ? (
           <Text color="gray.500" textAlign="center" mt={10}>No messages yet. Send a message to start the conversation!</Text>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender?._id === currentUser?._id;
            const showName = !isMe && (i === 0 || messages[i-1].sender?._id !== msg.sender?._id);
            
            return (
              <Flex key={msg._id} direction="column" align={isMe ? 'flex-end' : 'flex-start'}>
                {showName && <Text fontSize="xs" color="gray.500" mb={1} ml={1}>{msg.sender?.name}</Text>}
                <Box
                  bg={isMe ? userBubbleBg : otherBubbleBg}
                  color={isMe ? userTextColor : otherTextColor}
                  px={4} py={2} rounded="2xl"
                  borderBottomRightRadius={isMe ? 0 : "2xl"}
                  borderBottomLeftRadius={!isMe ? 0 : "2xl"}
                  maxW="75%"
                >
                  <Text fontSize="sm">{msg.content}</Text>
                </Box>
              </Flex>
            );
          })
        )}
        <div ref={bottomRef} />
      </Flex>

      {/* Input */}
      <Box p={3} borderTop="1px solid" borderColor={border}>
        <form onSubmit={handleSend}>
          <HStack>
            <Input 
              placeholder="Type a message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              bg={inputBg}
              border="none"
              rounded="full"
              px={5}
            />
            <IconButton 
              type="submit"
              aria-label="Send message" 
              icon={<Send size={18} />} 
              colorScheme="brand" 
              rounded="full"
              isDisabled={!newMessage.trim()}
            />
          </HStack>
        </form>
      </Box>

      <Drawer isOpen={isProfileOpen} placement="right" onClose={onProfileClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" display="flex" justifyContent="space-between" alignItems="center">
            <Text>Group Profile</Text>
          </DrawerHeader>
          <DrawerBody p={0}>
             {isGroupOwner && (
                <Box p={4} borderBottom="1px solid" borderColor={border} bg={inputBg}>
                  <Button leftIcon={<UserPlus size={16} />} size="sm" colorScheme="brand" w="full" onClick={() => { onProfileClose(); onOpen(); }}>
                    Add Participant
                  </Button>
                </Box>
             )}
             <VStack align="stretch" spacing={0} divider={<Box borderBottom="1px solid" borderColor={border} />}>
               {conversation?.participants?.map(p => (
                  <Flex key={p._id} p={4} align="center" justify="space-between" _hover={{ bg: hoverBg }}>
                    <Flex align="center" gap={3}>
                      <Avatar size="sm" name={p.name} />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">{p.name}</Text>
                        <Text fontSize="xs" color="brand.500" fontWeight="bold" textTransform="uppercase">
                          {(p.role?.name || "Member")}
                        </Text>
                      </Box>
                    </Flex>
                    {(isGroupOwner && p._id !== currentUser._id) && (
                      <IconButton 
                        icon={<Trash2 size={16} />} 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="red" 
                        aria-label="Remove User" 
                        onClick={() => handleRemoveParticipant(p._id)}
                      />
                    )}
                  </Flex>
               ))}
             </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {conversation && (
        <AddClientModal 
          isOpen={isOpen} 
          onClose={onClose} 
          conversationId={conversation._id} 
        />
      )}
    </Flex>
  );
}
