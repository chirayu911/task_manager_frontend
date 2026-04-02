import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, User as UserIcon, Box as BoxIcon, CheckCircle2, AlertCircle, FileText, 
  Clock 
} from 'lucide-react';
import API from '../api';
import moment from 'moment';
import {
  Box, Flex, Text, VStack, HStack, Badge, useColorModeValue,
  Spinner, Heading, Icon, useColorMode
} from '@chakra-ui/react';

export default function ActivityLogPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const { colorMode } = useColorMode(); // Use colorMode for dynamic loop elements

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/activities/mine');
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Logs failed", err);
      setActivities([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getIconData = (type) => {
    switch (type) {
      case 'task': return { icon: CheckCircle2, color: 'blue' };
      case 'issue': return { icon: AlertCircle, color: 'red' };
      case 'document': return { icon: FileText, color: 'teal' };
      case 'project': return { icon: BoxIcon, color: 'purple' };
      default: return { icon: History, color: 'gray' };
    }
  };

  // Top-level hooks
  const bg = useColorModeValue('white', 'gray.800');
  const borderCol = useColorModeValue('gray.100', 'gray.700');
  const textTitle = useColorModeValue('gray.900', 'white');
  const textSub = useColorModeValue('gray.500', 'gray.400');
  const timelineLine = useColorModeValue('gray.200', 'gray.600');
  
  // Specific backgrounds that were used after early returns
  const filterBoxBg = useColorModeValue('white', 'gray.800');
  const emptyBoxBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const emptyIconColor = useColorModeValue('gray.300', 'gray.600');
  const filterHoverBg = useColorModeValue('gray.100', 'gray.700');

  if (loading) {
    return (
      <Flex p={20} justify="center" align="center" minH="50vh">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  const filters = ['all', 'task', 'issue', 'project', 'document'];
  const filteredActivities = activities.filter(log => filter === 'all' || log.resourceType === filter);

  return (
    <Box p={{ base: 4, md: 8 }} maxW="5xl" mx="auto" minH="100vh">
      {/* HEADER SECTION */}
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'end' }} mb={8} gap={4}>
        <Box>
          <Heading size="lg" display="flex" alignItems="center" gap={3} color={textTitle} fontWeight="black">
            <Icon as={History} color="brand.500" boxSize={8} /> Activity Stream
          </Heading>
          <Text color={textSub} fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" mt={2}>
            Real-time updates across your projects (Auto-clears after 7 days)
          </Text>
        </Box>

        {/* FILTERS */}
        <Flex 
          bg={filterBoxBg} 
          p={1.5} 
          rounded="2xl" 
          border="1px solid" 
          borderColor={borderCol}
          gap={2}
          overflowX="auto"
          maxW="100%"
        >
          {filters.map((f) => (
            <Box
              key={f}
              as="button"
              onClick={() => setFilter(f)}
              px={4} py={2} rounded="xl" fontSize="xs" fontWeight="bold" textTransform="capitalize"
              transition="all 0.2s"
              bg={filter === f ? 'brand.500' : 'transparent'}
              color={filter === f ? 'white' : textSub}
              _hover={{ bg: filter === f ? 'brand.600' : filterHoverBg }}
            >
              {f}
            </Box>
          ))}
        </Flex>
      </Flex>

      {/* TIMELINE LIST */}
      <VStack spacing={4} align="stretch" position="relative">
        {filteredActivities.length === 0 ? (
          <Flex direction="column" align="center" justify="center" py={20} bg={emptyBoxBg} rounded="3xl" border="2px dashed" borderColor={borderCol}>
            <Icon as={History} boxSize={12} color={emptyIconColor} mb={4} />
            <Text color={textSub} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="widest">
              No recent activity found
            </Text>
          </Flex>
        ) : (
          filteredActivities.map((log, index) => {
            const iconData = getIconData(log.resourceType);
            const isLast = index === filteredActivities.length - 1;

            // Use colorMode state directly inside the loop, NO HOOKS!
            const isDark = colorMode === 'dark';
            const iconBgColor = isDark ? 'whiteAlpha.100' : `${iconData.color}.50`;
            const iconBorderColor = isDark ? 'whiteAlpha.200' : `${iconData.color}.100`;
            const iconTextColor = isDark ? `${iconData.color}.300` : `${iconData.color}.500`;

            return (
              <Flex 
                key={log._id} 
                position="relative" 
                gap={6} p={5} 
                bg={bg} 
                rounded="2xl" 
                border="1px solid" borderColor={borderCol}
                transition="all 0.2s"
                _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }}
                role="group"
              >
                {/* Timeline Connector Line */}
                {!isLast && (
                  <Box 
                    position="absolute" left="43px" top="64px" bottom="-20px" 
                    w="2px" bg={timelineLine} 
                    opacity={0.5}
                    _groupHover={{ bg: 'brand.300' }}
                    transition="all 0.3s"
                  />
                )}

                {/* Left Icon */}
                <Flex 
                  shrink={0} w={12} h={12} rounded="2xl" 
                  bg={iconBgColor} 
                  align="center" justify="center" 
                  border="1px solid" borderColor={iconBorderColor}
                  color={iconTextColor}
                >
                  <Icon as={iconData.icon} boxSize={5} />
                </Flex>

                {/* Content */}
                <Flex flex={1} pt={1} justify="space-between" align="start" direction={{ base: 'column', sm: 'row' }} gap={2}>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color={textTitle} lineHeight="tight">
                      {log.description}
                    </Text>
                    <HStack mt={1} spacing={3} color={textSub} fontSize="xs">
                      <Flex align="center" gap={1.5}>
                        <Icon as={UserIcon} boxSize={3.5} />
                        <Text>{log.user?.name || 'System'}</Text>
                      </Flex>
                      <Text>•</Text>
                      <Flex align="center" gap={1.5}>
                        <Icon as={Clock} boxSize={3.5} />
                        <Text>{moment(log.createdAt).fromNow()}</Text>
                      </Flex>
                    </HStack>
                  </Box>
                  <Badge 
                    colorScheme={iconData.color} 
                    px={2} py={1} rounded="lg" fontSize="10px" 
                    textTransform="uppercase" fontWeight="black"
                  >
                    {log.resourceType}
                  </Badge>
                </Flex>
              </Flex>
            );
          })
        )}
      </VStack>
    </Box>
  );
}