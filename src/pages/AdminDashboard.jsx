import React, { useState, useEffect } from 'react';
import { Users, FolderKanban, ClipboardList, FileText, Zap } from 'lucide-react';
import { Box, Flex, Text, SimpleGrid, useColorModeValue, Icon, Spinner } from '@chakra-ui/react';
import API from '../api';
import UsageCard from '../components/UsageCard';

export default function AdminDashboard({ user }) {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { data } = await API.get('/company/usage');
        setUsage(data);
      } catch (err) {
        console.error("Stats fetch failed");
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  const headingColor = useColorModeValue('gray.900', 'white');
  const badgeBg = useColorModeValue('brand.600', 'brand.500');

  if (loading) {
    return (
      <Flex p={20} flexDir="column" align="center" justify="center" gap={4}>
        <Spinner size="xl" color="brand.600" thickness="4px" />
        <Text fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest" fontSize="xs">
          Loading Analytics...
        </Text>
      </Flex>
    );
  }

  return (
    <Box p={8} transition="colors 0.3s">
      <Flex justify="space-between" align={{ base: "flex-start", md: "flex-end" }} direction={{ base: "column", md: "row" }} mb={8} gap={4}>
        <Box>
          <Text fontSize="3xl" fontWeight="black" color={headingColor} tracking="tight">
            Workspace Overview
          </Text>
          <Text color="gray.500" fontWeight="bold" mt={1}>
            Real-time subscription usage for your organization.
          </Text>
        </Box>
        <Flex
          bg={badgeBg} color="white" px={4} py={2} rounded="xl" align="center" gap={2}
          shadow="lg"
        >
          <Icon as={Zap} boxSize={5} />
          <Text fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">
            {usage?.planName || 'Standard'} Plan
          </Text>
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <UsageCard
          title="Staff Members"
          current={usage?.staff?.current || 0}
          Maxlimit={usage?.staff?.max || 0}
          icon={Users}
        />
        <UsageCard
          title="Total Projects"
          current={usage?.projects?.current || 0}
          Maxlimit={usage?.projects?.max || 0}
          icon={FolderKanban}
        />
        <UsageCard
          title="Active Tasks"
          current={usage?.tasks?.current || 0}
          Maxlimit={usage?.tasks?.max || 0}
          icon={ClipboardList}
        />
        <UsageCard
          title="Documents"
          current={usage?.documents?.current || 0}
          Maxlimit={usage?.documents?.max || 0}
          icon={FileText}
        />
      </SimpleGrid>

      {/* Rest of your dashboard (Charts, Recent Activity, etc.) */}
    </Box>
  );
}