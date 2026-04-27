import React from 'react';
import { Box, Flex, Text, Icon, Progress, Badge, useColorModeValue } from '@chakra-ui/react';

export default function UsageCard({ title, current, Maxlimit, icon }) {
  const isUnlimited = Maxlimit === -1 || Maxlimit === undefined;
  // Make sure we handle 0 limits to avoid NaN division
  const divisor = Maxlimit && Maxlimit > 0 ? Maxlimit : 1; 
  const percentage = isUnlimited ? 0 : Math.min((current / divisor) * 100, 100);
  
  const getProgressColor = () => {
    if (percentage < 90) return 'brand';
    if (percentage < 70) return 'brand';
    return 'brand';
  };

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const iconBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.900', 'white');
  const progressBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box 
      bg={bg} p={6} rounded="2xl" border="1px solid" borderColor={borderColor}
      shadow="sm" transition="all 0.2s" _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
    >
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Flex p={2} bg={iconBg} color="brand.600" rounded="lg" align="center" justify="center">
          <Icon as={icon} boxSize={5} />
        </Flex>
        <Box textAlign="right">
          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="widest">
            {title}
          </Text>
          <Text fontSize="xl" fontWeight="black" color={headingColor}>
            {current} <Text as="span" fontSize="sm" color="gray.400" fontWeight="medium">/ {isUnlimited ? '∞' : Maxlimit}</Text>
          </Text>
        </Box>
      </Flex>

      {!isUnlimited && (
        <Box>
          <Progress 
            value={percentage} 
            colorScheme={getProgressColor()} 
            size="sm" 
            rounded="full" 
            bg={progressBg}
            mb={2}
          />
          <Flex justify="space-between" align="center" fontSize="10px" fontWeight="black" textTransform="uppercase" letterSpacing="widest">
            <Text color={percentage < 70 ? 'gray.400' : 'brand.500'}>
              Usage Status ({percentage.toFixed(0)}%)
            </Text>
            {percentage >= 85 && (
              <Flex align="center" gap={1} color="grey.500">
                <Box w={1} h={1} bg="grey.500" rounded="full" animation="pulse 1.5s infinite" />
                Limit Near!
              </Flex>
            )}
          </Flex>
        </Box>
      )}

      {isUnlimited && (
        <Box pt={2}>
          <Badge colorScheme="green" px={2} py={1} rounded="md" fontSize="10px" fontWeight="black" textTransform="uppercase">
            Unlimited Access
          </Badge>
        </Box>
      )}
    </Box>
  );
}