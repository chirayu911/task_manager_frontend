import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, User, Box, CheckCircle2, AlertCircle, FileText, 
  Clock 
} from 'lucide-react';
import API from '../api';
import moment from 'moment';

export default function ActivityLogPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // ⭐ Define fetchLogs as a memoized function or inside useEffect
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/activities/mine');
      // Ensure data is an array before setting state
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Logs failed", err);
      setActivities([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getIcon = (type) => {
    switch (type) {
      case 'task': return <CheckCircle2 size={16} className="text-blue-500" />;
      case 'issue': return <AlertCircle size={16} className="text-red-500" />;
      case 'document': return <FileText size={16} className="text-emerald-500" />;
      case 'project': return <Box size={16} className="text-purple-500" />;
      default: return <History size={16} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex justify-center">
        <History className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <History size={32} className="text-primary-600" /> Activity Stream
          </h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Real-time updates across your projects
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
          {['all', 'task', 'issue', 'project', 'document'].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)} 
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === f ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {activities
          .filter(log => filter === 'all' || log.resourceType === filter)
          .map((log) => (
          <div key={log._id} className="group relative flex gap-6 p-5 bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-primary-500/5 transition-all">
            <div className="absolute left-9 top-16 bottom-0 w-px bg-gray-100 dark:bg-gray-700 group-last:hidden" />
            
            <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-gray-100 dark:border-gray-800">
              {getIcon(log.resourceType)}
            </div>

            <div className="flex-1 pt-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {log.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <User size={12} /> {log.user?.name || 'System'} • <Clock size={12} /> {moment(log.createdAt).fromNow()}
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-400">
                  {log.resourceType}
                </span>
              </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800">
            <History size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No recent activity found</p>
          </div>
        )}
      </div>
    </div>
  );
}