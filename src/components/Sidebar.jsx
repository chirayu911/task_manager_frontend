import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ShieldPlus,
  Shield,
  LogOut,
} from "lucide-react";

export default function Sidebar({ user, handleLogout }) {
  const location = useLocation();

  // 1. Normalize role and permissions for safe checking
  const roleName = typeof user?.role === "object" ? user.role?.name : user.role;
  const perms = user?.permissions || [];
  const isAdmin = roleName === "admin" || perms.includes("*");

  // 2. Helper to decide if a link should show
  const can = (permission) => isAdmin || perms.includes(permission);

  const menuItems = [
    {
      name: "Dashboard",
      path: isAdmin ? "/admin" : "/staff",
      icon: <LayoutDashboard size={20} />,
      allowed: true, // Everyone sees their dashboard
    },
    {
      name: "Manage Staff",
      path: "/admin/staff", 
      icon: <Users size={20} />,
      allowed: can("staff_read"), // Dynamic check
    },
    {
      name: "Manage Roles",
      path: "/admin/roles", 
      icon: <Shield size={20} />,
      allowed: can("roles_read"),
    },
    {
      name: "Manage Tasks",
      path: "/tasks",
      icon: <ClipboardList size={20} />,
      allowed: can("tasks_read"),
    },
    {
      name: "Permissions ",
      path: "/admin/permissions", 
      icon: <ShieldPlus size={20} />,
      allowed: can("permissions_read"),
    },
    //  {
    //   name: "Permissions",
    //   path: "/admin/permissions", 
    //   icon: <ShieldPlus size={20} />,
    //   allowed: can("permissions_read"),
    // },
    {
  name: "Task Statuses",
  path: "/admin/task-status", 
  icon: <ShieldPlus size={20} />,
  allowed: can("task_status_update"),
},
  ];

  return (
    <div className="w-64 bg-gray-900 min-h-screen text-white flex flex-col fixed left-0 top-0 shadow-xl">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-500">Task Manager</h1>
        <p className="text-xs text-gray-400 mt-1 capitalize">{roleName} Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          if (!item.allowed) return null; // Hide if unauthorized

          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="mb-4">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}