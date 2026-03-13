import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Loader, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';

// Components
import { CreateButton } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal'; 
import Declaration from '../components/Declaration';  
import TaskFilterBar from '../components/TaskFilterBar';
import TaskTable from '../components/TaskTable';
import BulkUploadModal from '../components/BulkUploadModal';

// Hooks
import { useTasks } from '../hooks/useTasks';

export default function TaskPage({ user, socket, activeProjectId }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Initialize simple constants first
  const isIssueMode = location.pathname.includes('/issues');
  const typeLabel = isIssueMode ? 'Issue' : 'Task';
  const basePath = isIssueMode ? '/issues' : '/tasks';
  const HeaderIcon = isIssueMode ? AlertTriangle : CheckCircle;

  // 2. Initialize State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all_tasks"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // 3. Initialize Permissions
  const roleName = useMemo(() => typeof user?.role === 'object' ? user.role?.name : user?.role, [user]);
  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === 'admin' || roleName === 'superadmin' || perms.includes('*'), [roleName, perms]);
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  // 4. ⭐ CALL THE HOOK (Must happen BEFORE using fetchTasks)
  const { 
    tasks, setTasks, staffList, statusList, 
    pageLoading, handleInlineUpdate, fetchTasks, totalItems 
  } = useTasks(user, socket, isAdmin, can, setFeedback, activeProjectId, typeLabel);

  // 5. UseEffects and Handlers (Safe to use fetchTasks now)
  useEffect(() => {
    if (activeProjectId && typeof fetchTasks === 'function') {
      fetchTasks(currentPage, itemsPerPage);
    }
  }, [currentPage, itemsPerPage, activeProjectId, fetchTasks]);

  const openDeleteModal = (id) => {
    setTaskToDelete(id);
    setIsModalOpen(true);
  };

  const notify = (type, message) => {
    setFeedback({ type, message });
    if (type === 'success') {
      setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/tasks/${taskToDelete}`);
      setTasks(prev => prev.filter(t => t._id !== taskToDelete));
      setFeedback({ type: 'success', message: `${typeLabel} deleted successfully` });
    } catch (err) {
      setFeedback({ type: 'error', message: "Delete failed" });
    }
    setIsModalOpen(false);
  };

  // 6. Local UI Logic (Uses tasks from the hook)
  const currentTableData = useMemo(() => {
    return (tasks || []).filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  if (!user) return null;

  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Project Selected</h2>
        <p className="text-gray-500">Please select a project to view its {typeLabel.toLowerCase()}s.</p>
      </div>
    );
  }

  if (pageLoading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <Declaration type={feedback.type} message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <HeaderIcon className={isIssueMode ? "text-red-500" : "text-blue-600"} /> {typeLabel} Board
        </h2>
        <div className="flex items-center gap-3">
          {can('tasks_create') && (
            <button onClick={() => setIsBulkOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold">
              <Upload size={18} /> Bulk Upload
            </button>
          )}
          {can('tasks_create') && <CreateButton onClick={() => navigate(`${basePath}/create`)} label={`Add ${typeLabel}`} />}
        </div>
      </div>

      <TaskFilterBar 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
        filterMode={filterMode} setFilterMode={setFilterMode} 
        setCurrentPage={setCurrentPage} staffList={staffList} typeLabel={typeLabel}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <TaskTable 
          currentTableData={currentTableData} user={user} isAdmin={isAdmin} can={can} staffList={staffList}
          statusList={statusList} handleInlineUpdate={handleInlineUpdate} openDeleteModal={openDeleteModal} navigate={navigate} basePath={basePath} 
        />

        <TableControls
          currentPage={currentPage} totalItems={totalItems} itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onLimitChange={(newLimit) => { setItemsPerPage(newLimit); setCurrentPage(1); }}
        />
      </div>

      <BulkUploadModal 
        isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} activeProjectId={activeProjectId}
        type={isIssueMode ? 'issue' : 'task'} onRefresh={() => fetchTasks(1, itemsPerPage)} notify={notify}
      />

      <ConfirmModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleDelete}
        title={`Delete ${typeLabel}`} message={`Confirm deletion of this ${typeLabel.toLowerCase()}.`}
      />
    </div>
  );
}