import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ShieldPlus,
  Shield,
  LogOut,
  Settings,
  ChevronUp,
  ChevronDown,
  FolderKanban,
  AlertTriangle
} from "lucide-react";

export default function Sidebar({ user, handleLogout }) {
  const location = useLocation();
  
  // ⭐ State for toggling the profile card
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Logic: Memoize role and perms to ensure stable dependencies
  const roleName = useMemo(() => 
    typeof user?.role === "object" ? user.role?.name : user?.role, 
  [user]);

  const perms = useMemo(() => user?.permissions || [], [user]);

  const isAdmin = useMemo(() => 
    roleName === "admin" || perms.includes("*"), 
  [roleName, perms]);

  // Logic: Helper to decide if a link should show
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
      path: "/projects",
      icon: <FolderKanban size={20} />,
      allowed: can("projects_read"),
    },
    {
      name: "Tasks",
      path: "/tasks",
      icon: <ClipboardList size={20} />,
      allowed: can("tasks_read"),
    },
    {
      name: "Team",
      path: "/team",
      icon: <Users size={20} />,
      allowed: can("projects_read"),
    },
    {
      name: "Issues",
      path: "/issues",
      icon: <AlertTriangle size={20} />,
      allowed: can("tasks_read"),
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
      icon: <Shield size={20} />,
      allowed: can("roles_read"),
    },
    {
      name: "Permissions",
      path: "/admin/permissions", 
      icon: <ShieldPlus size={20} />,
      allowed: can("permissions_read"),
    },
    {
      name: "Task Statuses",
      path: "/admin/task-status", 
      icon: <Settings size={20} />, 
      allowed: can("roles_update"), 
    },
  ];

  return (
    <div className="w-64 bg-gray-900 min-h-screen text-white flex flex-col fixed left-0 top-0 shadow-xl z-40">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-500">Task Manager</h1>
        <p className="text-xs text-gray-400 mt-1 capitalize">{roleName} Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          if (!item.allowed) return null;

          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* ⭐ Updated Profile Section */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/80 relative">
        
        {/* Expanded Profile Card */}
        {isProfileOpen && (
          <div className="absolute bottom-full left-0 w-full p-4 pb-2 z-50">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-5 transform transition-all">
              <div className="flex flex-col items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-inner mb-3">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="text-white font-bold text-lg leading-tight">{user?.name}</h3>
                <p className="text-blue-400 text-xs font-medium">@{user?.username || 'user'}</p>
              </div>
              
              <div className="space-y-3 text-sm border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Email</span>
                  <span className="text-gray-300 truncate max-w-[120px]" title={user?.email}>
                    {user?.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Role</span>
                  <span className="bg-gray-900 text-blue-400 px-2 py-1 rounded-md text-xs font-bold uppercase border border-gray-700">
                    {roleName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Toggle Button */}
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center justify-between w-full p-2 mb-3 hover:bg-gray-800 rounded-xl transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-100 truncate w-28 group-hover:text-blue-400 transition-colors">
                {user?.name}
              </p>
              <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider">
                View Profile
              </p>
            </div>
          </div>
          {isProfileOpen ? (
            <ChevronDown size={18} className="text-gray-500 group-hover:text-white transition-colors" />
          ) : (
            <ChevronUp size={18} className="text-gray-500 group-hover:text-white transition-colors" />
          )}
        </button>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all active:scale-95 border border-red-500/20 hover:border-red-500"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}