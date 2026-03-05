import React, { useState, useCallback, useMemo } from 'react';
import { Loader, AlertTriangle } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
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

export default function IssuePage({ user, socket, activeProjectId }) {
  const navigate = useNavigate();

  // ⭐ Configuration for Issue Mode
  const typeLabel = 'Issue';
  const HeaderIcon = AlertTriangle;

  // Search, Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all_tasks"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal & Feedback States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Memoized Permissions
  const roleName = useMemo(() => typeof user?.role === 'object' ? user.role?.name : user?.role, [user]);
  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = roleName === 'admin' || roleName === 'superadmin' || perms.includes('*');
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  // ⭐ Hook fetches data where itemType === 'Issue'
  const { 
    tasks: issues, setTasks: setIssues, staffList, statusList, 
    pageLoading, handleInlineUpdate 
  } = useTasks(user, socket, isAdmin, can, setFeedback, activeProjectId, typeLabel);

  const openDeleteModal = (id) => {
    setItemToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/tasks/${itemToDelete}`);
      setIssues(prev => prev.filter(t => t._id !== itemToDelete));
      setFeedback({ type: 'success', message: "Issue deleted successfully" });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: "Delete failed" });
    }
    setIsModalOpen(false);
  };

  const filteredIssues = useMemo(() => {
    return (issues || []).filter(issue => {
      const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesUserFilter = true;
      if (filterMode === "my_tasks") {
        const isAssigned = (issue.assignedTo?._id || issue.assignedTo) === user._id;
        const isMentioned = issue.mentionedUsers?.some(mention => (mention?._id || mention) === user._id);
        matchesUserFilter = isAssigned || isMentioned;
      } 
      else if (filterMode === "unassigned") {
        matchesUserFilter = !issue.assignedTo; 
      } 
      else if (filterMode !== "all_tasks") {
        matchesUserFilter = (issue.assignedTo?._id || issue.assignedTo) === filterMode;
      }

      return matchesSearch && matchesUserFilter;
    });
  }, [issues, searchTerm, filterMode, user._id]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredIssues.slice(firstIndex, lastIndex);
  }, [filteredIssues, currentPage, itemsPerPage]);

  if (!user) return null;

  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Project Selected</h2>
        <p className="text-gray-500">Please select a project from the top navigation bar to view its issues.</p>
      </div>
    );
  }

  if (pageLoading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-red-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <Declaration type={feedback.type} message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <HeaderIcon className="text-red-500" /> Issue Board
          </h2>
          <p className="text-gray-500 text-sm mt-1">Track and resolve project blockers and bugs</p>
        </div>
        {can('tasks_create') && (
          <CreateButton onClick={() => navigate("/issues/create")} label="Report Issue" />
        )}
      </div>

      <TaskFilterBar 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        filterMode={filterMode} 
        setFilterMode={setFilterMode} 
        setCurrentPage={setCurrentPage} 
        staffList={staffList} 
        typeLabel="Issue"
      />

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
          basePath="/issues" 
        />

        <TableControls
          currentPage={currentPage}
          totalItems={filteredIssues.length}
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
        title="Delete Issue"
        message="Are you sure you want to delete this issue? This action cannot be undone."
      />
    </div>
  );
}