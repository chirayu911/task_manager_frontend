import React, { useState, useEffect, useCallback } from 'react';
import {
  History, Server, Activity, User, Eye, Box, AlertCircle
} from 'lucide-react';
import API from '../api';
import moment from 'moment';
import {
  Box as ChakraBox, Flex, Text, VStack, HStack, Badge, useColorModeValue,
  Spinner, Heading, Icon, Table, Thead, Tbody, Tr, Th, Td,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  Button, Select, useDisclosure, Grid
} from '@chakra-ui/react';

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/audit-logs');
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Audit Logs fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const viewDiff = (log) => {
    setSelectedLog(log);
    onOpen();
  };

  const bg = useColorModeValue('white', 'gray.800');
  const borderCol = useColorModeValue('gray.100', 'gray.700');
  const textTitle = useColorModeValue('gray.900', 'white');
  const textSub = useColorModeValue('gray.500', 'gray.400');
  const preBg = useColorModeValue('gray.50', 'gray.900');
  const theadBg = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  const filteredLogs = logs.filter(log => filterAction === 'all' || log.action === filterAction);

  if (loading) {
    return (
      <Flex p={20} justify="center" align="center" minH="50vh">
        <Spinner size="xl" color="red.500" thickness="4px" />
      </Flex>
    );
  }

  const renderJsonDiff = (oldState, newState) => {
    const oldStr = oldState ? JSON.stringify(oldState, null, 2) : 'No previous state';
    const newStr = newState ? JSON.stringify(newState, null, 2) : 'No new state';
    return (
      <Grid templateColumns="1fr 1fr" gap={4}>
        <ChakraBox>
          <Text fontWeight="bold" mb={2} color="red.500">Before (Old State)</Text>
          <ChakraBox as="pre" p={4} bg={preBg} rounded="md" fontSize="xs" overflowX="auto">
            {oldStr}
          </ChakraBox>
        </ChakraBox>
        <ChakraBox>
          <Text fontWeight="bold" mb={2} color="green.500">After (New State)</Text>
          <ChakraBox as="pre" p={4} bg={preBg} rounded="md" fontSize="xs" overflowX="auto">
            {newStr}
          </ChakraBox>
        </ChakraBox>
      </Grid>
    );
  };

  const actionColors = {
    'LOGIN': 'blue', 'LOGOUT': 'gray', 'CREATED': 'green', 'UPDATED': 'yellow', 'DELETED': 'red', 'COMPANY_REGISTERED': 'purple'
  };

  return (
    <ChakraBox p={{ base: 4, md: 8 }} maxW="7xl" mx="auto" minH="100vh">
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'end' }} mb={8} gap={4}>
        <ChakraBox>
          <Heading size="lg" display="flex" alignItems="center" gap={3} color={textTitle} fontWeight="black">
            <Icon as={Server} color="red.500" boxSize={8} /> Admin Audit Logs
          </Heading>
          <Text color={textSub} fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" mt={2}>
            System-wide critical action tracking
          </Text>
        </ChakraBox>

        <Flex gap={2}>
          <Select size="sm" rounded="md" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
            <option value="all">All Actions</option>
            <option value="LOGIN">Auth (Login/Logout)</option>
            <option value="CREATED">Create</option>
            <option value="UPDATED">Update</option>
            <option value="DELETED">Delete</option>
            <option value="COMPANY_REGISTERED">Company Registration</option>
          </Select>
        </Flex>
      </Flex>

      <ChakraBox bg={bg} border="1px" borderColor={borderCol} rounded="xl" overflow="hidden">
        <ChakraBox overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead bg={theadBg}>
              <Tr>
                <Th>Time</Th>
                <Th>User</Th>
                <Th>Company Context</Th>
                <Th>IP Address</Th>
                <Th>Resource</Th>
                <Th>Action</Th>
                <Th>Details</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredLogs.map(log => (
                <Tr key={log._id} _hover={{ bg: rowHoverBg }}>
                  <Td whiteSpace="nowrap"><Text fontSize="xs">{moment(log.createdAt).format('MM/DD/YYYY HH:mm')}</Text></Td>
                  <Td>
                    <HStack>
                      <User size={14} />
                      <Text fontSize="sm" fontWeight="medium">{log.user?.name || 'System'}</Text>
                    </HStack>
                  </Td>
                  <Td><Text fontSize="xs">{log.company?.companyName || 'Global'}</Text></Td>
                  <Td><Badge colorScheme="purple" variant="subtle" fontSize="10px">{log.ipAddress}</Badge></Td>
                  <Td fontWeight="bold" fontSize="xs">{log.resourceType}</Td>
                  <Td>
                    <Badge colorScheme={actionColors[log.action] || 'blue'} px={2} py={1} rounded="md">
                      {log.action}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack>
                      <Text isTruncated maxW="200px" fontSize="xs">{log.description}</Text>
                      {(log.beforeState || log.afterState) && (
                        <Button size="xs" colorScheme="blue" variant="ghost" onClick={() => viewDiff(log)} leftIcon={<Eye size={12} />}>
                          Diff
                        </Button>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </ChakraBox>
      </ChakraBox>

      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg={bg}>
          <ModalHeader color={textTitle}>
            Action Diff: {selectedLog?.action} on {selectedLog?.resourceType}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4} fontWeight="medium" color={textSub}>{selectedLog?.description}</Text>
            {renderJsonDiff(selectedLog?.beforeState, selectedLog?.afterState)}
          </ModalBody>
        </ModalContent>
      </Modal>
    </ChakraBox>
  );
}
