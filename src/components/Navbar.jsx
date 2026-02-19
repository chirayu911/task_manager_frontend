import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Navbar = () => {
  const navigate = useNavigate();
  
  // Get user info to show name/role
  const user = JSON.parse(localStorage.getItem('user'));

  // --- LOGOUT FUNCTION (Fixed: No Axios Call) ---
  const onLogout = () => {
    // 1. Clear Local Storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    // 2. Show success message
    toast.success('Logged out successfully');

    // 3. Redirect to Login Page
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to={user?.role === 'admin' ? '/admin' : '/tasks'} className="text-xl font-bold text-blue-600">
              Task Manager
            </Link>
          </div>

          {/* Menu Links */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-600 hidden md:block">
                  Hello, <strong>{user.name}</strong> ({user.role})
                </span>
                
                {/* Admin Links */}
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <>
                    <Link to="/admin" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                    <Link to="/admin/staff" className="text-gray-600 hover:text-blue-600">Staff</Link>
                  </>
                )}
                
                {/* User Links */}
                <Link to="/tasks" className="text-gray-600 hover:text-blue-600">Tasks</Link>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 mr-4">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;