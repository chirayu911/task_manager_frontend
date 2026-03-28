import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
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
import ProjectPage from "./pages/ProjectPage";
import ProjectFormPage from "./pages/ProjectFormPage";

// New Pages
import TeamPage from "./pages/TeamPage";
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SubscriptionPage from './pages/SubscriptionPage';
import SubscriptionFormPage from './pages/SubscriptionFormPage';
import DocumentPage from './pages/DocumentPage';
import DocumentFormPage from './pages/DocumentFormPage';
import CreateDocument from "./pages/CreateDocument";
import CompanyRegistrationPage from "./pages/CompanyRegistrationPage"; 
import CompanyProfilePage from "./pages/CompanyProfilePage";
import CompanySettingsPage from './pages/CompanySettingsPage';
import SubscriptionSelectionPage from './pages/SubscriptionSelectionPage'; // Assumed from previous step
import ActivityLogPage from './pages/ActivityLogPage'; // Bonus: Activity Log Page
import LandingPage from "./pages/LandingPage";
import ManageWebsitePage from "./pages/ManageWebsitePage";

// Components
import MainLayout from "./components/MainLayout";
import Notification from "./components/Notification";

// Theme Provider
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000/api";

  // Project Context State Logic
  const [activeProjectId, setActiveProjectId] = useState(() => {
    const stored = localStorage.getItem('activeProjectId');
    return (stored && stored !== 'null' && stored !== 'undefined') ? stored : null;
  });

  // ⭐ NEW: Company Context State Logic (For Admins)
  const [activeCompanyId, setActiveCompanyId] = useState(() => {
    const stored = localStorage.getItem('activeCompanyId');
    return (stored && stored !== 'null' && stored !== 'undefined') ? stored : 'all'; // default to 'all'
  });

  // Persist Active Project to LocalStorage
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('activeProjectId', activeProjectId);
    } else {
      localStorage.removeItem('activeProjectId');
    }
  }, [activeProjectId]);

  // ⭐ NEW: Persist Active Company to LocalStorage
  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem('activeCompanyId', activeCompanyId);
    } else {
      localStorage.removeItem('activeCompanyId');
    }
  }, [activeCompanyId]);

  // Global Notification Helper
  const notify = (type, message) => {
    setNotification({ type, message });
  };

  // 1. SESSION CHECK
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const { data } = await API.get(`/auth/me?t=${new Date().getTime()}`);
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  // 2. REAL-TIME SOCKET CONNECTION
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
        notify('info', 'Permissions updated by administrator');
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
      setActiveProjectId(null);
      setActiveCompanyId('all'); // reset to default
      localStorage.removeItem('profile'); 
      notify('info', 'Logged out successfully');
      navigate('/login'); 
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  // 3. AUTH MEMOIZATION
  const roleName = useMemo(() => {
    if (!user?.role) return null;
    return typeof user.role === 'object' ? user.role.name : user.role;
  }, [user]);

  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === "admin" || roleName === "superadmin" || perms.includes("*"), [roleName, perms]);

  const refreshUser = async () => {
    try {
      const { data } = await API.get(`/auth/me?t=${new Date().getTime()}`);
      setUser(data);
    } catch (error) {
      console.error("Failed to refresh user data");
    }
  };

  // 4. PROTECTED ROUTE COMPONENT
  const ProtectedRoute = ({ children, requiredPermission }) => {
    if (loading) return null;

    if (!user) {
      const currentPath = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/login?redirect=${currentPath}`} replace />;
    }

    if (requiredPermission && !isAdmin && !perms.includes(requiredPermission)) {
      return <Navigate to={isAdmin ? "/admin" : "/staff"} replace />;
    }

    return (
      <MainLayout
        user={user}
        handleLogout={handleLogout}
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
        activeCompanyId={activeCompanyId}       // ⭐ Passed to MainLayout
        setActiveCompanyId={setActiveCompanyId} // ⭐ Passed to MainLayout
      >
        {children}
      </MainLayout>
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-gray-600 dark:text-gray-400 animate-pulse text-sm uppercase">Verifying Session...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <Routes>
        {/* PUBLIC ROUTES */}
        {["/login"].map((path) => (
          <Route
            key={path}
            path={path}
            element={
              !user ? (
                <Login setUser={setUser} notify={notify} />
              ) : (
                (() => {
                  const params = new URLSearchParams(location.search);
                  const redirectTo = params.get('redirect');

                  if (redirectTo) {
                    return <Navigate to={decodeURIComponent(redirectTo)} replace />;
                  }

                  return <Navigate to={isAdmin ? "/admin" : "/staff"} replace />;
                })()
              )
            }
          />
        ))}

        {/* REGISTRATION & ONBOARDING */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={!user ? <CompanyRegistrationPage /> : <Navigate to="/login" replace />} />
        <Route path="/choose-plan" element={user ? <SubscriptionSelectionPage /> : <Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/login" replace />} />
        <Route path="/reset-password/:token" element={!user ? <ResetPasswordPage /> : <Navigate to="/login" replace />} />

        {/* PROTECTED ROUTES */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard user={user} /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><AdminDashboard user={user} /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><ActivityLogPage user={user} /></ProtectedRoute>} />

        <Route path="/admin/company" element={<ProtectedRoute> <CompanyProfilePage /> </ProtectedRoute>} />
        <Route path="/admin/company-settings" element={<ProtectedRoute><CompanySettingsPage user={user} /> </ProtectedRoute>} />
        <Route path="/admin/manage-website" element={<ProtectedRoute requiredPermission="roles_update"><ManageWebsitePage /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute requiredPermission="tasks_read"><TaskPage user={user} socket={socket} activeProjectId={activeProjectId} /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute requiredPermission="projects_read"><TeamPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />

        <Route path="/issues" element={<ProtectedRoute requiredPermission="tasks_read"><TaskPage user={user} socket={socket} activeProjectId={activeProjectId} /></ProtectedRoute>} />
        <Route path="/issues/create" element={<ProtectedRoute requiredPermission="tasks_create"><TaskFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />
        <Route path="/issues/edit/:id" element={<ProtectedRoute requiredPermission="tasks_update"><TaskFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />
        <Route path="/issues/view/:id" element={<ProtectedRoute requiredPermission="tasks_read"><TaskFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />

        <Route path="/tasks/create" element={<ProtectedRoute requiredPermission="tasks_create"><TaskFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />
        <Route path="/tasks/edit/:id" element={<ProtectedRoute requiredPermission="tasks_update"><TaskFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />
        <Route path="/tasks/view/:id" element={<ProtectedRoute requiredPermission="tasks_read"><TaskFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />

        <Route path="/admin/staff" element={<ProtectedRoute requiredPermission="staff_read"><AdminStaffCRUD user={user} socket={socket} activeCompanyId={activeCompanyId} /></ProtectedRoute>} />
        <Route path="/admin/staff/create" element={<ProtectedRoute requiredPermission="staff_create"><StaffFormPage /></ProtectedRoute>} />
        <Route path="/admin/staff/edit/:id" element={<ProtectedRoute requiredPermission="staff_update"><StaffFormPage /></ProtectedRoute>} />

        <Route path="/admin/roles" element={<ProtectedRoute requiredPermission="roles_read"><RolePage user={user} socket={socket} /></ProtectedRoute>} />
        <Route path="/admin/roles/create" element={<ProtectedRoute requiredPermission="roles_create"><RolePermissionMatrix user={user} /></ProtectedRoute>} />
        <Route path="/admin/roles/edit/:id" element={<ProtectedRoute requiredPermission="roles_update"><RolePermissionMatrix user={user} /></ProtectedRoute>} />

        <Route path="/admin/permissions" element={<ProtectedRoute requiredPermission="permissions_read"><PermissionPage user={user} socket={socket} /></ProtectedRoute>} />
        <Route path="/admin/permissions/create" element={<ProtectedRoute requiredPermission="permissions_create"><PermissionFormPage user={user} /></ProtectedRoute>} />
        <Route path="/admin/permissions/update/:id" element={<ProtectedRoute requiredPermission="permissions_update"><PermissionFormPage user={user} /></ProtectedRoute>} />

        <Route path="/admin/task-status" element={<ProtectedRoute requiredPermission="roles_update"><TaskStatusPage user={user} socket={socket} activeProjectId={activeProjectId} /></ProtectedRoute>} />
        <Route path="/admin/task-status/create" element={<ProtectedRoute requiredPermission="roles_update"><TaskStatusFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />
        <Route path="/admin/task-status/edit/:id" element={<ProtectedRoute requiredPermission="roles_update"><TaskStatusFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />

        <Route path="/projects" element={<ProtectedRoute requiredPermission="projects_read"><ProjectPage user={user} /></ProtectedRoute>} />
        <Route path="/projects/create" element={<ProtectedRoute requiredPermission="projects_create"><ProjectFormPage user={user} /></ProtectedRoute>} />
        <Route path="/projects/edit/:id" element={<ProtectedRoute requiredPermission="projects_update"><ProjectFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />

        <Route path="/admin/subscriptions" element={<ProtectedRoute><SubscriptionPage user={user} /></ProtectedRoute>} />
        <Route path="/admin/subscriptions/create" element={<ProtectedRoute><SubscriptionFormPage /></ProtectedRoute>} />
        <Route path="/admin/subscriptions/edit/:id" element={<ProtectedRoute><SubscriptionFormPage /></ProtectedRoute>} />

        <Route path="/documents" element={<ProtectedRoute requiredPermission="projects_read"><DocumentPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />
        <Route path="/documents/create" element={<ProtectedRoute requiredPermission="documents_create"><DocumentFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />
        <Route path="/documents/create/text" element={<ProtectedRoute requiredPermission="documents_create"><CreateDocument user={user} activeProjectId={activeProjectId} notify={notify} refreshUser={refreshUser} /></ProtectedRoute>} />
        <Route path="/documents/edit/:id" element={<ProtectedRoute requiredPermission="documents_update"><DocumentFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />
        <Route path="/documents/edit/text/:id" element={<ProtectedRoute requiredPermission="documents_update"><CreateDocument user={user} activeProjectId={activeProjectId} notify={notify} refreshUser={refreshUser} /></ProtectedRoute>} />
        <Route path="/documents/view/:id" element={<ProtectedRoute requiredPermission="projects_read"><DocumentFormPage user={user} activeProjectId={activeProjectId} /></ProtectedRoute>} />

        <Route
          path="/documents/requests/:requestId"
          element={
            <ProtectedRoute requiredPermission="projects_read">
              <DocumentPage user={user} activeProjectId={activeProjectId} />
            </ProtectedRoute>
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}