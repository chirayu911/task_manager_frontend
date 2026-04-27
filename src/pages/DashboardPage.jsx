import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Box, Flex, Text, SimpleGrid, useColorModeValue, Spinner, VStack, Badge } from '@chakra-ui/react';
import { CalendarCheck, CalendarX, CalendarClock, Activity } from 'lucide-react';
import API from '../api';
import UsageCard from '../components/UsageCard';

export default function DashboardPage({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/dashboard/stats');
        setStats(data);
      } catch (err) {
        console.error("Stats fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const headingColor = useColorModeValue('gray.900', 'white');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  if (loading) {
    return (
      <Flex p={20} flexDir="column" align="center" justify="center" gap={4}>
        <Spinner size="xl" color="brand.600" thickness="4px" />
        <Text fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest" fontSize="xs">
          Loading Dashboard...
        </Text>
      </Flex>
    );
  }

  const { attendance, tasksByStatus, recentTasks } = stats || {};

  const present = attendance?.present || 0;
  const absent = attendance?.absent || 0;
  const leave = attendance?.leave || 0;
  const totalDays = attendance?.totalDays || 0;
  const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

  const CHART_COLORS = ['#3182CE', '#48BB78', '#F6E05E', '#ED8936', '#E53E3E', '#9F7AEA', '#38B2AC', '#F687B3'];
  const getStatusColor = (statusObj) => {
    if (!statusObj) return 'gray';
    if (statusObj.color) return statusObj.color;
    
    // Fallback: match index securely so the badge matches the pie chart natively
    const statusIndex = tasksByStatus?.findIndex(s => s.statusName === (statusObj.name || statusObj.statusName));
    if (statusIndex !== -1 && statusIndex !== undefined) {
      return CHART_COLORS[statusIndex % CHART_COLORS.length];
    }
    return 'gray';
  };

  return (
    <Box p={8} transition="colors 0.3s">
      <Flex justify="space-between" align={{ base: "flex-start", md: "flex-end" }} direction={{ base: "column", md: "row" }} mb={8} gap={4}>
        <Box>
          <Text fontSize="3xl" fontWeight="black" color={headingColor} tracking="tight">
            Welcome back, {user?.name.split(' ')[0]}!
          </Text>
          <Text color="gray.500" fontWeight="bold" mt={1}>
            Here's what's happening today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </Box>
      </Flex>

      {/* Attendance Summary */}
      <Text fontSize="xl" fontWeight="black" color={headingColor} mb={4}>This Month's Attendance</Text>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <UsageCard title="Present Days" current={present} Maxlimit={totalDays || 1} icon={CalendarCheck} />
        <UsageCard title="Absent Days" current={absent} Maxlimit={totalDays || 1} icon={CalendarX} />
        <UsageCard title="Leave Days" current={leave} Maxlimit={totalDays || 1} icon={CalendarClock} />
        <UsageCard title="Attendance Rate" current={attendanceRate} Maxlimit={100} icon={Activity} />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
        {/* Task Pie Chart */}
        <Box bg={cardBg} p={6} rounded="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="black" color={headingColor} mb={6}>Your Tasks by Status</Text>
          <Box h="300px">
            {tasksByStatus?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksByStatus}
                    dataKey="count"
                    nameKey="statusName"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                  >
                    {tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Flex h="full" align="center" justify="center">
                <Text color="gray.400" fontWeight="bold">No tasks found</Text>
              </Flex>
            )}
          </Box>
        </Box>

        {/* Recent Tasks */}
        <Box bg={cardBg} p={6} rounded="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="black" color={headingColor} mb={6}>Recent Tasks</Text>
          <VStack align="stretch" spacing={4}>
            {recentTasks?.length > 0 ? (
              recentTasks.map(task => (
                <Flex key={task._id} align="center" justify="space-between" p={3} _hover={{ bg: hoverBg }} rounded="xl" transition="background 0.2s">
                  <Box>
                    <Text fontWeight="bold" color={headingColor} noOfLines={1}>{task.title}</Text>
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>
                  <Flex gap={2}>
                    {task.priority && (
                      <Badge bg={task.priority.color} color="white" px={2} py={1} rounded="md" fontSize="xs">
                        {task.priority.name}
                      </Badge>
                    )}
                    {task.status && (
                      <Badge bg={getStatusColor(task.status)} color="white" px={2} py={1} rounded="md" fontSize="xs">
                        {task.status.name}
                      </Badge>
                    )}
                  </Flex>
                </Flex>
              ))
            ) : (
              <Flex h="full" align="center" justify="center" py={10}>
                <Text color="gray.400" fontWeight="bold">You have no tasks yet.</Text>
              </Flex>
            )}
          </VStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
