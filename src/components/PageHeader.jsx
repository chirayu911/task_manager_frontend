import React from 'react';
import { Button, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { Plus, Search } from 'lucide-react';

export const CreateButton = ({ onClick, label, icon: Icon = Plus, colorScheme = "brand", ...props }) => {
  return (
    <Button 
      onClick={onClick} 
      colorScheme={colorScheme}
      leftIcon={<Icon size={18} />}
      size="md"
      rounded="xl"
      shadow="lg"
      {...props}
    >
      {label}
    </Button>
  );
};

export const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <InputGroup maxW="sm" w="full">
    <InputLeftElement pointerEvents="none">
      <Search size={18} color="gray.400" />
    </InputLeftElement>
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rounded="xl"
      focusBorderColor="brand.500"
      bg="white"
      _dark={{ bg: "gray.900", borderColor: "gray.700" }}
    />
  </InputGroup>
);