import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ShieldPlus,
  Folder,
  LogOut,
  Settings,
  ChevronUp,
  ChevronDown,
  FolderKanban,
  AlertTriangle,
  Briefcase,
  CreditCard,
  FileText 
} from "lucide-react";
import ConfirmModal from "./ConfirmModal"; 

export default function Sidebar({ user, handleLogout }) {
  const location = useLocation();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); 
  
  const [isProjectsOpen, setIsProjectsOpen] = useState(() => {
    const projectPaths = ["/projects", "/tasks", "/issues", "/team", "/admin/task-status", "/documents"];
    return projectPaths.includes(location.pathname);
  });

  const roleName = useMemo(() => 
    typeof user?.role === "object" ? user.role?.name : user?.role, 
  [user]);

  const perms = useMemo(() => user?.permissions || [], [user]);

  const isAdmin = useMemo(() => 
    roleName === "admin" || perms.includes("*"), 
  [roleName, perms]);

  const can = (permission) => isAdmin || perms.includes(permission);

  const menuItems = [
    {
      name: "Dashboard",
      path: isAdmin ? "/admin" : "/staff",
      icon: <LayoutDashboard size={20} />,
      allowed: true, 
    },
    {
      name: "Projects",
      icon: <FolderKanban size={20} />,
      isSubmenu: true, 
      allowed: can("projects_read") || can("tasks_read"), 
      children: [
        { name: "Projects", path: "/projects", icon: <Folder size={20} />, allowed: can("projects_read") },
        { name: "Tasks", path: "/tasks", icon: <ClipboardList size={20} />, allowed: can("tasks_read") },
        { name: "Issues", path: "/issues", icon: <AlertTriangle size={20} />, allowed: can("tasks_read") },
        { name: "Team", path: "/team", icon: <Users size={20} />, allowed: can("projects_read") },
        { name: "Task Statuses", path: "/admin/task-status", icon: <Settings size={20} />, allowed: can("roles_update") },
        { name: "Documents", path: "/documents", icon: <FileText size={20} />, allowed: can("projects_read") },
      ]
    },
    {
      name: "Subscriptions",
      path: "/admin/subscriptions", 
      icon: <CreditCard size={20} />,
      allowed: isAdmin, 
    },
    {
      name: "Staff",
      path: "/admin/staff", 
      icon: <Users size={20} />,
      allowed: can("staff_read"), 
    },
    {
      name: "Roles",
      path: "/admin/roles", 
      icon: <Briefcase size={20} />,
      allowed: can("roles_read"),
    },
    {
      name: "Permissions",
      path: "/admin/permissions", 
      icon: <ShieldPlus size={20} />,
      allowed: can("permissions_read"),
    },
  ];

  return (
    <>
      <div className="w-64 bg-white dark:bg-gray-950 h-screen text-gray-800 dark:text-white flex flex-col fixed left-0 top-0 shadow-xl dark:shadow-none border-r border-gray-200 dark:border-gray-800 z-40 transition-colors duration-300">
        
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h1 className="text-2xl font-black text-primary-600 dark:text-primary-500 tracking-tight">Task Manager</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium uppercase tracking-widest">{roleName} Panel</p>
        </div>

        {/* Scrollable Nav Area */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {menuItems.map((item) => {
            if (!item.allowed) return null;

            if (item.isSubmenu) {
              const isAnyChildActive = item.children.some(child => location.pathname === child.path);
              
              return (
                <div key={item.name} className="space-y-1.5">
                  <button
                    onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                    data-btn-id="4"
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${
                      isAnyChildActive && !isProjectsOpen
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {item.name}
                    </div>
                    {isProjectsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isProjectsOpen && (
                    <div className="pl-4 space-y-1.5 animate-in slide-in-from-top-2 duration-200 mt-1.5">
                      {item.children.map((child) => {
                        if (!child.allowed) return null;
                        const isChildActive = location.pathname === child.path;
                        
                        return (
                          <Link
                            key={child.name}
                            to={child.path}
                            data-btn-id="7"
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all ${
                              isChildActive
                                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                            }`}
                          >
                            {child.icon}
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name} 
                to={item.path}
                data-btn-id="7"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive
                    ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Fixed Footer Profile Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/80 relative shrink-0">
          
          {isProfileOpen && (
            <div className="absolute bottom-full left-0 w-full p-4 pb-2 z-50">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 transform transition-all">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-tr from-primary-600 to-indigo-500 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-inner mb-3">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg leading-tight">{user?.name}</h3>
                  <p className="text-primary-500 dark:text-primary-400 text-xs font-bold">@{user?.username || 'user'}</p>
                </div>
                
                <div className="space-y-3 text-sm border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-black tracking-wider">Email</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[120px]" title={user?.email}>
                      {user?.email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-black tracking-wider">Role</span>
                    <span className="bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-md text-[10px] font-black uppercase border border-gray-200 dark:border-gray-700">
                      {roleName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            data-btn-id="4"
            className="flex items-center justify-between w-full p-2 mb-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate w-28 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {user?.name}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate uppercase tracking-widest">
                  View Profile
                </p>
              </div>
            </div>
            {isProfileOpen ? (
              <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white transition-colors" />
            ) : (
              <ChevronUp size={18} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white transition-colors" />
            )}
          </button>

          <button
            onClick={() => setIsLogoutModalOpen(true)}
            data-btn-id="6"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white rounded-xl font-bold transition-all active:scale-95 border border-red-100 dark:border-red-500/20 hover:border-red-500"
          >
            <LogOut size={16} />
            Sign Out
          </button>

        </div>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of your account? You will need to log back in to access the dashboard."
        confirmText="Yes, Sign Out"
      />
    </>
  );
}