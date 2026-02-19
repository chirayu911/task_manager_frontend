import React, { useState, useEffect, useCallback } from 'react';
import { Loader, CheckCircle, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import Pagination from '../components/Pagination';

export default function TaskPage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  
  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  // Normalize role and permissions
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const perms = user?.permissions || [];
  const isAdmin = roleName === 'admin' || perms.includes('*');

  // Permission helper
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      setPageLoading(true);
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

      // ⭐ Updated: Fetch staff list if user is admin OR has tasks_update permission
      if (isAdmin || can('tasks_update')) {
        const { data: usersData } = await API.get('/users');
        setStaffList(usersData.filter(u => (u.role?.name || u.role) !== 'customer'));
      }
    } catch (err) { 
      toast.error("Failed to load tasks");
    } finally { 
      setPageLoading(false);
    }
  }, [user, isAdmin, can]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Logic: Search & Filter
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Logic: Pagination
  const currentTableData = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleInlineUpdate = async (taskId, field, value) => {
    try {
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, [field]: value } : t));
      await API.put(`/tasks/${taskId}`, { [field]: value });
      toast.success("Updated Successfully");
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
  if (pageLoading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <CheckCircle className="text-blue-600"/> Task Board
          </h2>
          <p className="text-gray-500 text-sm">Monitor team progress and status changes</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <SearchBar value={searchTerm} onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} placeholder="Search tasks by title..." />
          {can('tasks_create') && (
            <CreateButton onClick={() => navigate("/tasks/create")} label="Add Task" />
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentTableData.map(task => (
              <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-800">{task.title}</td>
                <td className="px-6 py-4">
                  {/* ⭐ Updated Logic: Dropdown visible for Admin OR users with tasks_update permission */}
                  {isAdmin || can('tasks_update') ? (
                    <select 
                      value={task.assignedTo?._id || task.assignedTo || ''} 
                      onChange={(e) => handleInlineUpdate(task._id, 'assignedTo', e.target.value)}
                      className="border border-gray-200 p-2 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20 w-full"
                    >
                      <option value="">Unassigned</option>
                      {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                       <UserIcon size={14} className="text-blue-500" /> {task.assignedTo?.name || "Unassigned"}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                   <select 
                      value={task.status?._id || task.status || ''} 
                      onChange={(e) => handleInlineUpdate(task._id, 'status', e.target.value)}
                      disabled={!can('tasks_update')}
                      className="border border-gray-200 p-2 rounded-lg text-sm bg-white disabled:bg-gray-100 outline-none"
                    >
                      {statusList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {can('tasks_update') && <EditButton onClick={() => navigate(`/tasks/edit/${task._id}`)} />}
                    {can('tasks_delete') && <DeleteButton onClick={() => deleteTask(task._id)} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <Pagination 
          currentPage={currentPage} 
          totalItems={filteredTasks.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </div>
  );
}