import React, { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Text, SimpleGrid, Spinner, useColorModeValue, IconButton, Badge, Button } from '@chakra-ui/react';
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarCheck, CalendarX, CalendarClock } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';

export default function EmployeeAttendanceCalendar() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userName = location.state?.userName || 'Employee';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data } = await API.get(`/attendance/user/${userId}`);
        setRecords(data);
      } catch (err) {
        console.error("Failed to fetch attendance records");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [userId]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)

  // Pre-calculate month specific records to optimize
  const monthRecords = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        map[d.getDate()] = r;
      }
    });
    return map;
  }, [records, year, month]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const headingColor = useColorModeValue('gray.900', 'white');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  if (loading) {
    return (
      <Flex p={20} align="center" justify="center">
        <Spinner size="xl" color="brand.600" />
      </Flex>
    );
  }

  // Calculate Stats
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  Object.values(monthRecords).forEach(r => {
    if (r.status === 'present') presentCount++;
    if (r.status === 'absent') absentCount++;
    if (r.status === 'leave') leaveCount++;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'green.500';
      case 'absent': return 'red.500';
      case 'leave': return 'yellow.500';
      default: return 'gray.200';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'present': return 'green.50';
      case 'absent': return 'red.50';
      case 'leave': return 'yellow.50';
      default: return cardBg;
    }
  };

  return (
    <Box p={8} maxW="6xl" mx="auto">
      <Button leftIcon={<ArrowLeft size={16} />} variant="ghost" onClick={() => navigate('/attendance')} mb={6}>
        Back to Staff List
      </Button>

      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Text fontSize="3xl" fontWeight="black" color={headingColor} tracking="tight">
            Attendance Calendar
          </Text>
          <Text color="gray.500" fontWeight="bold" mt={1}>
            Viewing records for {userName}
          </Text>
        </Box>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
        <Flex bg={cardBg} p={4} rounded="xl" shadow="sm" border="1px solid" borderColor={borderColor} align="center" gap={4}>
          <Flex bg="green.100" p={3} rounded="lg" color="green.600"><CalendarCheck size={24}/></Flex>
          <Box>
            <Text fontSize="sm" fontWeight="bold" color="gray.500" textTransform="uppercase">Present Days</Text>
            <Text fontSize="2xl" fontWeight="black" color={headingColor}>{presentCount}</Text>
          </Box>
        </Flex>
        <Flex bg={cardBg} p={4} rounded="xl" shadow="sm" border="1px solid" borderColor={borderColor} align="center" gap={4}>
          <Flex bg="red.100" p={3} rounded="lg" color="red.600"><CalendarX size={24}/></Flex>
          <Box>
            <Text fontSize="sm" fontWeight="bold" color="gray.500" textTransform="uppercase">Absent Days</Text>
            <Text fontSize="2xl" fontWeight="black" color={headingColor}>{absentCount}</Text>
          </Box>
        </Flex>
        <Flex bg={cardBg} p={4} rounded="xl" shadow="sm" border="1px solid" borderColor={borderColor} align="center" gap={4}>
          <Flex bg="yellow.100" p={3} rounded="lg" color="yellow.600"><CalendarClock size={24}/></Flex>
          <Box>
            <Text fontSize="sm" fontWeight="bold" color="gray.500" textTransform="uppercase">Leave Days</Text>
            <Text fontSize="2xl" fontWeight="black" color={headingColor}>{leaveCount}</Text>
          </Box>
        </Flex>
      </SimpleGrid>

      <Box bg={cardBg} border="1px solid" borderColor={borderColor} rounded="2xl" overflow="hidden" shadow="sm" p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <IconButton icon={<ChevronLeft/>} onClick={handlePrevMonth} variant="outline" rounded="full" />
          <Text fontSize="xl" fontWeight="black" color={headingColor}>
            {currentDate.toLocaleString('default', { month: 'long' })} {year}
          </Text>
          <IconButton icon={<ChevronRight/>} onClick={handleNextMonth} variant="outline" rounded="full" />
        </Flex>

        <SimpleGrid columns={7} spacing={2} mb={2}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} textAlign="center" fontWeight="bold" color="gray.400" fontSize="xs" textTransform="uppercase">{day}</Text>
          ))}
        </SimpleGrid>

        <SimpleGrid columns={7} spacing={2}>
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <Box key={`empty-${i}`} />)}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const record = monthRecords[dayNum];
            
            return (
              <Flex 
                key={dayNum} 
                direction="column" 
                minH="80px" 
                p={2} 
                border="1px solid" 
                borderColor={record ? getStatusColor(record.status) : borderColor} 
                bg={record ? getStatusBg(record.status) : 'transparent'}
                rounded="lg"
                transition="all 0.2s"
              >
                <Text fontWeight="black" color={record ? headingColor : 'gray.400'} fontSize="sm">
                  {dayNum}
                </Text>
                {record && (
                  <Badge mt="auto" bg={getStatusColor(record.status)} color="white" fontSize="9px" rounded="md" alignSelf="flex-start" textTransform="uppercase">
                    {record.status}
                  </Badge>
                )}
                {record?.loginTime && record.status === 'present' && (
                  <Text fontSize="10px" color="gray.500" fontWeight="bold" mt={1}>
                    {new Date(record.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                  </Text>
                )}
              </Flex>
            );
          })}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
