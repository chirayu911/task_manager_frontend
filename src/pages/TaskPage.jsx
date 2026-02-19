import React, { useState, useEffect, useCallback } from 'react';
import { Loader, CheckCircle, Plus, Edit2, Trash2, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';

export default function TaskPage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  // Normalize role and check admin status
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const perms = user?.permissions || [];
  const isAdmin = roleName === 'admin' || perms.includes('*');

  // Permission helper for UI elements
  const can = useCallback((perm) => {
    if (!user) return false;
    return isAdmin || perms.includes(perm);
  }, [user, isAdmin, perms]);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      setPageLoading(true);
      
      // Fetch Tasks and Statuses
      const [tasksRes, statusesRes] = await Promise.all([
        API.get('/tasks'),
        API.get('/task-statuses')
      ]);

      setStatusList(statusesRes.data.filter(s => s.status === 'active'));

      let filtered = tasksRes.data;
      if (!isAdmin) {
        filtered = tasksRes.data.filter(t => (t.assignedTo?._id || t.assignedTo) === user._id);
      }
      setTasks(filtered);

      if (isAdmin) {
        const { data: usersData } = await API.get('/users');
        setStaffList(usersData.filter(u => {
          const rName = typeof u.role === 'object' ? u.role?.name : u.role;
          return rName === 'staff' || rName === 'admin';
        }));
      }
    } catch (err) { 
      toast.error("Failed to load tasks");
    } finally { 
      setPageLoading(false); 
    }
  }, [user, isAdmin]);

  useEffect(() => { 
    if (user) fetchTasks(); 
  }, [fetchTasks, user]);

  const handleInlineUpdate = async (taskId, field, value) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => {
        if (t._id === taskId) {
          if (field === 'status') {
             const newStatus = statusList.find(s => s._id === value);
             return { ...t, status: newStatus || value };
          }
          return { ...t, [field]: value };
        }
        return t;
      }));

      const val = (field === 'assignedTo' && value === "") ? null : value;
      await API.put(`/tasks/${taskId}`, { [field]: val });
      toast.success("Updated");
    } catch (err) {
      toast.error("Update failed");
      fetchTasks();
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await API.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  if (!user) return null;

  if (pageLoading) return (
    <div className="flex justify-center p-20 h-screen">
      <Loader className="animate-spin text-blue-600" size={40}/>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle className="text-blue-600"/> Task Board
        </h2>
        {can('tasks_create') && (
          <button 
            onClick={() => navigate("/tasks/create")} 
            className="bg-blue-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus size={18}/> Add Task
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tasks.length > 0 ? tasks.map(task => (
              <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-800">{task.title}</td>
                <td className="px-6 py-4">
                  {isAdmin ? (
                    <select 
                      value={task.assignedTo?._id || task.assignedTo || ''} 
                      onChange={(e) => handleInlineUpdate(task._id, 'assignedTo', e.target.value)}
                      className="border border-gray-200 p-1.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                       <UserIcon size={14} className="text-gray-400" /> {task.assignedTo?.name || "Unassigned"}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                   <select 
                      value={task.status?._id || task.status || ''} 
                      onChange={(e) => handleInlineUpdate(task._id, 'status', e.target.value)}
                      disabled={!can('tasks_update')}
                      className="border border-gray-200 p-1.5 rounded text-sm bg-white outline-none disabled:bg-gray-50"
                    >
                      <option value="" disabled>Select Status</option>
                      {statusList.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {can('tasks_update') && (
                      <button onClick={() => navigate(`/tasks/edit/${task._id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                    )}
                    {can('tasks_delete') && (
                      <button onClick={() => deleteTask(task._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="p-20 text-center text-gray-400">No tasks found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}