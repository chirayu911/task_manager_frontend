import React, { useMemo, useState, useEffect } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import API from '../api';
import {
  LayoutDashboard, Users, ClipboardList, ShieldPlus, Folder,
  LogOut, Settings, ChevronUp, ChevronDown, FolderKanban,
  AlertTriangle, Briefcase, CreditCard, FileText, MonitorPlay, Building2,
  Server, MessageSquare, PieChart
} from "lucide-react";
import {
  Flex, Box, Text, VStack, Collapse, Icon, useColorModeValue, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Button, Image, Badge
} from "@chakra-ui/react";
import ConfirmModal from "./ConfirmModal";
import EditProfileModal from "./EditProfileModal";

export default function Sidebar({ user, handleLogout }) {
  const location = useLocation();

  const getProfilePicUrl = (path) => {
    if (!path) return '';
    const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
    return `${baseUrl}/${cleanPath}`;
  };

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await API.get('/chat/conversations/unread-count');
        setUnreadChatCount(data.unreadCount || 0);
      } catch (err) {
        // ignore
      }
    };
    if (user) fetchUnread();

    window.addEventListener('chatRead', fetchUnread);
    return () => window.removeEventListener('chatRead', fetchUnread);
  }, [user, location.pathname]); // Refresh when navigating around

  const [isProjectsOpen, setIsProjectsOpen] = useState(() => {
    const projectPaths = ["/projects", "/tasks", "/issues", "/team", "/admin/task-status", "/documents", "/reports"];
    return projectPaths.includes(location.pathname);
  });

  const companyName = useMemo(() => {
    if (!user) return "Loading...";
    if (user.company && typeof user.company === 'object') return user.company.companyName;
    if (user.companyName) return user.companyName;
    return "NOVA";
  }, [user]);

  const roleName = useMemo(() => typeof user?.role === "object" ? user.role?.name : user?.role, [user]);
  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === "admin" || perms.includes("*") || user?.isCompanyOwner, [roleName, perms, user?.isCompanyOwner]);

  const can = (permission) => isAdmin || perms.includes(permission);

  const menuItems = [
    { name: "Dashboard", path: isAdmin ? "/admin" : "/staff", icon: LayoutDashboard, allowed: true },
    {
      name: "Projects", icon: FolderKanban, isSubmenu: true, allowed: can("projects_read") || can("tasks_read"),
      children: [
        { name: "Reports", path: "/reports", icon: PieChart, allowed: can("reports_read") },
        { name: "Projects", path: "/projects", icon: Folder, allowed: can("projects_read") },
        { name: "Tasks", path: "/tasks", icon: ClipboardList, allowed: can("tasks_read") },
        { name: "Issues", path: "/issues", icon: AlertTriangle, allowed: can("tasks_read") },
        { name: "Team", path: "/team", icon: Users, allowed: can("projects_read") },
        { name: "Task Statuses", path: "/admin/task-status", icon: Settings, allowed: can("roles_update") },
        { name: "Documents", path: "/documents", icon: FileText, allowed: can("documents_read") },
      ]
    },
    { name: "Chat", path: "/chat", icon: MessageSquare, allowed: can("chat_read") },
    { name: "Staff", path: "/admin/staff", icon: Users, allowed: can("staff_read") },
    { name: "Roles", path: "/admin/roles", icon: Briefcase, allowed: isAdmin && !user?.isCompanyOwner },
    { name: "Permissions", path: "/admin/permissions", icon: ShieldPlus, allowed: isAdmin && !user?.isCompanyOwner },
    { name: "Companies", path: "/admin/company", icon: Building2, allowed: isAdmin && !user?.isCompanyOwner },
    { name: "Subscriptions", path: "/admin/subscriptions", icon: CreditCard, allowed: isAdmin && !user?.isCompanyOwner },
    { name: "Company Profile", path: "/admin/company-settings", icon: Building2, allowed: isAdmin || user?.isCompanyOwner },
    { name: "Manage Website", path: "/admin/manage-website", icon: MonitorPlay, allowed: isAdmin && !user?.isCompanyOwner },
    { name: "Audit Logs", path: "/admin/audit-logs", icon: Server, allowed: roleName === "superadmin" || (isAdmin && !user?.isCompanyOwner) },
  ];

  const sidebarBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const activeBg = useColorModeValue('brand.50', 'whiteAlpha.100');
  const activeColor = useColorModeValue('brand.600', 'brand.300');
  const hoverBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  const headingColor = useColorModeValue('gray.900', 'white');
  const activeSubmenuBg = useColorModeValue('gray.100', 'gray.800');
  const activeSubmenuColor = useColorModeValue('gray.900', 'white');
  const profileHoverBg = useColorModeValue('gray.100', 'gray.800');
  const profileNameColor = useColorModeValue('gray.800', 'gray.100');
  const profileRoleBg = useColorModeValue('gray.100', 'gray.800');
  const btnHoverBg = useColorModeValue('gray.200', 'gray.700');
  const btnColor = useColorModeValue('gray.700', 'gray.200');
  const signOutBg = useColorModeValue('red.50', 'whiteAlpha.50');
  const signOutBorder = useColorModeValue('red.100', 'transparent');
  const companyValueColor = useColorModeValue('gray.700', 'gray.300');
  const footerBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  // Used for hover states in maps
  const invertedTextColor = useColorModeValue('gray.900', 'white');

  return (
    <>
      <Flex
        as="aside"
        w="64" h="100vh" bg={sidebarBg} color={textColor}
        direction="column" position="fixed" left="0" top="0" zIndex="40"
        borderRight="1px solid" borderColor={borderColor}
        transition="colors 0.3s"
      >
        {/* Header */}
        <Box p="6" borderBottom="1px solid" borderColor={borderColor} flexShrink={0}>
          <Flex align="center" gap="2" mb="1">
            <Icon as={Building2} boxSize="6" color="brand.600" />
            <Text fontSize="xl" fontWeight="black" color={headingColor} noOfLines={1} title={companyName}>
              {companyName}
            </Text>
          </Flex>
          <Text fontSize="10px" color="gray.500" fontWeight="black" textTransform="uppercase" letterSpacing="widest" pl="8">
            {user?.isCompanyOwner ? "Owner" : roleName} Workspace
          </Text>
        </Box>

        {/* Scrollable Nav Area */}
        <Box flex="1" p="4" overflowY="auto" css={{ '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <VStack spacing="2" align="stretch">
            {menuItems.map((item) => {
              if (!item.allowed) return null;

              if (item.isSubmenu) {
                const isAnyChildActive = item.children.some(child => location.pathname === child.path);
                const buttonBg = (isAnyChildActive && !isProjectsOpen) ? activeSubmenuBg : 'transparent';
                const buttonColor = (isAnyChildActive && !isProjectsOpen) ? activeSubmenuColor : textColor;

                return (
                  <Box key={item.name}>
                    <Flex
                      as="button" w="full" align="center" justify="space-between" px="4" py="3" rounded="xl" fontWeight="bold"
                      bg={buttonBg} color={buttonColor} transition="all 0.2s"
                      _hover={{ bg: hoverBg, color: headingColor, transform: "translateX(2px)" }}
                      onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                    >
                      <Flex align="center" gap="3">
                        <Icon as={item.icon} boxSize="5" />
                        {item.name}
                      </Flex>
                      <Icon as={isProjectsOpen ? ChevronUp : ChevronDown} boxSize="4" />
                    </Flex>

                    <Collapse in={isProjectsOpen} animateOpacity>
                      <VStack pl="4" mt="1.5" spacing="1.5" align="stretch">
                        {item.children.map((child) => {
                          if (!child.allowed) return null;
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Flex
                              as={RouterLink} to={child.path} key={child.name}
                              align="center" gap="3" px="4" py="2.5" rounded="xl" fontWeight="bold" transition="all 0.2s"
                              bg={isChildActive ? activeBg : 'transparent'}
                              color={isChildActive ? activeColor : textColor}
                              _hover={!isChildActive ? { bg: hoverBg, color: invertedTextColor, transform: "translateX(4px)" } : {}}
                            >
                              <Icon as={child.icon} boxSize="5" />
                              {child.name}
                            </Flex>
                          );
                        })}
                      </VStack>
                    </Collapse>
                  </Box>
                );
              }

              const isActive = location.pathname === item.path;
              return (
                <Flex
                  as={RouterLink} to={item.path} key={item.name}
                  align="center" px="4" py="3" rounded="xl" fontWeight="bold" transition="all 0.2s"
                  bg={isActive ? activeBg : 'transparent'}
                  color={isActive ? activeColor : textColor}
                  _hover={!isActive ? { bg: hoverBg, color: invertedTextColor, transform: "translateX(4px)" } : {}}
                >
                  <Flex align="center" gap="3">
                    <Icon as={item.icon} boxSize="5" />
                    {item.name}
                  </Flex>
                  {item.name === "Chat" && unreadChatCount > 0 && (
                    <Badge colorScheme="red" ml="auto" rounded="full" px="2">{unreadChatCount}</Badge>
                  )}
                </Flex>
              );
            })}
          </VStack>
        </Box>

        {/* Footer Profile Section */}
        <Box p="4" borderTop="1px solid" borderColor={borderColor} bg={footerBg} flexShrink={0}>

          <Menu placement="top" autoSelect={false}>
            <MenuButton
              as={Flex} w="full" p="2" mb="3" rounded="xl" cursor="pointer" transition="all 0.2s"
              _hover={{ bg: profileHoverBg }}
            >
              <Flex align="center" justify="space-between" w="full">
                <Flex align="center" gap="3">
                  <Flex w="10" h="10" bgGradient="linear(to-br, brand.600, indigo.600)" rounded="full" align="center" justify="center" overflow="hidden" color="white" fontWeight="bold" shadow="sm" border="1px solid" borderColor={borderColor}>
                    {user?.profilePicture ? (
                      <Image src={getProfilePicUrl(user.profilePicture)} alt="Profile" w="full" h="full" objectFit="cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </Flex>
                  <Box textAlign="left">
                    <Text fontSize="sm" fontWeight="bold" color={profileNameColor} noOfLines={1} w="28">
                      {user?.name}
                    </Text>
                    <Text fontSize="10px" color="gray.500" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" noOfLines={1}>
                      {companyName}
                    </Text>
                  </Box>
                </Flex>
                <ChevronUp size={18} />
              </Flex>
            </MenuButton>

            <MenuList minW="xs" p="4" rounded="2xl" shadow="2xl" border="1px solid" borderColor={borderColor}>
              <Flex direction="column" align="center" mb="4">
                <Flex w="16" h="16" mb="3" bgGradient="linear(to-tr, brand.600, indigo.500)" rounded="full" align="center" justify="center" overflow="hidden" color="white" fontSize="2xl" fontWeight="black" shadow="inner">
                  {user?.profilePicture ? (
                    <Image src={getProfilePicUrl(user.profilePicture)} alt="Profile" w="full" h="full" objectFit="cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </Flex>
                <Text fontSize="lg" fontWeight="bold" color={headingColor} lineHeight="tight">{user?.name}</Text>
                <Text fontSize="xs" fontWeight="bold" color="brand.500">@{user?.username || 'user'}</Text>
              </Flex>

              <Box pt="4" borderTop="1px solid" borderColor={borderColor}>
                <Flex justify="space-between" align="center" mb="2">
                  <Text fontSize="10px" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider">Company</Text>
                  <Text fontSize="sm" fontWeight="bold" color={companyValueColor} noOfLines={1} maxW="120px">{companyName}</Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text fontSize="10px" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider">Role</Text>
                  <Text bg={profileRoleBg} color="brand.600" px="2" py="1" rounded="md" fontSize="10px" fontWeight="black" textTransform="uppercase" border="1px solid" borderColor={borderColor}>
                    {user?.isCompanyOwner ? "Owner" : roleName}
                  </Text>
                </Flex>
                <Button
                  w="full" mt="4" size="sm" rounded="lg" bg={profileHoverBg} color={btnColor}
                  _hover={{ bg: btnHoverBg }} onClick={() => setIsEditProfileOpen(true)}
                >
                  Edit Profile
                </Button>
              </Box>
            </MenuList>
          </Menu>

          <Button
            w="full" py="5" rounded="xl" fontWeight="bold" variant="outline"
            leftIcon={<LogOut size={16} />}
            color="red.600" bg={signOutBg} borderColor={signOutBorder}
            _hover={{ bg: 'red.500', color: 'white', borderColor: 'red.500' }} transition="all 0.2s"
            _active={{ transform: 'scale(0.95)' }}
            onClick={() => setIsLogoutModalOpen(true)}
          >
            Sign Out
          </Button>

        </Box>
      </Flex>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of your organization?"
        confirmText="Yes, Sign Out"
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
      />
    </>
  );
}