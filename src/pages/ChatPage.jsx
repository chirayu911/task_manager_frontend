import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, VStack, Avatar, useColorModeValue, Heading, IconButton, Button, Spinner, useDisclosure, Badge } from '@chakra-ui/react';
import { MessageSquare, Plus, Crown } from 'lucide-react';
import API from '../api';
import ChatBox from '../components/ChatBox';
import NewChatModal from '../components/NewChatModal';

export default function ChatPage({ user }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [owner, setOwner] = useState(null);
  const [startingOwnerChat, setStartingOwnerChat] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const unreadNameColor = useColorModeValue('black', 'white');
  const unreadMsgColor = useColorModeValue('gray.800', 'gray.200');

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await API.get('/chat/conversations');
        setConversations(res.data);
      } catch (err) {
        console.error("Failed to load conversations", err);
      }
    }
    loadConversations();
  }, []);

  // Fetch the company owner so non-owners can quickly ping them
  useEffect(() => {
    if (user?.isCompanyOwner) return; // Owners don't need to contact themselves
    async function loadOwner() {
      try {
        const { data } = await API.get('/users');
        const companyOwner = data.find(u => u.isCompanyOwner && u._id !== user._id);
        setOwner(companyOwner || null);
      } catch (err) {
        console.error("Failed to load staff list", err);
      }
    }
    loadOwner();
  }, [user]);

  const handleChatWithOwner = async () => {
    if (!owner) return;
    setStartingOwnerChat(true);
    try {
      const res = await API.post('/chat/conversations', { participantId: owner._id, isGroup: false });
      const newConv = res.data;
      setConversations(prev => {
        const exists = prev.find(c => c._id === newConv._id);
        return exists ? prev : [newConv, ...prev];
      });
      setActiveConversation(newConv);
    } catch (err) {
      console.error("Failed to open owner chat", err);
    } finally {
      setStartingOwnerChat(false);
    }
  };

  const getChatPartner = (conv) => {
    if (conv.isGroup) return null;
    return conv.participants?.find(p => p._id !== user._id);
  };

  const handleConversationClick = async (conv) => {
    setActiveConversation(conv);
    
    // Mark as read if there are unread messages
    if (conv.unreadCount > 0) {
      try {
        await API.put(`/chat/messages/${conv._id}/read`);
        setConversations(prev => prev.map(c => 
          c._id === conv._id ? { ...c, unreadCount: 0 } : c
        ));
        // Tell the Sidebar to refresh its unread count
        window.dispatchEvent(new CustomEvent('chatRead'));
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
  };

  return (
    <Box p={6} h="100vh" maxW="7xl" mx="auto">
      <Heading size="lg" mb={6} display="flex" alignItems="center" gap={3}>
        <MessageSquare /> Staff Chat
      </Heading>

      <Flex h="calc(100vh - 120px)" bg={bg} rounded="2xl" shadow="sm" border="1px solid" borderColor={border} overflow="hidden">
        
        {/* Sidebar Sidebar */}
        <Box w="320px" borderRight="1px solid" borderColor={border} flexShrink={0}>
          <Flex p={4} borderBottom="1px solid" borderColor={border} align="center" justify="space-between" flexWrap="wrap" gap={2}>
            <Text fontWeight="bold" fontSize="lg">Recent</Text>
            <Button 
               leftIcon={<Plus size={14} />} 
               size="xs" 
               colorScheme="brand" 
               variant="outline" 
               onClick={onOpen} 
               borderRadius="full"
            >
              New Chat / Group
            </Button>
          </Flex>
          <VStack align="stretch" spacing={0} overflowY="auto" h="calc(100% - 60px)">
            {conversations.length === 0 ? (
              <Text p={6} color="gray.500" textAlign="center">No active chats. Wait for someone to message you or start a project chat.</Text>
            ) : (
              conversations.map(conv => {
                const partner = getChatPartner(conv);
                const name = conv.isGroup ? conv.name : partner?.name;
                const isActive = activeConversation?._id === conv._id;

                return (
                  <Flex 
                    key={conv._id} 
                    p={4} 
                    cursor="pointer"
                    bg={isActive ? hoverBg : 'transparent'}
                    _hover={{ bg: hoverBg }}
                    onClick={() => handleConversationClick(conv)}
                    align="center"
                    gap={3}
                  >
                    <Avatar size="sm" name={name} bg={conv.isGroup ? (conv.project ? "blue.500" : "purple.500") : "gray.400"} color="white" />
                    <Box flex={1} overflow="hidden">
                      <Flex align="center" justify="space-between">
                        <Flex align="center" gap={2}>
                          <Text fontWeight={conv.unreadCount > 0 ? "black" : "bold"} fontSize="sm" noOfLines={1} color={conv.unreadCount > 0 ? unreadNameColor : undefined}>
                            {name}
                          </Text>
                          {conv.project && (
                            <Badge colorScheme="blue" fontSize="0.6em" variant="subtle">PROJECT</Badge>
                          )}
                          {!conv.project && conv.isGroup && (
                            <Badge colorScheme="purple" fontSize="0.6em" variant="subtle">GROUP</Badge>
                          )}
                        </Flex>
                        {conv.unreadCount > 0 && (
                          <Badge colorScheme="red" rounded="full" px="2" variant="solid" fontSize="0.7em">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </Flex>
                      <Text fontSize="xs" color={conv.unreadCount > 0 ? unreadMsgColor : "gray.500"} fontWeight={conv.unreadCount > 0 ? "bold" : "normal"} noOfLines={1} mt={0.5}>
                        {conv.latestMessage ? conv.latestMessage.content : "Tap to chat"}
                      </Text>
                    </Box>
                  </Flex>
                )
              })
            )}
          </VStack>

          {/* Pinned: Chat with Owner */}
          {!user?.isCompanyOwner && owner && (
            <Box p={3} borderTop="1px solid" borderColor={border}>
              <Button
                w="full"
                size="sm"
                variant="ghost"
                colorScheme="yellow"
                leftIcon={<Crown size={14} />}
                onClick={handleChatWithOwner}
                isLoading={startingOwnerChat}
                loadingText="Opening..."
                justifyContent="flex-start"
                fontWeight="bold"
              >
                Chat with {owner.name}
              </Button>
            </Box>
          )}
        </Box>

        {/* Chat Area */}
        <Box flex={1} position="relative" h="full">
          {activeConversation ? (
            <ChatBox 
              conversationId={activeConversation._id} 
              activeConversation={activeConversation}
              currentUser={user} 
              // onAddClient is mostly for project chat, but can be passed
            />
          ) : (
          <Flex h="full" direction="column" align="center" justify="center" color="gray.500" gap={4}>
              <MessageSquare size={48} opacity={0.2} />
              <Text>Select a conversation to start chatting</Text>
              {!user?.isCompanyOwner && owner && (
                <Button
                  leftIcon={<Crown size={16} />}
                  colorScheme="yellow"
                  variant="solid"
                  size="md"
                  onClick={handleChatWithOwner}
                  isLoading={startingOwnerChat}
                  loadingText="Opening..."
                  borderRadius="full"
                  px={6}
                >
                  Message {owner.name} (Owner)
                </Button>
              )}
            </Flex>
          )}
        </Box>

      </Flex>

      <NewChatModal 
         isOpen={isOpen} 
         onClose={onClose} 
         currentUser={user}
         onChatCreated={(newConv) => {
            // Check if it already exists in the list to avoid duplicates
            setConversations(prev => {
              const exists = prev.find(c => c._id === newConv._id);
              if (exists) return prev;
              return [newConv, ...prev];
            });
            setActiveConversation(newConv);
         }}
      />
    </Box>
  );
}
