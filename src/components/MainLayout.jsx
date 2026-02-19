import React from 'react';
import Sidebar from './Sidebar';

export default function MainLayout({ children, user, handleLogout }) {

  // 🔥 Centralized permission checker
  const can = (permission) => {
    if (!user) return false;

    // Admin & Superadmin bypass
    if (user.role === "admin" || user.role === "superadmin") {
      return true;
    }

    return user.permissions?.includes(permission);
  };

  return (
    <div className="flex">

      {/* Sidebar now gets can() */}
      <Sidebar 
        user={user} 
        handleLogout={handleLogout}
        can={can} 
      />

      {/* Main Content */}
      <main className="flex-1 ml-64 bg-gray-50 min-h-screen">
        {children}
      </main>

    </div>
  );
}