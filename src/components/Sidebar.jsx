import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ShieldPlus,
  Shield,
  LogOut,
  Settings,
} from "lucide-react";

export default function Sidebar({ user, handleLogout }) {
  const location = useLocation();

  // ⭐ Logic: Memoize role and perms to ensure stable dependencies
  const roleName = useMemo(() => 
    typeof user?.role === "object" ? user.role?.name : user?.role, 
  [user]);

  const perms = useMemo(() => user?.permissions || [], [user]);

  const isAdmin = useMemo(() => 
    roleName === "admin" || perms.includes("*"), 
  [roleName, perms]);

  // ⭐ Logic: Helper to decide if a link should show
  const can = (permission) => isAdmin || perms.includes(permission);

  const menuItems = [
    {
      name: "Dashboard",
      path: isAdmin ? "/admin" : "/staff",
      icon: <LayoutDashboard size={20} />,
      allowed: true, 
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
      name: "Tasks",
      path: "/tasks",
      icon: <ClipboardList size={20} />,
      allowed: can("tasks_read"),
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
      icon: <Settings size={20} />, // Changed icon for visual variety
      allowed: can("roles_update"), // Using roles_update permission as per your TaskStatusPage logic
    },
  ];

  return (
    <div className="w-64 bg-gray-900 min-h-screen text-white flex flex-col fixed left-0 top-0 shadow-xl z-40">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-500">Task Manager</h1>
        <p className="text-xs text-gray-400 mt-1 capitalize">{roleName} Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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

      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="mb-4 px-4">
          <p className="text-sm font-bold text-gray-100 truncate">{user?.name}</p>
          <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider">{roleName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition-all active:scale-95"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}