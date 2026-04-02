import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Flex, Box, Select, Button, IconButton, useColorModeValue } from '@chakra-ui/react';

export default function TableControls({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  onLimitChange 
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const bg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.100', 'gray.800');
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const selectBg = useColorModeValue('white', 'gray.800');
  
  if (totalItems === 0) return null;

  const handlePageClick = (page) => {
    onPageChange(page); 
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    // Always show Page 1
    pageNumbers.push(renderButton(1));

    // Add ellipsis after Page 1 if there's a gap
    if (start > 2) {
      pageNumbers.push(<Box key="dots-start" px={1} color={textColor}>...</Box>);
    }

    // Render the window (Previous, Current, Next)
    for (let i = start; i <= end; i++) {
      pageNumbers.push(renderButton(i));
    }

    // Add ellipsis before Last Page if there's a gap
    if (end < totalPages - 1) {
      pageNumbers.push(<Box key="dots-end" px={1} color={textColor}>...</Box>);
    }

    // Always show Last Page (if it's not Page 1)
    if (totalPages > 1) {
      pageNumbers.push(renderButton(totalPages));
    }

    return pageNumbers;
  };

  const renderButton = (num) => (
    <Button
      key={num}
      onClick={() => handlePageClick(num)}
      size="sm"
      minW={8} h={8} p={0}
      rounded="lg"
      fontWeight="bold"
      colorScheme={currentPage === num ? 'brand' : 'gray'}
      variant={currentPage === num ? 'solid' : 'ghost'}
      shadow={currentPage === num ? 'sm' : 'none'}
    >
      {num}
    </Button>
  );

  return (
    <Flex 
      px={6} py={4} bg={bg} borderTop="1px solid" borderColor={borderColor}
      direction={{ base: 'column', sm: 'row' }} align="center" justify="space-between" gap={4}
    >
      <Flex align="center" gap={2} fontSize="sm" color={textColor} fontWeight="medium">
        <Box as="span">Show</Box>
        <Select 
          value={itemsPerPage}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          size="sm"
          w="fit-content"
          rounded="lg"
          focusBorderColor="brand.500"
          bg={selectBg}
        >
          {[5, 10, 20, 50].map(num => <option key={num} value={num}>{num}</option>)}
        </Select>
        <Box as="span">entries</Box>
      </Flex>

      <Flex align="center" gap={2}>
        <IconButton
          icon={<ChevronLeft size={16} />}
          onClick={() => handlePageClick(currentPage - 1)}
          isDisabled={currentPage === 1}
          size="sm"
          rounded="lg"
          variant="outline"
          aria-label="Previous Page"
        />
        
        <Flex align="center" gap={1}>
          {renderPageNumbers()}
        </Flex>

        <IconButton
          icon={<ChevronRight size={16} />}
          onClick={() => handlePageClick(currentPage + 1)}
          isDisabled={currentPage === totalPages}
          size="sm"
          rounded="lg"
          variant="outline"
          aria-label="Next Page"
        />
      </Flex>
    </Flex>
  );
}