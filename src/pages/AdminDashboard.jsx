import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Activity } from 'lucide-react';
import API from '../api';

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [staffCount, setStaffCount] = useState(true);
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /**
   * Helper: Check if user has permission OR is an Admin.
   * Wrapped in useCallback to prevent unnecessary re-renders of the useEffect.
   */
  const can = useCallback((perm) => {
    // If you don't use 'superadmin', you can remove that check.
    if (user?.role === 'admin' || user?.role === 'superadmin') return true;
    return user?.permissions?.includes(perm);
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Use Promise.all to fetch counts in parallel for better performance
        const requests = [];

        // Check for 'staff_read' permission to fetch user stats
        if (can('staff_read')) {
          requests.push(
            API.get('/users').then(res => {
              const staffMembers = res.data.filter(u => u.role === 'staff');
              setStaffCount(staffMembers.length);
            })
          );
        }

        // Check for 'tasks_read' permission to fetch task stats
        if (can('tasks_read')) {
          requests.push(
            API.get('/tasks').then(res => {
              const activeTasks = res.data.filter(task => 
                task.status === 'Pending' || task.status === 'In Progress'
              );
              setActiveTaskCount(activeTasks.length);
            })
          );
        }

        await Promise.all(requests);

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, can]); // 'can' is now a stable dependency

  if (loading) return (
    <div className="flex justify-center items-center p-20 text-gray-500 font-medium">
      Loading Dashboard Stats...
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          Welcome, {user?.name || 'User'}
        </h1>
        <p className="text-gray-500 capitalize font-medium">
          {user?.role} Overview
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Staff Count Card */}
        {can('staff_read') && (
          <div 
            onClick={() => navigate('/admin/staff')} 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Staff</h2>
                <p className="text-4xl font-black text-gray-900 mt-2">{staffCount}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600 font-bold group-hover:underline">
              View Directory →
            </div>
          </div>
        )}

        {/* Active Tasks Count Card */}
        {can('tasks_read') && (
          <div 
            onClick={() => navigate('/tasks')} 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-green-400 transition-all group"
          >
            <div className="flex justify-between items-start">
               <div>
                 <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Tasks</h2>
                 <p className="text-4xl font-black text-gray-900 mt-2">{activeTaskCount}</p>
               </div>
               <div className="p-3 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                 <ClipboardList size={24} />
               </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600 font-bold group-hover:underline">
              Manage Tasks →
            </div>
          </div>
        )}

        {/* System Status Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all">
          <div className="flex justify-between items-start">
             <div>
               <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Status</h2>
               <div className="flex items-center gap-2 mt-3">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <p className="text-lg font-bold text-gray-800">Live & Connected</p>
               </div>
             </div>
             <div className="p-3 bg-gray-50 text-gray-400 rounded-lg">
               <Activity size={24} />
             </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 italic">Updated in real-time</p>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;