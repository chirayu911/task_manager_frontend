import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Loader, CheckCircle, AlertTriangle, Upload, ShieldAlert, ZapOff } from 'lucide-react';
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

  // 1. Initialize simple constants
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
  
  // ⭐ UPDATED: Usage state to handle new subscription fields
  const [usage, setUsage] = useState({
    current: 0,
    max: -1,
    hasBulkUpload: false
  });

  // 3. Initialize Permissions
  const roleName = useMemo(() => typeof user?.role === 'object' ? user.role?.name : user?.role, [user]);
  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === 'admin' || roleName === 'superadmin' || perms.includes('*'), [roleName, perms]);
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  // 4. CALL THE HOOK
  const { 
    tasks, setTasks, staffList, statusList, 
    pageLoading, handleInlineUpdate, fetchTasks, totalItems 
  } = useTasks(user, socket, isAdmin, can, setFeedback, activeProjectId, typeLabel);

  // ⭐ UPDATED: Fetch detailed usage including Bulk Upload permission
  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await API.get('/company/usage');
      if (data?.tasks) {
        setUsage({
          current: data.tasks.current,
          max: data.tasks.limit, // mapped from 'limit' in controller
          hasBulkUpload: data.hasBulkUpload // mapped from controller
        });
      }
    } catch (err) {
      console.error("Failed to fetch usage limits", err);
    }
  }, [user]);

  // Intercept success messages passed from the Form page
  useEffect(() => {
    if (location.state?.feedback) {
      setFeedback(location.state.feedback);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(location.pathname, { replace: true, state: {} });
      fetchUsage(); 
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    }
  }, [location, navigate, fetchUsage]);

  // 5. UseEffects and Handlers
  useEffect(() => {
    if (activeProjectId && typeof fetchTasks === 'function') {
      fetchTasks(currentPage, itemsPerPage);
      fetchUsage(); 
    }
  }, [currentPage, itemsPerPage, activeProjectId, fetchTasks, fetchUsage]);

  const openDeleteModal = (id) => {
    setTaskToDelete(id);
    setIsModalOpen(true);
  };

  const notify = (type, message) => {
    setFeedback({ type, message });
    if (type === 'success') {
      fetchUsage(); 
      setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/tasks/${taskToDelete}`);
      setTasks(prev => prev.filter(t => t._id !== taskToDelete));
      setFeedback({ type: 'success', message: `${typeLabel} deleted successfully` });
      fetchUsage(); 
    } catch (err) {
      setFeedback({ type: 'error', message: "Delete failed" });
    }
    setIsModalOpen(false);
  };

  // ⭐ SUBSCRIPTION LOGIC
  const isLimitReached = usage.max !== -1 && usage.current >= usage.max;

  const handleCreateClick = () => {
    if (isLimitReached) {
      setFeedback({ 
        type: 'error', 
        message: `Plan Limit Reached: You have reached your limit of ${usage.max} tasks. Please upgrade your plan to add more.` 
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate(`${basePath}/create`);
  };

  const handleBulkClick = () => {
    // Check if feature is even enabled for this plan
    if (!usage.hasBulkUpload) {
      setFeedback({ 
        type: 'error', 
        message: "Feature Restricted: Your current plan does not include Bulk Import. Please upgrade to use this feature." 
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Check if limit is reached
    if (isLimitReached) {
      setFeedback({ 
        type: 'error', 
        message: `Plan Limit Reached: You cannot import more items. (Limit: ${usage.max})` 
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsBulkOpen(true);
  };

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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HeaderIcon className={isIssueMode ? "text-red-500" : "text-blue-600"} /> {typeLabel} Board
          </h2>
          
          {/* ⭐ ENHANCED: Plan Usage Badge */}
          {usage.max !== -1 && (
            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${isLimitReached ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
              <ShieldAlert size={12} />
              Plan Usage: {usage.current} / {usage.max} {typeLabel}s
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {can('tasks_create') && (
            <button 
              onClick={handleBulkClick} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-sm active:scale-95 ${
                !usage.hasBulkUpload 
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {usage.hasBulkUpload ? <Upload size={18} /> : <ZapOff size={18} />}
              Bulk Upload {!usage.hasBulkUpload && "(PRO)"}
            </button>
          )}
          {can('tasks_create') && (
            <CreateButton 
              onClick={handleCreateClick} 
              label={`Add ${typeLabel}`} 
              disabled={isLimitReached}
            />
          )}
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