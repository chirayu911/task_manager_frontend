import React, { useState, useCallback, useMemo } from 'react';
import { Loader, CheckCircle, AlertTriangle } from 'lucide-react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';

// Components
import { CreateButton } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal'; 
import Declaration from '../components/Declaration';  
import TaskFilterBar from '../components/TaskFilterBar';
import TaskTable from '../components/TaskTable';

// Hooks
import { useTasks } from '../hooks/useTasks';

export default function TaskPage({ user, socket, activeProjectId }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ⭐ DYNAMIC CONFIGURATION: Detect Task vs Issue mode from URL
  const isIssueMode = location.pathname.includes('/issues');
  const typeLabel = isIssueMode ? 'Issue' : 'Task';
  const basePath = isIssueMode ? '/issues' : '/tasks';
  const HeaderIcon = isIssueMode ? AlertTriangle : CheckCircle;

  // Search, Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all_tasks"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal & Feedback States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Memoized Permissions
  const roleName = useMemo(() => typeof user?.role === 'object' ? user.role?.name : user?.role, [user]);
  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === 'admin' || roleName === 'superadmin' || perms.includes('*'), [roleName, perms]);
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  // ⭐ CUSTOM HOOK: Passes 'typeLabel' (Task or Issue) to the backend query
  const { 
    tasks, setTasks, staffList, statusList, 
    pageLoading, handleInlineUpdate 
  } = useTasks(user, socket, isAdmin, can, setFeedback, activeProjectId, typeLabel);

  // Modal Handling
  const openDeleteModal = (id) => {
    setTaskToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/tasks/${taskToDelete}`);
      setTasks(prev => prev.filter(t => t._id !== taskToDelete));
      setFeedback({ type: 'success', message: `${typeLabel} deleted successfully` });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: "Delete failed" });
    }
    setIsModalOpen(false);
  };

  // Filter Logic (Search + Dropdown)
  const filteredTasks = useMemo(() => {
    return (tasks || []).filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesUserFilter = true;
      if (filterMode === "my_tasks") {
        const isAssigned = (task.assignedTo?._id || task.assignedTo) === user._id;
        const isMentioned = task.mentionedUsers?.some(mention => (mention?._id || mention) === user._id);
        matchesUserFilter = isAssigned || isMentioned;
      } 
      else if (filterMode === "unassigned") {
        matchesUserFilter = !task.assignedTo; 
      } 
      else if (filterMode !== "all_tasks") {
        matchesUserFilter = (task.assignedTo?._id || task.assignedTo) === filterMode;
      }

      return matchesSearch && matchesUserFilter;
    });
  }, [tasks, searchTerm, filterMode, user._id]);

  // Pagination Logic
  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredTasks.slice(firstIndex, lastIndex);
  }, [filteredTasks, currentPage, itemsPerPage]);

  // Safety return
  if (!user) return null;

  // Guard: Requirement for project selection
  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Project Selected</h2>
        <p className="text-gray-500">Please select a project from the top navigation bar to view its {typeLabel.toLowerCase()}s.</p>
      </div>
    );
  }

  if (pageLoading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <Declaration type={feedback.type} message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <HeaderIcon className={isIssueMode ? "text-red-500" : "text-blue-600"} /> 
            {typeLabel} Board
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isIssueMode ? 'Track and resolve project blockers' : 'Monitor project progress and team tasks'}
          </p>
        </div>
        {can('tasks_create') && (
          <CreateButton 
            onClick={() => navigate(`${basePath}/create`)} 
            label={isIssueMode ? "Report Issue" : "Add Task"} 
          />
        )}
      </div>

      {/* Filter Component */}
      <TaskFilterBar 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        filterMode={filterMode} 
        setFilterMode={setFilterMode} 
        setCurrentPage={setCurrentPage} 
        staffList={staffList} 
        typeLabel={typeLabel}
      />

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <TaskTable 
          currentTableData={currentTableData}
          user={user}
          isAdmin={isAdmin}
          can={can}
          staffList={staffList}
          statusList={statusList}
          handleInlineUpdate={handleInlineUpdate}
          openDeleteModal={openDeleteModal}
          navigate={navigate}
          basePath={basePath} 
        />

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
        title={`Delete ${typeLabel}`}
        message={`Are you sure you want to delete this ${typeLabel.toLowerCase()}? This action cannot be undone.`}
      />
    </div>
  );
}