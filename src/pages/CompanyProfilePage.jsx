import React, { useEffect, useState, useCallback } from 'react';

import API from '../api';
import { Building2, Mail, MapPin, Trash2, CreditCard } from 'lucide-react';
import {
  Box, Flex, Text, Table, Thead, Tbody, Tr, Th, Td, IconButton, Badge, useColorModeValue, Icon, Spinner
} from '@chakra-ui/react';
import ConfirmModal from '../components/ConfirmModal';
import Notification from '../components/Notification';

export default function CompanyProfilePage({ setActiveCompanyId }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  // HORRIBLE MISTAKE AVERTED! Hooks must absolutely be at the top level BEFORE any early returns.
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('brand.50', 'whiteAlpha.50');
  const headingColor = useColorModeValue('gray.900', 'white');
  const theadBg = useColorModeValue('gray.50', 'gray.900');
  const iconBg = useColorModeValue('brand.50', 'brand.900');
  const subPlanColor = useColorModeValue('gray.700', 'gray.300');
  const emailColor = useColorModeValue('gray.600', 'gray.400');
  const emptyIconColor = useColorModeValue('gray.200', 'gray.700');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/company/all');
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching all companies:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openDeleteModal = (id) => {
    setCompanyToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/company/${companyToDelete}`);
      setCompanies(prev => prev.filter(c => c._id !== companyToDelete));
      setNotification({ type: 'success', message: 'Organization deleted successfully' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete organization' });
    } finally {
      setIsDeleteModalOpen(false);
      setCompanyToDelete(null);
    }
  };

  if (loading) {
    return (
      <Flex p={20} flexDir="column" align="center" justify="center" gap={4}>
        <Spinner size="xl" color="brand.600" thickness="4px" />
        <Text fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest" fontSize="xs">
          Accessing Database...
        </Text>
      </Flex>
    );
  }

  return (
    <Box p={8} transition="colors 0.3s">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <Box mb={8}>
        <Text fontSize="3xl" fontWeight="black" color={headingColor} tracking="tight">
          Registered Companies
        </Text>
        <Text color="gray.500" fontWeight="bold" textTransform="uppercase" fontSize="xs" tracking="widest" mt={1}>
          System-wide organization overview & subscription management
        </Text>
      </Box>

      <Box bg={bg} rounded="2xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
        <Box overflowX="auto">
          <Table variant="simple" size="md">
            <Thead bg={theadBg}>
              <Tr>
                <Th color="gray.400" fontSize="10px" fontWeight="black" tracking="widest">Company Name</Th>
                <Th color="gray.400" fontSize="10px" fontWeight="black" tracking="widest">Subscription</Th>
                <Th color="gray.400" fontSize="10px" fontWeight="black" tracking="widest">Contact</Th>
                <Th color="gray.400" fontSize="10px" fontWeight="black" tracking="widest">Address</Th>
                <Th color="gray.400" fontSize="10px" fontWeight="black" tracking="widest" isNumeric>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {companies.map((comp) => (
                <Tr
                  key={comp._id}
                  _hover={{ bg: hoverBg }}
                  transition="all 0.2s"
                  borderColor={borderColor}
                >
                  <Td px={5} py={4}>
                    <Flex align="center" gap={3}>
                      <Flex p={2.5} bg={iconBg} color="brand.600" rounded="xl" align="center" justify="center" transition="transform 0.2s" _hover={{ transform: 'scale(1.1)' }}>
                        <Icon as={Building2} boxSize={5} />
                      </Flex>
                      <Flex direction="column">
                        <Text fontWeight="bold" color={headingColor}>{comp.companyName}</Text>
                        <Text fontSize="10px" color="gray.400" fontWeight="medium" fontStyle="italic">
                          ID: {comp._id.slice(-6)}
                        </Text>
                      </Flex>
                    </Flex>
                  </Td>

                  <Td px={5} py={4}>
                    <Flex direction="column" gap={1}>
                      <Flex align="center" gap={1.5}>
                        <Icon as={CreditCard} boxSize={3.5} color="brand.500" />
                        <Text fontSize="sm" fontWeight="black" color={subPlanColor}>
                          {comp.subscriptionPlan?.name || 'No Plan'}
                        </Text>
                      </Flex>
                      <Badge
                        colorScheme={comp.subscriptionStatus === 'active' ? 'green' : 'red'}
                        w="fit-content" fontSize="10px" fontWeight="bold" px={2} py={0.5} rounded="md"
                      >
                        {comp.subscriptionStatus || 'Inactive'}
                      </Badge>
                    </Flex>
                  </Td>

                  <Td px={5} py={4}>
                    <Flex direction="column" gap={1} color={emailColor} fontSize="sm" fontWeight="medium">
                      <Flex align="center" gap={2}>
                        <Icon as={Mail} boxSize={3.5} color="gray.400" />
                        <Text>{comp.companyEmail}</Text>
                      </Flex>
                      <Text fontSize="xs" color="gray.400" ml={5}>{comp.industry || 'General'}</Text>
                    </Flex>
                  </Td>

                  <Td px={5} py={4}>
                    <Flex align="flex-start" gap={2} maxW="200px">
                      <Icon as={MapPin} boxSize={3.5} color="gray.400" mt={1} flexShrink={0} />
                      <Text fontSize="xs" color="gray.500" fontWeight="medium" lineHeight="tight">
                        {comp.fullAddress || 'Address not set'}
                      </Text>
                    </Flex>
                  </Td>

                  <Td px={5} py={4} isNumeric>
                    <IconButton
                      icon={<Trash2 size={18} />}
                      onClick={() => openDeleteModal(comp._id)}
                      colorScheme="red" variant="ghost" rounded="xl"
                      aria-label="Delete Organization"
                      _hover={{ bg: 'red.500', color: 'white' }}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {companies.length === 0 && (
          <Flex p={24} direction="column" align="center" justify="center">
            <Icon as={Building2} boxSize={16} color={emptyIconColor} mb={4} />
            <Text color="gray.400" fontWeight="black" textTransform="uppercase" tracking="widest" fontSize="sm">
              No organizations found
            </Text>
          </Flex>
        )}
      </Box>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Organization"
        message="Are you sure? This will remove all data associated with this company. This action cannot be undone."
      />
    </Box>
  );
}