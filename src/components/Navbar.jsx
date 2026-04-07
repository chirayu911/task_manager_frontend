import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, FolderKanban, Building2, Bell } from 'lucide-react';
import {
  Flex, Box, Menu, MenuButton, MenuList, MenuItem,
  Button, IconButton, Text, useColorModeValue
} from '@chakra-ui/react';
import API from '../api';

export default function Navbar({
  user, activeProjectId, setActiveProjectId, activeCompanyId, setActiveCompanyId
}) {
  const navigate = useNavigate();
  const [projectList, setProjectList] = useState([]);
  const [companyList, setCompanyList] = useState([]);

  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const isSystemAdmin = roleName === 'admin' || roleName === 'superadmin';

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await API.get('/projects');
      setProjectList(data || []);
      if (!activeProjectId && data && data.length > 0) {
        setActiveProjectId(data[0]._id);
      }
    } catch (err) {
      console.error("Navbar: Failed to load projects", err);
    }
  }, [activeProjectId, setActiveProjectId]);

  const fetchCompanies = useCallback(async () => {
    if (!isSystemAdmin) return;
    try {
      const { data } = await API.get('/company/all');
      setCompanyList(data || []);
      if (!activeCompanyId) setActiveCompanyId('all');
    } catch (err) {
      console.error("Navbar: Failed to load companies", err);
    }
  }, [isSystemAdmin, activeCompanyId, setActiveCompanyId]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      if (isSystemAdmin) fetchCompanies();
    }
  }, [user, fetchProjects, fetchCompanies, isSystemAdmin]);

  const activeProject = projectList.find(p => p._id === activeProjectId);
  const activeCompany = companyList.find(c => c._id === activeCompanyId);

  // Theme-aware colors
  const bg = useColorModeValue('white', 'gray.900');
  const border = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('brand.50', 'whiteAlpha.100');
  const hoverIconColor = useColorModeValue('brand.600', 'brand.300');
  const adminIconBg = useColorModeValue('purple.50', 'purple.900');
  const projectIconBg = useColorModeValue('brand.50', 'brand.900');
  const adminMenuBgActive = useColorModeValue('purple.50', 'whiteAlpha.100');
  const adminMenuColorActive = useColorModeValue('purple.500', 'purple.300');
  const adminMenuHoverBg = useColorModeValue('purple.50', 'whiteAlpha.100');
  const adminMenuHoverColor = useColorModeValue('purple.600', 'purple.300');

  return (
    <Flex
      as="nav"
      position="fixed" top="0" left="64" w="calc(100% - 16rem)" h="16" zIndex="100"
      bg={bg} borderBottom="1px solid" borderColor={border}
      align="center" justify="flex-end" px="6" gap="4"
      boxShadow="sm" transition="all 0.3s ease-in-out"
    >
      <Box h="8" w="1px" bg={border} mx="2" />

      {/* SYSTEM ADMIN ONLY: Company Selector */}
      {/* {isSystemAdmin && (
        <Menu autoSelect={false}>
          <MenuButton
            as={Button} variant="ghost" pl="2" pr="4" py="6" rounded="xl"
            _hover={{ bg: hoverBg, color: hoverIconColor, transform: 'translateY(-2px)' }}
            transition="all 0.2s"
          >
            <Flex align="center" gap="3">
              <Flex w="8" h="8" bg={adminIconBg} color="purple.500" rounded="lg" align="center" justify="center">
                <Building2 size={18} />
              </Flex>
              <Box textAlign="left" display={{ base: "none", sm: "block" }}>
                <Text fontSize="sm" fontWeight="bold" lineHeight="none">
                  {activeCompanyId === 'all' ? 'All Companies' : (activeCompany ? activeCompany.companyName : 'Select Company')}
                </Text>
              </Box>
              <ChevronDown size={16} />
            </Flex>
          </MenuButton>

          <MenuList
            minW="280px" rounded="2xl" shadow="2xl" border="1px" borderColor={border} p="2"
            animation="slideInBottom 0.2s ease-out"
          >
            <Box px="4" py="2" borderBottom="1px" borderColor={border} mb="2">
              <Text fontSize="10px" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest">
                Available Organizations
              </Text>
            </Box>

            <MenuItem
              onClick={() => setActiveCompanyId('all')}
              rounded="xl" py="3" px="4" mb="1"
              bg={activeCompanyId === 'all' ? adminMenuBgActive : 'transparent'}
              color={activeCompanyId === 'all' ? adminMenuColorActive : 'inherit'}
              _hover={{ bg: adminMenuHoverBg, color: adminMenuHoverColor, transform: 'translateX(4px)' }}
              transition="all 0.2s" fontWeight="bold"
            >
              Global (All Companies)
            </MenuItem>

            {companyList.map((company) => (
              <MenuItem
                key={company._id}
                onClick={() => setActiveCompanyId(company._id)}
                rounded="xl" py="3" px="4" mb="1"
                bg={activeCompanyId === company._id ? adminMenuBgActive : 'transparent'}
                color={activeCompanyId === company._id ? adminMenuColorActive : 'inherit'}
                _hover={{ bg: adminMenuHoverBg, color: adminMenuHoverColor, transform: 'translateX(4px)' }}
                transition="all 0.2s" fontWeight="bold"
              >
                {company.companyName}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      )} */}

      {/* Project Selector */}
      <Menu autoSelect={false}>
        <MenuButton
          as={Button} variant="ghost" pl="2" pr="4" py="6" rounded="xl"
          _hover={{ bg: hoverBg, color: hoverIconColor, transform: 'translateY(-2px)' }}
          transition="all 0.2s"
        >
          <Flex align="center" gap="3">
            <Flex w="8" h="8" bg={projectIconBg} color="brand.500" rounded="lg" align="center" justify="center">
              <FolderKanban size={18} />
            </Flex>
            <Box textAlign="left" display={{ base: "none", sm: "block" }}>
              <Text fontSize="sm" fontWeight="bold" lineHeight="none">
                {activeProject ? activeProject.title : 'Select Project'}
              </Text>
              {activeProject && (
                <Text fontSize="10px" color="gray.400" textTransform="uppercase" letterSpacing="widest" mt="1">
                  Active Project
                </Text>
              )}
            </Box>
            <ChevronDown size={16} />
          </Flex>
        </MenuButton>

        <MenuList
          minW="280px" rounded="2xl" shadow="2xl" border="1px" borderColor={border} p="2"
        >
          <Flex px="4" py="2" justify="space-between" align="center" borderBottom="1px" borderColor={border} mb="2">
            <Text fontSize="10px" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest">
              Available Projects
            </Text>
            <Text as={Link} to="/projects" fontSize="10px" color="brand.500" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
              Manage All
            </Text>
          </Flex>

          {projectList.length > 0 ? (
            projectList.map((project) => (
              <MenuItem
                key={project._id}
                onClick={() => setActiveProjectId(project._id)}
                rounded="xl" py="3" px="4" mb="1"
                bg={activeProjectId === project._id ? hoverBg : 'transparent'}
                color={activeProjectId === project._id ? 'brand.500' : 'inherit'}
                _hover={{ bg: hoverBg, color: hoverIconColor, transform: 'translateX(4px)' }}
                transition="all 0.2s" fontWeight="bold"
              >
                {project.title}
              </MenuItem>
            ))
          ) : (
            <Box px="4" py="8" textAlign="center">
              <Text fontSize="xs" color="gray.400" fontStyle="italic">No active projects</Text>
            </Box>
          )}
        </MenuList>
      </Menu>

      <Box position="relative">
        <IconButton
          icon={<Bell size={20} />}
          variant="ghost" rounded="xl"
          color="gray.500"
          _hover={{ bg: hoverBg, color: hoverIconColor, transform: 'rotate(15deg) scale(1.1)' }}
          transition="all 0.2s"
          onClick={() => navigate('/activity')}
          aria-label="Activity Log"
        />
        <Box
          position="absolute" top="2" right="2" w="2" h="2"
          bg="brand.500" rounded="full" border="2px solid" borderColor={bg}
        />
      </Box>

    </Flex>
  );
}