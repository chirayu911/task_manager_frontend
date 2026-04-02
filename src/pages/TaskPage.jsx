import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Loader, CheckCircle, AlertTriangle, Upload, ShieldAlert, 
  ZapOff, LayoutGrid, List, User, Clock, ExternalLink 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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

  // 1. Constants
  const isIssueMode = location.pathname.includes('/issues');
  const typeLabel = isIssueMode ? 'Issue' : 'Task';
  const basePath = isIssueMode ? '/issues' : '/tasks';
  const HeaderIcon = isIssueMode ? AlertTriangle : CheckCircle;

  // 2. State
  const [viewMode, setViewMode] = useState("kanban"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all_tasks"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [usage, setUsage] = useState({ current: 0, max: -1, hasBulkUpload: false });

  // 3. Permissions & Notify
  const roleName = useMemo(() => typeof user?.role === 'object' ? user.role?.name : user?.role, [user]);
  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === 'admin' || roleName === 'superadmin' || perms.includes('*'), [roleName, perms]);
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  const notify = useCallback((type, message) => {
    setFeedback({ type, message });
    if (type === 'success') {
      setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    }
  }, []);

  // 4. Hook Data
  const { 
    tasks, setTasks, staffList, statusList, 
    pageLoading, handleInlineUpdate, fetchTasks, totalItems 
  } = useTasks(user, socket, isAdmin, can, setFeedback, activeProjectId, typeLabel);

  // ⭐ CRITICAL FIX: Define currentTableData BEFORE it is used in the return statement
  const currentTableData = useMemo(() => {
    return (tasks || []).filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await API.get('/company/usage');
      if (data?.tasks) {
        setUsage({
          current: data.tasks.current,
          max: data.tasks.limit,
          hasBulkUpload: data.hasBulkUpload
        });
      }
    } catch (err) {
      console.error("Usage sync failure", err);
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.feedback) {
      setFeedback(location.state.feedback);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(location.pathname, { replace: true, state: {} });
      fetchUsage(); 
    }
  }, [location, navigate, fetchUsage]);

  useEffect(() => {
    if (activeProjectId && typeof fetchTasks === 'function') {
      // If in Kanban mode, we fetch a large limit to show all cards across columns
      fetchTasks(viewMode === 'table' ? currentPage : 1, viewMode === 'table' ? itemsPerPage : 1000);
      fetchUsage(); 
    }
  }, [currentPage, itemsPerPage, activeProjectId, fetchTasks, fetchUsage, viewMode]);

  const handleDelete = async () => {
    try {
      await API.delete(`/tasks/${taskToDelete}`);
      setTasks(prev => prev.filter(t => t._id !== taskToDelete));
      notify('success', `${typeLabel} terminated successfully.`);
      fetchUsage(); 
    } catch (err) {
      notify('error', "Deletion sequence failed.");
    }
    setIsModalOpen(false);
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const originalTasks = [...tasks];
    setTasks(tasks.map(t => t._id === draggableId ? { ...t, status: destination.droppableId } : t));

    try {
      await API.put(`/tasks/${draggableId}`, { status: destination.droppableId });
      notify('success', `Status synced: ${statusList.find(s => s._id === destination.droppableId)?.name}`);
    } catch (err) {
      setTasks(originalTasks); 
      notify('error', "Status synchronization failed.");
    }
  };

  const isLimitReached = usage.max !== -1 && usage.current >= usage.max;

  if (!user) return null;

  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white dark:bg-gray-800 rounded-[32px] border-2 border-dashed border-gray-100 dark:border-gray-700">
        <HeaderIcon size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
        <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Node Selection Required</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Initialize a project node to view the control plane.</p>
      </div>
    );
  }

  if (pageLoading) return (
    <div className="flex flex-col items-center justify-center p-20 min-h-[400px]">
      <Loader className="animate-spin text-primary-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Accessing Data Stream...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-full mx-auto min-h-screen transition-colors">
      <Declaration type={feedback.type} message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
            <HeaderIcon className="text-primary-600" size={36} /> 
            {typeLabel} Control Plane
          </h2>
          
          {usage.max !== -1 && (
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${isLimitReached ? 'bg-red-50 text-red-600 border-red-100' : 'bg-primary-50 text-primary-600 border-primary-100'}`}>
              <ShieldAlert size={14} />
              Resource Allocation: {usage.current} / {usage.max}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-[20px] border border-gray-200 dark:border-gray-700 shadow-inner">
            <button 
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={14} strokeWidth={3} /> Kanban
            </button>
            <button 
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={14} strokeWidth={3} /> Table
            </button>
          </div>

          {can('tasks_create') && (
            <button 
              onClick={() => !usage.hasBulkUpload ? notify('error', 'Upgrade Required') : setIsBulkOpen(true)} 
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border shadow-sm active:scale-95 ${!usage.hasBulkUpload ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100' : 'bg-white dark:bg-gray-800 text-primary-600 border-primary-100 hover:bg-primary-50'}`}
            >
              {!usage.hasBulkUpload ? <ZapOff size={16} /> : <Upload size={16} />} 
              Batch Injection
            </button>
          )}
          
          {can('tasks_create') && (
            <CreateButton onClick={() => isLimitReached ? notify('error', 'Limit Reached') : navigate(`${basePath}/create`)} label={`Deploy ${typeLabel}`} disabled={isLimitReached} />
          )}
        </div>
      </div>

      <TaskFilterBar 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
        filterMode={filterMode} setFilterMode={setFilterMode} 
        setCurrentPage={setCurrentPage} staffList={staffList} typeLabel={typeLabel}
      />

      {viewMode === "table" ? (
        <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8 transition-all hover:shadow-2xl hover:shadow-primary-500/5">
          <TaskTable 
            currentTableData={currentTableData} user={user} isAdmin={isAdmin} can={can} staffList={staffList}
            statusList={statusList} handleInlineUpdate={handleInlineUpdate} openDeleteModal={(id) => {setTaskToDelete(id); setIsModalOpen(true);}} navigate={navigate} basePath={basePath} 
          />
          <TableControls
            currentPage={currentPage} totalItems={totalItems} itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onLimitChange={(newLimit) => { setItemsPerPage(newLimit); setCurrentPage(1); }}
          />
        </div>
      ) : (
        <div className="mt-8">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar min-h-[70vh]">
              {statusList.map((status) => (
                <div key={status._id} className="flex-shrink-0 w-80">
                  <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-[32px] p-5 flex flex-col h-full border border-gray-100 dark:border-gray-800 transition-all hover:border-primary-500/20">
                    <div className="flex justify-between items-center mb-6 px-3">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                        {status.name}
                      </h3>
                      <span className="bg-white dark:bg-gray-950 px-2.5 py-1 rounded-xl text-[10px] font-black text-primary-600 border border-primary-50 dark:border-primary-900/50 shadow-sm">
                        {currentTableData.filter(t => (t.status?._id || t.status) === status._id).length}
                      </span>
                    </div>

                    <Droppable droppableId={status._id}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 space-y-5 min-h-[200px] transition-all rounded-[24px] p-1 ${snapshot.isDraggingOver ? 'bg-primary-50/30 dark:bg-primary-950/20 scale-[0.99]' : ''}`}
                        >
                          {currentTableData
                            .filter(task => (task.status?._id || task.status) === status._id)
                            .map((task, index) => (
                              <Draggable key={task._id} draggableId={task._id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white dark:bg-gray-950 p-6 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 group transition-all ${snapshot.isDragging ? 'shadow-2xl scale-105 border-primary-500 ring-4 ring-primary-500/10 z-50' : 'hover:border-primary-500/30 hover:shadow-lg'}`}
                                  >
                                    <div className="flex justify-between items-start mb-4">
                                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                                        task.priority === 'High' || task.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/40 dark:border-red-900/50' : 'bg-primary-50 text-primary-600 border-primary-100 dark:bg-primary-950/40 dark:border-red-900/50'
                                      }`}>
                                        {task.priority || 'Medium'}
                                      </span>
                                      <button onClick={() => navigate(`${basePath}/view/${task._id}`)} className="p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                                        <ExternalLink size={14} />
                                      </button>
                                    </div>
                                    <div className="mb-6">
                                      <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 line-clamp-2 leading-relaxed tracking-tight">
                                        {task.title}
                                      </h4>
                                      {task.description && (
                                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed font-medium">
                                          {task.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-5 mt-auto">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 bg-primary-50 dark:bg-primary-900 text-primary-600 rounded-xl flex items-center justify-center text-[11px] font-black shadow-inner border border-primary-100 dark:border-primary-800 shrink-0">
                                          {task.assignedTo?.name ? task.assignedTo.name[0] : <User size={12}/>}
                                        </div>
                                        <div className="flex flex-col">
                                          {(isAdmin || can('tasks_update')) ? (
                                            <select
                                              value={task.assignedTo?._id || task.assignedTo || ''}
                                              onChange={(e) => handleInlineUpdate(task._id, 'assignedTo', e.target.value)}
                                              className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tighter truncate max-w-[120px] bg-transparent border-none outline-none focus:ring-0 p-0 m-0 cursor-pointer appearance-none"
                                              title="Change Assignee"
                                            >
                                              <option value="">Unassigned</option>
                                              {staffList.map((s) => (
                                                <option key={s._id} value={s._id}>{s.name}</option>
                                              ))}
                                            </select>
                                          ) : (
                                            <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tighter truncate max-w-[120px]">
                                              {task.assignedTo?.name || 'Unassigned'}
                                            </span>
                                          )}
                                          
                                          {task.assignedTo?.email && (
                                            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                                              {task.assignedTo.email}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-gray-300 dark:text-gray-600 shrink-0">
                                        <Clock size={12} strokeWidth={3} />
                                        <span className="text-[10px] font-black">{task.hours || 0}h</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      )}

      <BulkUploadModal 
        isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} activeProjectId={activeProjectId}
        type={isIssueMode ? 'issue' : 'task'} onRefresh={() => fetchTasks(1, itemsPerPage)} notify={notify}
      />

      <ConfirmModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleDelete}
        title={`Protocol Termination`} message={`Permanently purge this record from the control plane?`}
      />
    </div>
  );
}