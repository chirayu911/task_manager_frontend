import React, { useCallback } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout({
  children,
  user,
  handleLogout,
  activeProjectId,
  setActiveProjectId
}) {

  const can = useCallback((permission) => {
    if (!user) return false;

    const roleName = typeof user.role === 'object' ? user.role?.name : user.role;

    if (roleName === "admin" || roleName === "superadmin" || user.permissions?.includes('*')) {
      return true;
    }

    return user.permissions?.includes(permission);
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar
        user={user}
        handleLogout={handleLogout}
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
      />
      
      <div className="flex">
        <Sidebar
          user={user}
          handleLogout={handleLogout}
          can={can}
        />

        <main className="flex-1 ml-64 pt-16 p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}