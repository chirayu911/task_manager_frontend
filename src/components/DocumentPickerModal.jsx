import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  VStack, Text, Flex, Input, Spinner, useColorModeValue, Box, Badge, Button,
  Icon
} from '@chakra-ui/react';
import { Search, FileText, Folder } from 'lucide-react';
import API from '../api';

export default function DocumentPickerModal({ isOpen, onClose, onSelect, currentProjectId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const hoverBg = useColorModeValue('brand.50', 'gray.700');
  const searchBg = useColorModeValue('gray.100', 'gray.800');

  useEffect(() => {
    if (!isOpen) return;

    const fetchDocuments = async () => {
      setLoading(true);
      try {
        // If we have a project ID (project chat), we could just fetch that project's docs
        // But the requirement says "uploaded docs has already uploaded document in the project" 
        // and "personal chat can access all the document of the sender from all the projects they are in"
        // So I'll use the new /user-docs endpoint.
        const { data } = await API.get('/documents/user-docs');
        setDocuments(data);
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [isOpen]);

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.project?.title && doc.project.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="80vh">
        <ModalHeader>Select Document</ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6} display="flex" flexDirection="column">
          <Flex align="center" bg={searchBg} p={2} rounded="lg" mb={4}>
            <Search size={18} color="gray" />
            <Input
              variant="unstyled"
              placeholder="Search by title or project..."
              ml={2}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Flex>

          <VStack align="stretch" spacing={2} overflowY="auto" flex="1" pr={2}>
            {loading ? (
              <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>
            ) : filteredDocs.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={10}>No documents found.</Text>
            ) : (
              filteredDocs.map(doc => (
                <Flex
                  key={doc._id}
                  align="center"
                  gap={3}
                  p={3}
                  rounded="lg"
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => onSelect(doc)}
                  border="1px solid"
                  borderColor="gray.100"
                  transition="all 0.2s"
                >
                  <Box p={2} bg="blue.50" rounded="md">
                    <Icon as={FileText} color="blue.500" />
                  </Box>
                  <Box flex="1">
                    <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{doc.title}</Text>
                    <Flex align="center" gap={2} mt={1}>
                      <Icon as={Folder} size={12} color="gray.400" />
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {doc.project?.title || 'Unknown Project'}
                      </Text>
                    </Flex>
                  </Box>
                  <Badge colorScheme={doc.fileType === 'TEXT' ? 'green' : 'orange'} fontSize="xs">
                    {doc.fileType}
                  </Badge>
                  <Button size="xs" colorScheme="brand" variant="ghost">Select</Button>
                </Flex>
              ))
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
