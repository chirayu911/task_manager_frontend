import React, { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Text, Table, Thead, Tbody, Tr, Th, Td, Badge, Select, Spinner, useColorModeValue, Input, Button, Tabs, TabList, TabPanels, Tab, TabPanel, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Textarea, Icon, IconButton } from '@chakra-ui/react';
import { CalendarPlus, CalendarDays, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';

export default function AttendancePage({ user }) {
  const [attendance, setAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);

  // Filters
  const [selectedUser, setSelectedUser] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const navigate = useNavigate();

  const roleName = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const perms = user?.permissions || [];
  const isAdminOrOwner = user?.isCompanyOwner || roleName === 'admin' || perms.includes('*') || perms.includes('attendance_read');

  const fetchData = async () => {
    try {
      if (isAdminOrOwner) {
        const [usersRes, leaveRes] = await Promise.all([
          API.get('/users'),
          API.get('/attendance/leave/pending')
        ]);
        setUsersList(Array.isArray(usersRes.data) ? usersRes.data : []);
        setPendingLeaves(leaveRes.data);
      } else {
        const { data } = await API.get('/attendance/me');
        setAttendance(data);
      }
    } catch (err) {
      console.error("Failed to fetch attendance records");
      toast.error("Failed to load records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdminOrOwner]);

  const filteredUsers = useMemo(() => {
    let result = usersList;
    if (selectedUser) {
      result = result.filter(u => u.name.toLowerCase().includes(selectedUser.toLowerCase()));
    }
    return result;
  }, [usersList, selectedUser]);

  const handleRequestLeave = async () => {
    if (!leaveDate || !leaveReason) {
      toast.error('Date and reason are required');
      return;
    }
    setSubmittingLeave(true);
    try {
      await API.post('/attendance/leave', { date: leaveDate, reason: leaveReason });
      toast.success('Leave requested successfully');
      setLeaveDate('');
      setLeaveReason('');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleLeaveAction = async (id, status) => {
    try {
      await API.put(`/attendance/leave/${id}`, { status });
      toast.success(`Leave ${status} successfully`);
      fetchData(); // Refresh both lists
    } catch (error) {
      toast.error('Failed to update leave status');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'present': return 'green.500';
      case 'absent': return 'red.500';
      case 'leave': return 'yellow.500';
      default: return 'gray.500';
    }
  };

  const headingColor = useColorModeValue('gray.900', 'white');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const rowHoverBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  if (loading) {
    return (
      <Flex p={20} flexDir="column" align="center" justify="center" gap={4}>
        <Spinner size="xl" color="brand.600" thickness="4px" />
        <Text fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest" fontSize="xs">
          Loading Data...
        </Text>
      </Flex>
    );
  }

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Text fontSize="3xl" fontWeight="black" color={headingColor} tracking="tight">
            Attendance & Leaves
          </Text>
          <Text color="gray.500" fontWeight="bold" mt={1}>
            {isAdminOrOwner ? 'Manage attendance and leave requests.' : 'View history and request leaves.'}
          </Text>
        </Box>

        <Flex gap={4}>
          {!isAdminOrOwner && (
            <Button
              leftIcon={<CalendarPlus size={18} />}
              colorScheme="brand"
              onClick={onOpen}
              rounded="xl"
              shadow="md"
            >
              Request Leave
            </Button>
          )}
        </Flex>
      </Flex>

      {isAdminOrOwner ? (
        <Tabs variant="soft-rounded" colorScheme="brand">
          <TabList mb={4}>
            <Tab fontWeight="bold">Attendance Records</Tab>
            <Tab fontWeight="bold">
              Leave Requests
              {pendingLeaves.length > 0 && (
                <Badge ml={2} colorScheme="red" borderRadius="full">{pendingLeaves.length}</Badge>
              )}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0} pt={4}>
              <Box bg={cardBg} border="1px solid" borderColor={borderColor} rounded="2xl" overflow="hidden" shadow="sm">
                <Flex p={4} borderBottom="1px solid" borderColor={borderColor} gap={4} bg={headerBg}>
                  <Input placeholder="Search Employee..." w="auto" bg={cardBg} value={selectedUser} onChange={e => setSelectedUser(e.target.value)} borderColor={borderColor} />
                </Flex>
                <Box overflowX="auto">
                  <Table variant="simple" size="md">
                    <Thead bg={headerBg}>
                      <Tr>
                        <Th>Employee Name</Th>
                        <Th>Email</Th>
                        <Th>Role</Th>
                        <Th textAlign="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredUsers.length > 0 ? filteredUsers.map(u => (
                        <Tr key={u._id} _hover={{ bg: rowHoverBg }}>
                          <Td fontWeight="bold" color={headingColor}>{u.name}</Td>
                          <Td color="gray.500">{u.email}</Td>
                          <Td>
                            <Badge colorScheme="brand" textTransform="uppercase" rounded="md" px={2} py={1}>
                              {typeof u.role === 'object' ? u.role?.name : u.role || 'Staff'}
                            </Badge>
                          </Td>
                          <Td textAlign="right">
                            <Button
                              size="sm"
                              colorScheme="brand"
                              variant="outline"
                              leftIcon={<CalendarDays size={16} />}
                              onClick={() => navigate(`/attendance/calendar/${u._id}`, { state: { userName: u.name } })}
                            >
                              View Calendar
                            </Button>
                          </Td>
                        </Tr>
                      )) : (
                        <Tr><Td colSpan={4} textAlign="center" py={10} color="gray.400" fontWeight="bold">No staff members found.</Td></Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            </TabPanel>
            <TabPanel p={0} pt={4}>
              <Box bg={cardBg} border="1px solid" borderColor={borderColor} rounded="2xl" overflow="hidden" shadow="sm">
                <Table variant="simple" size="md">
                  <Thead bg={headerBg}>
                    <Tr>
                      <Th>Employee</Th>
                      <Th>Date</Th>
                      <Th>Reason</Th>
                      <Th textAlign="right">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pendingLeaves.length > 0 ? pendingLeaves.map(leave => (
                      <Tr key={leave._id} _hover={{ bg: rowHoverBg }}>
                        <Td fontWeight="bold" color={headingColor}>{leave.user?.name}</Td>
                        <Td fontWeight="medium">{new Date(leave.date).toLocaleDateString()}</Td>
                        <Td maxW="300px" isTruncated>{leave.reason}</Td>
                        <Td textAlign="right">
                          <Flex gap={2} justify="flex-end">
                            <Button
                              leftIcon={<Icon as={Check} />}
                              colorScheme="green"
                              size="sm"
                              onClick={() => handleLeaveAction(leave._id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              leftIcon={<Icon as={X} />}
                              colorScheme="red"
                              size="sm"
                              onClick={() => handleLeaveAction(leave._id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </Flex>
                        </Td>
                      </Tr>
                    )) : (
                      <Tr><Td colSpan={4} textAlign="center" py={10} color="gray.400" fontWeight="bold">No pending leave requests.</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      ) : (
        <Box bg={cardBg} border="1px solid" borderColor={borderColor} rounded="2xl" overflow="hidden" shadow="sm">
          <Flex p={4} borderBottom="1px solid" borderColor={borderColor} gap={4} bg={headerBg}>
            <Input type="date" w="auto" bg={cardBg} value={dateFilter} onChange={e => setDateFilter(e.target.value)} borderColor={borderColor} />
          </Flex>
          <AttendanceTable filteredAttendance={attendance} isAdminOrOwner={isAdminOrOwner} headingColor={headingColor} rowHoverBg={rowHoverBg} headerBg={headerBg} getStatusBadgeColor={getStatusBadgeColor} />
        </Box>
      )}

      {/* Request Leave Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent rounded="xl">
          <ModalHeader>Request Leave</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box mb={4}>
              <Text fontWeight="bold" mb={2} color={headingColor}>Date of Leave</Text>
              <Input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </Box>
            <Box>
              <Text fontWeight="bold" mb={2} color={headingColor}>Reason</Text>
              <Textarea placeholder="Explain your reason for leave..." value={leaveReason} onChange={e => setLeaveReason(e.target.value)} rows={4} />
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3} variant="ghost">Cancel</Button>
            <Button colorScheme="brand" onClick={handleRequestLeave} isLoading={submittingLeave}>Submit Request</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

const AttendanceTable = ({ filteredAttendance, isAdminOrOwner, headingColor, rowHoverBg, headerBg, getStatusBadgeColor }) => (
  <Box overflowX="auto">
    <Table variant="simple" size="md">
      <Thead bg={headerBg}>
        <Tr>
          <Th py={4}>Date</Th>
          {isAdminOrOwner && <Th py={4}>Employee</Th>}
          <Th py={4}>Status</Th>
          <Th py={4}>Login Time</Th>
        </Tr>
      </Thead>
      <Tbody>
        {filteredAttendance.length > 0 ? (
          filteredAttendance.map(record => (
            <Tr key={record._id} _hover={{ bg: rowHoverBg }} transition="background 0.2s">
              <Td fontWeight="bold" color={headingColor}>
                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </Td>
              {isAdminOrOwner && (
                <Td fontWeight="bold" color="gray.600">{record.user?.name || 'Unknown'}</Td>
              )}
              <Td>
                <Badge bg={getStatusBadgeColor(record.status)} color="white" px={3} py={1} rounded="md" fontSize="xs" textTransform="uppercase" letterSpacing="widest">
                  {record.status}
                </Badge>
              </Td>
              <Td fontWeight="medium" color="gray.500">
                {record.loginTime ? new Date(record.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
              </Td>
            </Tr>
          ))
        ) : (
          <Tr>
            <Td colSpan={isAdminOrOwner ? 4 : 3} textAlign="center" py={10} color="gray.400" fontWeight="bold">
              No attendance records found.
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  </Box>
);
