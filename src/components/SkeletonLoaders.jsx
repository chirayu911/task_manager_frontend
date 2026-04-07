import React from 'react';
import {
  Skeleton, SkeletonText, SkeletonCircle, Box, Stack, Flex, SimpleGrid,
  useColorModeValue, Table, Thead, Tbody, Tr, Th, Td
} from '@chakra-ui/react';

/**
 * TableSkeleton: Mimics a standard data table with a header and several rows.
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box bg={bg} rounded="2xl" shadow="sm" border="1px solid" borderColor={border} overflow="hidden">
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
            <Tr>
              {[...Array(columns)].map((_, i) => (
                <Th key={i} py={5}>
                  <Skeleton h="12px" w={`${40 + Math.random() * 40}%`} />
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {[...Array(rows)].map((_, rowIndex) => (
              <Tr key={rowIndex}>
                {[...Array(columns)].map((_, colIndex) => (
                  <Td key={colIndex} py={4}>
                    <Skeleton h="15px" w={`${60 + Math.random() * 30}%`} rounded="md" />
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

/**
 * CardSkeleton: Mimics a dashboard card or project card.
 */
export const CardSkeleton = () => {
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box p={6} bg={bg} rounded="2xl" border="1px solid" borderColor={border} shadow="sm">
      <Flex align="center" gap={3} mb={4}>
        <SkeletonCircle size="10" />
        <Box flex="1">
          <Skeleton h="14px" w="60%" mb={2} />
          <Skeleton h="10px" w="40%" />
        </Box>
      </Flex>
      <SkeletonText noOfLines={3} spacing="4" skeletonHeight="2" />
      <Flex mt={6} justify="space-between" align="center">
        <Skeleton h="20px" w="80px" rounded="full" />
        <Skeleton h="20px" w="40px" rounded="md" />
      </Flex>
    </Box>
  );
};

/**
 * ChartSkeleton: Mimics a graphical report section.
 */
export const ChartSkeleton = () => {
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.100', 'gray.700');
  const startColor = useColorModeValue('brand.50', 'brand.900');
  const endColor = useColorModeValue('brand.100', 'brand.800');

  return (
    <Box bg={bg} p={6} rounded="2xl" border="1px solid" borderColor={border} shadow="sm">
      <Skeleton h="20px" w="180px" mb={6} />
      <Box h="300px" w="100%" position="relative" display="flex" alignItems="flex-end" gap={4} px={4}>
        {[...Array(8)].map((_, i) => (
          <Skeleton
            key={i}
            flex="1"
            h={`${20 + Math.random() * 70}%`}
            roundedTop="md"
            startColor={startColor}
            endColor={endColor}
          />
        ))}
      </Box>
      <Flex mt={6} gap={4} justify="center">
        <Skeleton h="12px" w="40px" />
        <Skeleton h="12px" w="40px" />
        <Skeleton h="12px" w="40px" />
      </Flex>
    </Box>
  );
};

/**
 * FormSkeleton: Mimics input fields and labels for creation/edit pages.
 */
export const FormSkeleton = () => {
  return (
    <Stack spacing={6}>
      {[...Array(4)].map((_, i) => (
        <Box key={i}>
          <Skeleton h="12px" w="100px" mb={3} />
          <Skeleton h="45px" w="100%" rounded="lg" />
        </Box>
      ))}
      <Flex justify="flex-end" gap={3} mt={4}>
        <Skeleton h="40px" w="100px" rounded="xl" />
        <Skeleton h="40px" w="120px" rounded="xl" />
      </Flex>
    </Stack>
  );
};

/**
 * PageHeaderSkeleton: Mimics the top part of most pages.
 */
export const PageHeaderSkeleton = () => {
  return (
    <Box mb={8}>
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Skeleton h="32px" w="250px" mb={2} />
          <Skeleton h="14px" w="400px" />
        </Box>
        <Skeleton h="45px" w="150px" rounded="xl" />
      </Flex>
      <Skeleton h="50px" w="350px" rounded="2xl" />
    </Box>
  );
};

/**
 * AppInitializationSkeleton: Mimics a generic app shell while verifying session.
 */
export const AppInitializationSkeleton = () => {
  return (
    <Flex h="100vh" w="100%" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Sidebar Placeholder */}
      <Box w="280px" h="100%" borderRight="1px" borderColor={useColorModeValue('gray.100', 'gray.800')} p={6} display={{ base: 'none', lg: 'block' }}>
        <SkeletonCircle size="12" mb={10} />
        <Stack spacing={8}>
          {[...Array(6)].map((_, i) => (
            <Flex key={i} align="center" gap={3}>
              <SkeletonCircle size="6" />
              <Skeleton h="14px" w="120px" rounded="md" />
            </Flex>
          ))}
        </Stack>
      </Box>

      {/* Content Placeholder */}
      <Box flex="1" p={{ base: 6, lg: 10 }}>
        <Flex justify="flex-end" mb={10}>
          <SkeletonCircle size="10" />
        </Flex>
        <PageHeaderSkeleton />
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8} mt={10}>
          <TableSkeleton />
          <ChartSkeleton />
        </SimpleGrid>
      </Box>
    </Flex>
  );
};
