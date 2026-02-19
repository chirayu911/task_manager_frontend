import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle } from 'lucide-react';
import API from '../api';

export default function StaffDashboard({ user }) {
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/tasks');
        
        // Filter tasks assigned to THIS user
        const myTasks = data.filter(t => 
          t.assignedTo?._id === user._id || t.assignedTo === user._id
        );

        // Calculate Counts
        const pending = myTasks.filter(t => t.status === 'Pending').length;
        const inProgress = myTasks.filter(t => t.status === 'In Progress').length;
        const completed = myTasks.filter(t => t.status === 'Completed').length;

        setStats({ pending, inProgress, completed });
      } catch (err) {
        console.error("Failed to load dashboard stats");
      }
    };

    fetchStats();
  }, [user._id]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name}</h1>
        <p className="text-gray-500 mt-2">Here is an overview of your assigned work.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PENDING TASKS CARD  */}
        <div 
          onClick={() => navigate('/tasks')}
          className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 font-medium mb-1">Pending Tasks</p>
              <h2 className="text-4xl font-bold text-gray-800 group-hover:text-yellow-600 transition-colors">
                {stats.pending}
              </h2>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600">
              <Clock size={24} />
            </div>
          </div>
        </div>

        {/* IN PROGRESS CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-medium mb-1">In Progress</p>
              <h2 className="text-3xl font-bold text-gray-700">{stats.inProgress}</h2>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-500">
              <ClipboardList size={24} />
            </div>
          </div>
        </div>

        {/* COMPLETED CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-medium mb-1">Completed</p>
              <h2 className="text-3xl font-bold text-gray-700">{stats.completed}</h2>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-500">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}