import React, { useState, useEffect, useMemo } from "react"; // ⭐ Added useMemo
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"; 
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
  const navigate = useNavigate(); 

  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

  // ---------------- 1. SILENT SESSION CHECK ----------------
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const { data } = await API.get("/auth/me");
        setUser(data);
      } catch (error) {
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
      await API.post('/auth/logout'); 
      setUser(null); 
      localStorage.removeItem('user'); 
      navigate('/'); 
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  // ---------------- 3. AUTH HELPERS (ROBUST FIX) ----------------
  // We use useMemo to ensure these values are stable and handle object-based roles
  const roleName = useMemo(() => {
    if (!user?.role) return null;
    return typeof user.role === 'object' ? user.role.name : user.role;
  }, [user]);

  const perms = useMemo(() => user?.permissions || [], [user]);

  // isAdmin now correctly checks the normalized roleName
  const isAdmin = useMemo(() => {
    return roleName === "admin" || perms.includes("*");
  }, [roleName, perms]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-gray-600 animate-pulse text-sm uppercase">Initializing Session...</p>
        </div>
      </div>
    );
  }

  // ---------------- 4. PROTECTED ROUTE WRAPPER ----------------
  const ProtectedRoute = ({ children, requiredPermission }) => {
    if (!user) return <Navigate to="/" />;

    // Admins bypass all permission checks
    if (isAdmin) {
      return <MainLayout user={user} handleLogout={handleLogout}>{children}</MainLayout>;
    }

    // Check permissions for Staff/Managers
    if (requiredPermission && !perms.includes(requiredPermission)) {
      // If they don't have permission, redirect them to their dashboard instead of a loop
      return <Navigate to="/staff" />;
    }

    return <MainLayout user={user} handleLogout={handleLogout}>{children}</MainLayout>;
  };

  return (
    <Routes>
      {/* PUBLIC ACCESS / LOGIN */}
      <Route
        path="/"
        element={
          !user ? (
            <Login setUser={setUser} />
          ) : (
            // ⭐ Redirect to appropriate dashboard based on role
            <Navigate to={isAdmin ? "/admin" : "/staff"} />
          )
        }
      />

      {/* Dashboards */}
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard user={user} /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><AdminDashboard user={user} /></ProtectedRoute>} />

      {/* Task Management */}
      <Route path="/tasks" element={<ProtectedRoute requiredPermission="tasks_read"><TaskPage user={user} socket={socket} /></ProtectedRoute>} />
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
      
      {/* Permission Management Routes */}
      <Route path="/admin/permissions" element={<ProtectedRoute requiredPermission="permissions_read"><PermissionPage user={user} /></ProtectedRoute>} />
      <Route path="/admin/permissions/create" element={<ProtectedRoute requiredPermission="permissions_create"><PermissionFormPage user={user} /></ProtectedRoute>} />
      <Route path="/admin/permissions/update/:id" element={<ProtectedRoute requiredPermission="permissions_update"><PermissionFormPage user={user} /></ProtectedRoute>} />

      {/* Task Status Management */}
      <Route path="/admin/task-status" element={<ProtectedRoute requiredPermission="roles_update"><TaskStatusPage user={user} /></ProtectedRoute>} />
      <Route path="/admin/task-status/create" element={<ProtectedRoute requiredPermission="roles_update"><TaskStatusFormPage user={user} /></ProtectedRoute>} />
      <Route path="/admin/task-status/edit/:id" element={<ProtectedRoute requiredPermission="roles_update"><TaskStatusFormPage user={user} /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}