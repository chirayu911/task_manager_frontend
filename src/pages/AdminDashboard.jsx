import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Activity, Loader } from 'lucide-react';
import API from '../api';

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [memberCount, setMemberCount] = useState(0); // ⭐ Renamed for clarity
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Logic: Normalize user roles and permissions
  const roleName = useMemo(() => 
    typeof user?.role === 'object' ? user.role?.name : user?.role, 
  [user]);

  const perms = useMemo(() => user?.permissions || [], [user]);

  const isAdmin = useMemo(() => 
    roleName === 'admin' || perms.includes('*'), 
  [roleName, perms]);

  const can = useCallback((perm) => 
    isAdmin || perms.includes(perm), 
  [isAdmin, perms]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        setLoading(true);
        
        // Fetch users and tasks in parallel
        const [usersRes, tasksRes] = await Promise.all([
          API.get('/users'),
          API.get('/tasks')
        ]);

        // ⭐ Logic: Count all roles (Manager, Staff, etc.) EXCEPT Admin
        const nonAdminMembers = usersRes.data.filter(u => {
          const uRole = typeof u.role === 'object' ? u.role?.name : u.role;
          const normalizedRole = uRole?.toLowerCase();
          return normalizedRole !== 'admin'; 
        });
        setMemberCount(nonAdminMembers.length);

        // ⭐ Logic: Count ALL tasks EXCEPT 'Completed'
        const totalExceptCompleted = tasksRes.data.filter(task => {
          const sName = typeof task.status === 'object' ? task.status?.name : task.status;
          // Normalize to lowercase for safer comparison
          return sName?.toLowerCase() !== 'completed';
        });
        setActiveTaskCount(totalExceptCompleted.length);

      } catch (error) {
        console.error("Dashboard Stats Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, can]);

  if (loading) return (
    <div className="flex flex-col justify-center items-center p-20 min-h-[400px]">
      <Loader className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-gray-500 font-medium">Updating system metrics...</p>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          Welcome back, {user?.name || 'User'}
        </h1>
        <p className="text-gray-500 capitalize font-medium mt-1">
          {roleName} System Overview
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Member Count Card */}
        {can('staff_read') && (
          <div 
            onClick={() => navigate('/admin/staff')} 
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Members</h2>
                <p className="text-5xl font-black text-gray-900 mt-3">{memberCount}</p>
              </div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Users size={28} />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm text-blue-600 font-bold group-hover:gap-2 transition-all italic">
              Managers & Staff (Excludes Admins)
            </div>
          </div>
        )}

        {/* Task Count Card */}
        {can('tasks_read') && (
          <div 
            onClick={() => navigate('/tasks')} 
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className="flex justify-between items-start">
               <div>
                 <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">In-Progress Tasks</h2>
                 <p className="text-5xl font-black text-gray-900 mt-3">{activeTaskCount}</p>
               </div>
               <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-all">
                 <ClipboardList size={28} />
               </div>
            </div>
            <div className="mt-6 flex items-center text-sm text-green-600 font-bold group-hover:gap-2 transition-all italic">
              Excludes Completed Status
            </div>
          </div>
        )}

        {/* System Status Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all">
          <div className="flex justify-between items-start">
             <div>
               <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Environment</h2>
               <div className="flex items-center gap-3 mt-4">
                 <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                 <p className="text-xl font-bold text-gray-800">Operational</p>
               </div>
             </div>
             <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl">
               <Activity size={28} />
             </div>
          </div>
          <p className="text-xs text-gray-400 mt-6 font-medium italic">Data synced via WebSockets</p>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;