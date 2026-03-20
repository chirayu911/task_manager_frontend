import React, { useState, useEffect } from 'react';
import { Users, FolderKanban, ClipboardList, FileText, Zap } from 'lucide-react';
import API from '../api';
import UsageCard from '../components/UsageCard';

export default function AdminDashboard({ user }) {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { data } = await API.get('/company/usage');
        setUsage(data);
      } catch (err) {
        console.error("Stats fetch failed");
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  if (loading) return <div>Loading Analytics...</div>;

  return (
    <div className="space-y-8">
      {/* Header with Plan Badge */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Workspace Overview</h1>
          <p className="text-gray-500">Real-time subscription usage for your organization.</p>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20">
          <Zap size={18} fill="currentColor" />
          <span className="text-sm font-bold uppercase tracking-widest">{usage?.planName || 'Standard'} Plan</span>
        </div>
      </div>

      {/* Usage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UsageCard 
          title="Staff Members" 
          current={usage?.staff.current} 
          limit={usage?.staff.limit} 
          icon={Users} 
        />
        <UsageCard 
          title="Total Projects" 
          current={usage?.projects.current} 
          limit={usage?.projects.limit} 
          icon={FolderKanban} 
        />
        <UsageCard 
          title="Active Tasks" 
          current={usage?.tasks.current} 
          limit={usage?.tasks.limit} 
          icon={ClipboardList} 
        />
        <UsageCard 
          title="Documents" 
          current={usage?.documents.current} 
          limit={usage?.documents.limit} 
          icon={FileText} 
        />
      </div>
      
      {/* Rest of your dashboard (Charts, Recent Activity, etc.) */}
    </div>
  );
}