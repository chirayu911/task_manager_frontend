import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import API from "./api";
import { io } from "socket.io-client";

// Pages
import Login from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import StaffFormPage from "./pages/StaffFormPage";
import AdminStaffCRUD from "./pages/AdminStaffCRUD";
import TaskPage from "./pages/TaskPage";
import TaskFormPage from "./pages/TaskFormPage";
import PermissionPage from "./pages/PermissionPage";
import RolePage from "./pages/RolePage";
import RolePermissionMatrix from "./pages/RolePermissionMatrix";
import PermissionFormPage from "./pages/PermissionFormPage";
import TaskStatusPage from "./pages/TaskStatusPage";
import TaskStatusFormPage from "./pages/TaskStatusFormPage";

// Layout
import MainLayout from "./components/MainLayout";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

  // ---------------- 1. SILENT SESSION CHECK ----------------
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const { data } = await API.get("/auth/me");
        setUser(data);
      } catch (error) {
        // ⭐ Silent fail: 401 is expected if not logged in yet
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  // ---------------- 2. REAL-TIME SOCKET ----------------
  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(SOCKET_URL, {
      auth: { userId: user._id },
      transports: ["websocket"],
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on("permissionsUpdated", async () => {
      try {
        const { data } = await API.get("/auth/me");
        setUser(data);
      } catch (err) {
        console.error("Failed to sync updated permissions");
      }
    });

    return () => newSocket.disconnect();
  }, [user?._id, SOCKET_URL]);

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      socket?.disconnect();
      setUser(null);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed");
    }
  };

  // ---------------- 3. AUTH HELPERS ----------------
  const perms = user?.permissions || [];
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const isAdmin = roleName === "admin" || perms.includes("*");

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-gray-600 animate-pulse text-sm uppercase">Loading Session...</p>
        </div>
      </div>
    );
  }

  // ---------------- 4. PROTECTED ROUTE WRAPPER ----------------
  const ProtectedRoute = ({ children, requiredPermission }) => {
    // If not logged in, redirect to the landing/login page
    if (!user) return <Navigate to="/" />;

    // Admin bypass
    if (isAdmin) {
      return <MainLayout user={user} handleLogout={handleLogout}>{children}</MainLayout>;
    }

    // Staff permission check
    if (requiredPermission && !perms.includes(requiredPermission)) {
      return <Navigate to="/staff" />;
    }

    return <MainLayout user={user} handleLogout={handleLogout}>{children}</MainLayout>;
  };

  return (
    <Router>
      <Routes>
        {/* ⭐ Login/Redirect Route */}
        <Route
          path="/"
          element={
            !user ? (
              <Login setUser={setUser} />
            ) : (
              <Navigate to={isAdmin ? "/admin" : "/staff"} />
            )
          }
        />

        {/* Dashboards */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard user={user} /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><AdminDashboard user={user} /></ProtectedRoute>} />

        {/* Task Management */}
        <Route path="/tasks" element={<ProtectedRoute requiredPermission="tasks_read"><TaskPage user={user} /></ProtectedRoute>} />
        <Route path="/tasks/create" element={<ProtectedRoute requiredPermission="tasks_create"><TaskFormPage user={user} /></ProtectedRoute>} />
        <Route path="/tasks/edit/:id" element={<ProtectedRoute requiredPermission="tasks_update"><TaskFormPage user={user} /></ProtectedRoute>} />

        {/* Staff Management */}
        <Route path="/admin/staff" element={<ProtectedRoute requiredPermission="staff_read"><AdminStaffCRUD user={user} /></ProtectedRoute>} />
        <Route path="/admin/staff/create" element={<ProtectedRoute requiredPermission="staff_create"><StaffFormPage /></ProtectedRoute>} />
        <Route path="/admin/staff/edit/:id" element={<ProtectedRoute requiredPermission="staff_update"><StaffFormPage /></ProtectedRoute>} />

        {/* Roles & Permissions */}
        <Route path="/admin/roles" element={<ProtectedRoute requiredPermission="roles_read"><RolePage user={user} /></ProtectedRoute>} />
        <Route path="/admin/roles/create" element={<ProtectedRoute requiredPermission="roles_create"><RolePermissionMatrix user={user} /></ProtectedRoute>} />
        <Route path="/admin/roles/edit/:id" element={<ProtectedRoute requiredPermission="roles_update"><RolePermissionMatrix user={user} /></ProtectedRoute>} />
        <Route path="/admin/permissions" element={<ProtectedRoute requiredPermission="roles_read"><PermissionPage user={user} /></ProtectedRoute>} />

        {/* Task Status */}
        <Route path="/admin/task-status" element={<ProtectedRoute requiredPermission="roles_update"><TaskStatusPage user={user} /></ProtectedRoute>} />
        <Route path="/admin/task-status/create" element={<ProtectedRoute requiredPermission="roles_update"><TaskStatusFormPage user={user} /></ProtectedRoute>} />
        <Route path="/admin/task-status/edit/:id" element={<ProtectedRoute requiredPermission="roles_update"><TaskStatusFormPage user={user} /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}