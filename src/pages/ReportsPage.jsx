import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, useColorModeValue, Spinner,
  Tabs, TabList, TabPanels, Tab, TabPanel, SimpleGrid, Icon
} from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { PieChart, ListChecks, AlertTriangle } from 'lucide-react';
import API from '../api';

export default function ReportsPage({ activeProjectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    async function fetchReports() {
      if (!activeProjectId) {
         setLoading(false);
         return;
      }
      setLoading(true);
      try {
        const res = await API.get(`/reports/dashboard?projectId=${activeProjectId}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [activeProjectId]);

  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (!activeProjectId) {
    return (
      <Flex h="100vh" align="center" justify="center" direction="column" gap={4}>
        <Icon as={PieChart} size={64} opacity={0.2} boxSize="100px" />
        <Text color={textColor} fontWeight="bold" fontSize="lg">Please select a project from the top navigation bar</Text>
        <Text color={textColor} fontSize="sm">Reports are generated specifically for individual projects.</Text>
      </Flex>
    );
  }

  if (!data) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Text color="red.500">Failed to load reports data.</Text>
      </Flex>
    );
  }

  return (
    <Box p={6} maxW="7xl" mx="auto">
      <Heading size="lg" mb={2} display="flex" alignItems="center" gap={3}>
        <Icon as={PieChart} color="brand.500" /> 
        Company Reports
      </Heading>
      <Text color={textColor} mb={8}>
        A high-level graphical representation of project tasks and issues across your organization.
      </Text>

      <Tabs isFitted colorScheme="brand" variant="enclosed">
        <TabList mb="1em" borderBottomColor={border}>
          <Tab _selected={{ color: 'white', bg: 'brand.500', borderColor: 'brand.500' }} fontWeight="bold" roundedTop="md">
            <Icon as={ListChecks} mr={2} /> Tasks Overview
          </Tab>
          <Tab _selected={{ color: 'white', bg: 'red.500', borderColor: 'red.500' }} fontWeight="bold" roundedTop="md">
            <Icon as={AlertTriangle} mr={2} /> Issues Overview
          </Tab>
        </TabList>

        <TabPanels>
          {/* TASKS TAB */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
              {/* Task Status Bar Chart */}
              <Box bg={bg} p={6} rounded="2xl" border="1px solid" borderColor={border} shadow="sm">
                <Text fontWeight="bold" fontSize="lg" mb={4}>Tasks by Status</Text>
                <Box h="350px" w="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.statusCounts?.Task || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                      <Legend />
                      <Bar dataKey="count" name="Number of Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              {/* Task Timeline Area Chart */}
              <Box bg={bg} p={6} rounded="2xl" border="1px solid" borderColor={border} shadow="sm">
                <Text fontWeight="bold" fontSize="lg" mb={4}>Active Tasks Trend (Burn-down)</Text>
                <Box h="350px" w="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.timeline || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" fontSize={12} tickLine={false} />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                      <Legend />
                      <Area type="monotone" dataKey="ActiveTasks" name="Active Tasks Over Time" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </SimpleGrid>
          </TabPanel>

          {/* ISSUES TAB */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
              {/* Issue Status Bar Chart */}
              <Box bg={bg} p={6} rounded="2xl" border="1px solid" borderColor={border} shadow="sm">
                <Text fontWeight="bold" fontSize="lg" mb={4}>Issues by Status</Text>
                <Box h="350px" w="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.statusCounts?.Issue || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                      <Legend />
                      <Bar dataKey="count" name="Number of Issues" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              {/* Issue Timeline Area Chart */}
              <Box bg={bg} p={6} rounded="2xl" border="1px solid" borderColor={border} shadow="sm">
                <Text fontWeight="bold" fontSize="lg" mb={4}>Active Issues Trend (Burn-down)</Text>
                <Box h="350px" w="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.timeline || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" fontSize={12} tickLine={false} />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                      <Legend />
                      <Area type="monotone" dataKey="ActiveIssues" name="Active Issues Over Time" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorIssues)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </SimpleGrid>
          </TabPanel>

        </TabPanels>
      </Tabs>
    </Box>
  );
}
