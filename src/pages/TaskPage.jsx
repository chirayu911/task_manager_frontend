import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader, CheckCircle, User as UserIcon, FileText } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal'; 
import Declaration from '../components/Declaration';  

export default function TaskPage({ user, socket }) {
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Search, Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("my_tasks");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal & Feedback States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const navigate = useNavigate();

  // Memoized values
  const roleName = useMemo(() =>
    typeof user?.role === 'object' ? user.role?.name : user?.role,
  [user]);

  const perms = useMemo(() => user?.permissions || [], [user]);

  const isAdmin = useMemo(() =>
    roleName === 'admin' || perms.includes('*'),
  [roleName, perms]);

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
      setTasks(tasksRes.data);

      if (isAdmin || can('tasks_update')) {
        const { data: usersData } = await API.get('/users');
        setStaffList(usersData.filter(u => (u.role?.name || u.role) !== 'customer'));
      }
    } catch (err) {
      setFeedback({ type: 'error', message: "Failed to load tasks" });
    } finally {
      setPageLoading(false);
    }
  }, [user, isAdmin, can]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Real-time Updates Setup
  useEffect(() => {
    if (socket) {
      socket.on("taskCreated", fetchTasks);
      socket.on("taskUpdated", fetchTasks);
      socket.on("taskDeleted", fetchTasks);
      return () => {
        socket.off("taskCreated", fetchTasks);
        socket.off("taskUpdated", fetchTasks);
        socket.off("taskDeleted", fetchTasks);
      };
    }
  }, [socket, fetchTasks]);

  // Modal Handling
  const openDeleteModal = (id) => {
    setTaskToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/tasks/${taskToDelete}`);
      setTasks(prev => prev.filter(t => t._id !== taskToDelete));
      setFeedback({ type: 'success', message: "Task deleted successfully" });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: "Delete failed" });
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesUserFilter = true;
      if (filterMode === "my_tasks") {
        const isAssigned = (task.assignedTo?._id || task.assignedTo) === user._id;
        const isMentioned = task.mentionedUsers?.some(mention => (mention?._id || mention) === user._id);
        matchesUserFilter = isAssigned || isMentioned;
      }
      return matchesSearch && matchesUserFilter;
    });
  }, [tasks, searchTerm, filterMode, user._id]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredTasks.slice(firstIndex, lastIndex);
  }, [filteredTasks, currentPage, itemsPerPage]);

  const handleInlineUpdate = async (taskId, field, value) => {
    try {
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, [field]: value } : t));
      await API.put(`/tasks/${taskId}`, { [field]: value });
      setFeedback({ type: 'success', message: "Updated successfully" });
      setTimeout(() => setFeedback({ type: '', message: '' }), 2000);
    } catch (err) {
      setFeedback({ type: 'error', message: "Update failed" });
      fetchTasks();
    }
  };

  if (!user) return null;
  if (pageLoading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Declaration
        type={feedback.type}
        message={feedback.message}
        onClose={() => setFeedback({ type: '', message: '' })}
      />

      {/* Header Row: Title & Create Button */}
      <div className="flex justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <CheckCircle className="text-blue-600" /> Task Board
          </h2>
          <p className="text-gray-500 text-sm">Monitor team progress and status changes</p>
        </div>
        {can('tasks_create') && (
          <CreateButton onClick={() => navigate("/tasks/create")} label="Add Task" />
        )}
      </div>

      {/* ⭐ Filter Row: Search Left, Select Right */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 w-full">
        
        {/* Left Side: Search */}
        <div className="w-full sm:max-w-md">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search tasks by title..."
          />
        </div>

        {/* Right Side: Filter */}
        <select
          value={filterMode}
          onChange={(e) => {
            setFilterMode(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-48 h-[42px] border border-gray-200 rounded-xl px-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer shadow-sm"
        >
          <option value="my_tasks">My Tasks</option>
          <option value="all_tasks">All Tasks</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Details</th> 
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentTableData.length > 0 ? currentTableData.map(task => (
              <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-800">{task.title}</td>
                
                <td className="px-6 py-4">
                  <button
                    onClick={() => navigate(`/tasks/view/${task._id}`)}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-all border border-indigo-100 shadow-sm"
                  >
                    <FileText size={14} /> Read Content
                  </button>
                </td>

                <td className="px-6 py-4">
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
                  {(task.assignedTo?._id || task.assignedTo) !== user._id && task.mentionedUsers?.some(m => (m?._id || m) === user._id) && (
                    <span className="ml-2 inline-block bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Mentioned
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={task.status?._id || task.status || ''}
                    onChange={(e) => handleInlineUpdate(task._id, 'status', e.target.value)}
                    disabled={!can('tasks_update')}
                    className="border border-gray-200 p-2 rounded-lg text-sm bg-white disabled:bg-gray-100 outline-none cursor-pointer"
                  >
                    {statusList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {can('tasks_update') && <EditButton onClick={() => navigate(`/tasks/edit/${task._id}`)} />}
                    {can('tasks_delete') && <DeleteButton onClick={() => openDeleteModal(task._id)} />}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">
                  No tasks found. Try adjusting your filters or search.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <TableControls
          currentPage={currentPage}
          totalItems={filteredTasks.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onLimitChange={(newLimit) => {
            setItemsPerPage(newLimit);
            setCurrentPage(1);
          }}
        />
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  );
}