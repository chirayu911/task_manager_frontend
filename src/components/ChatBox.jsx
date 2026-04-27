import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Flex, Text, Input, IconButton, VStack, Avatar, Spinner, HStack,
  Menu, MenuButton, MenuList, MenuItem, useColorModeValue, useDisclosure,
  Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, Button 
} from '@chakra-ui/react';
import { Send, MoreVertical, UserPlus, Users, ArrowLeft, Trash2, Paperclip, File, Folder, Download, ExternalLink } from 'lucide-react';
import API from '../api';
import { io } from 'socket.io-client';
import AddClientModal from './AddClientModal';
import DocumentPickerModal from './DocumentPickerModal';
import ProjectSelectorModal from './ProjectSelectorModal';
import { useToast, Icon, Tooltip } from '@chakra-ui/react';

export default function ChatBox({ conversationId, activeConversation, projectId, participantId, currentUser, onBack, onAddClient }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(activeConversation || null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();
  const { isOpen: isDocPickerOpen, onOpen: onDocPickerOpen, onClose: onDocPickerClose } = useDisclosure();
  const { isOpen: isProjectSelectorOpen, onOpen: onProjectSelectorOpen, onClose: onProjectSelectorClose } = useDisclosure();
  
  const [commonProjects, setCommonProjects] = useState([]);
  const [pendingFile, setPendingFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

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
      setTypingUsers(prev => prev.filter(u => u._id !== msg.sender?._id));
    };

    const handleTyping = (user) => {
      setTypingUsers((prev) => {
        if (!prev.find(u => u._id === user._id)) {
          return [...prev, user];
        }
        return prev;
      });
    };

    const handleStopTyping = (user) => {
      setTypingUsers((prev) => prev.filter(u => u._id !== user._id));
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    
    return () => {
       socket.off("receiveMessage", handleReceiveMessage);
       socket.off("typing", handleTyping);
       socket.off("stopTyping", handleStopTyping);
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
      
      if (socket) {
        socket.emit("stopTyping", { roomId: targetConvId, user: { _id: currentUser._id, name: currentUser.name } });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
      
      await API.post('/chat/messages', {
        conversationId: targetConvId,
        content: text
      });

    } catch (err) {
      console.error("Failed to send", err);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    const targetConvId = conversation?._id || activeConversation?._id || conversationId;
    if (!socket || !targetConvId) return;

    socket.emit("typing", { roomId: targetConvId, user: { _id: currentUser._id, name: currentUser.name } });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { roomId: targetConvId, user: { _id: currentUser._id, name: currentUser.name } });
    }, 1500);
  };

  const handleSelectExistingDoc = async (doc) => {
    const targetConvId = conversation?._id || activeConversation?._id || conversationId;
    try {
      await API.post('/chat/messages', {
        conversationId: targetConvId,
        documentId: doc._id,
        messageType: 'document'
      });
      onDocPickerClose();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to share document",
        status: "error",
        duration: 3000
      });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPendingFile(file);

    // If it's a project chat, we know the project
    if (conversation?.project) {
      performUpload(file, conversation.project);
    } else {
      // Personal chat - find common projects
      const partner = conversation?.participants?.find(p => p._id !== currentUser._id);
      if (!partner) return;

      try {
        const { data } = await API.get(`/projects/common/${partner._id}`);
        if (data.length === 0) {
          toast({
            title: "Cannot Upload",
            description: "You and the recipient must share at least one project to upload new documents.",
            status: "warning",
            duration: 5000,
            isClosable: true
          });
          setPendingFile(null);
        } else if (data.length === 1) {
          performUpload(file, data[0]._id);
        } else {
          setCommonProjects(data);
          onProjectSelectorOpen();
        }
      } catch (err) {
        console.error("Failed to fetch common projects", err);
      }
    }
  };

  const performUpload = async (file, projectId) => {
    setIsUploading(true);
    const targetConvId = conversation?._id || activeConversation?._id || conversationId;

    try {
      // 1. Upload to Document system
      const formData = new FormData();
      formData.append('documentFile', file);
      formData.append('title', file.name);
      formData.append('project', projectId);
      formData.append('type', 'file');

      const docRes = await API.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 2. share in chat
      await API.post('/chat/messages', {
        conversationId: targetConvId,
        documentId: docRes.data._id,
        messageType: 'document'
      });

      onProjectSelectorClose();
      setPendingFile(null);
      toast({
        title: "Success",
        description: "Document uploaded and shared",
        status: "success",
        duration: 3000
      });
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: err.response?.data?.message || "Failed to upload document",
        status: "error",
        duration: 4000
      });
    } finally {
      setIsUploading(false);
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
                  shadow="sm"
                >
                  {msg.messageType === 'document' && msg.document ? (
                    <Box minW="200px">
                      <Flex align="center" gap={3} mb={2}>
                        <Icon as={File} size={20} />
                        <Box flex={1}>
                          <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                            {msg.document.title || msg.document.originalName}
                          </Text>
                          <Text fontSize="xs" opacity={0.8}>
                            {msg.document.fileType}
                          </Text>
                        </Box>
                      </Flex>
                      <HStack mt={3} pt={2} borderTop="1px solid" borderColor={isMe ? "whiteAlpha.300" : "blackAlpha.100"} justify="space-between">
                        <Button 
                          as="a" 
                          href={msg.document.fileUrl ? `${process.env.REACT_APP_API_URL?.replace('/api', '')}/${msg.document.fileUrl}` : '#'} 
                          target="_blank" 
                          download 
                          size="xs" 
                          variant="ghost" 
                          color="inherit"
                          _hover={{ bg: isMe ? "whiteAlpha.200" : "blackAlpha.100" }}
                          leftIcon={<Download size={14} />}
                        >
                          Download
                        </Button>
                        <Button 
                          as="a" 
                          href={`/documents/${msg.document._id}`}
                          size="xs" 
                          variant="ghost" 
                          color="inherit"
                          _hover={{ bg: isMe ? "whiteAlpha.200" : "blackAlpha.100" }}
                          rightIcon={<ExternalLink size={14} />}
                        >
                          View
                        </Button>
                      </HStack>
                    </Box>
                  ) : (
                    <Text fontSize="sm">{msg.content}</Text>
                  )}
                </Box>
              </Flex>
            );
          })
        )}
        
        {typingUsers.length > 0 && (
          <Flex direction="column" align="flex-start" mt={2} mb={1} px={2} pl={10}>
             <Text fontSize="xs" color="gray.500" fontStyle="italic">
               {conversation?.isGroup 
                 ? `${typingUsers.map(u => u.name).join(', ')} ${typingUsers.length > 1 ? 'are' : 'is'} typing...`
                 : `typing...`}
             </Text>
          </Flex>
        )}
        <div ref={bottomRef} />
      </Flex>

      {/* Input */}
      <Box p={3} borderTop="1px solid" borderColor={border}>
        <form onSubmit={handleSend}>
          <HStack>
            <Menu placement="top-start">
              <Tooltip label="Attach document">
                <MenuButton 
                  as={IconButton} 
                  icon={<Paperclip size={20} />} 
                  variant="ghost" 
                  rounded="full" 
                  isLoading={isUploading}
                />
              </Tooltip>
              <MenuList>
                <MenuItem icon={<File size={16} />} onClick={onDocPickerOpen}>
                  Select from Project
                </MenuItem>
                <MenuItem icon={<Folder size={16} />} onClick={() => fileInputRef.current?.click()}>
                  Upload New
                </MenuItem>
              </MenuList>
            </Menu>

            <Input 
              placeholder="Type a message..." 
              value={newMessage}
              onChange={handleInputChange}
              bg={inputBg}
              border="none"
              rounded="full"
              px={5}
            />
            <input 
              type="file" 
              hidden 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <IconButton 
              type="submit"
              aria-label="Send message" 
              icon={<Send size={18} />} 
              colorScheme="brand" 
              rounded="full"
              isDisabled={!newMessage.trim() && !isUploading}
            />
          </HStack>
        </form>
      </Box>

      {/* Modals */}
      <DocumentPickerModal 
        isOpen={isDocPickerOpen} 
        onClose={onDocPickerClose} 
        onSelect={handleSelectExistingDoc}
      />

      <ProjectSelectorModal 
        isOpen={isProjectSelectorOpen} 
        onClose={onProjectSelectorClose} 
        projects={commonProjects}
        onSelect={(pId) => performUpload(pendingFile, pId)}
      />

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
