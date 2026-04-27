import React from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, VStack, Text, Flex, Icon, useColorModeValue, Box
} from '@chakra-ui/react';
import { Folder } from 'lucide-react';

export default function ProjectSelectorModal({ isOpen, onClose, projects, onSelect }) {
  const hoverBg = useColorModeValue('brand.50', 'gray.700');
  const border = useColorModeValue('gray.100', 'gray.700');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Select Project</ModalHeader>
        <ModalBody>
          <Text fontSize="sm" color="gray.500" mb={4}>
            Please select which project this document should be uploaded to. Both you and the receiver must be members of the project.
          </Text>
          <VStack align="stretch" spacing={2}>
            {projects.map(project => (
              <Flex
                key={project._id}
                align="center"
                gap={3}
                p={4}
                rounded="lg"
                cursor="pointer"
                border="1px solid"
                borderColor={border}
                _hover={{ bg: hoverBg, borderColor: 'brand.200' }}
                onClick={() => onSelect(project._id)}
                transition="all 0.2s"
              >
                <Icon as={Folder} color="brand.500" />
                <Box>
                  <Text fontWeight="bold" fontSize="sm">{project.title}</Text>
                </Box>
              </Flex>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
