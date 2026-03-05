import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Loader, CheckCircle2, XCircle } from 'lucide-react';
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal';
import Notification from '../components/Notification'; // ⭐ Swapped fixed Declaration for floating Notification

export default function TaskStatusPage({ user, socket, activeProjectId }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [notification, setNotification] = useState(null); // ⭐ Switched to notification state

  // ⭐ BUG FIX: Intercept success messages passed from the Form page router state
  useEffect(() => {
    if (location.state?.feedback) {
      setNotification(location.state.feedback);
      // Clean up the state so it doesn't fire again on manual page refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const roleName = useMemo(() => 
    typeof user?.role === 'object' ? user.role?.name : user?.role, 
  [user]);

  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === 'admin' || perms.includes('*'), [roleName, perms]);
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  const fetchStatuses = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      setLoading(true);
      const { data } = await API.get('/task-statuses', { params: { project: activeProjectId } });
      setStatuses(data);
    } catch (err) {
      setNotification({ type: 'error', message: "Failed to load statuses" });
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (user && activeProjectId) fetchStatuses();
  }, [user, activeProjectId, fetchStatuses]);

  useEffect(() => {
    if (socket) {
      socket.on("taskStatusChanged", fetchStatuses);
      return () => socket.off("taskStatusChanged", fetchStatuses);
    }
  }, [socket, fetchStatuses]);

  const openDeleteModal = (id) => {
    setStatusToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/task-statuses/${statusToDelete}`);
      setStatuses(prev => prev.filter(s => s._id !== statusToDelete));
      setIsModalOpen(false);
      // ⭐ BUG FIX: Set floating Notification so it can't be missed
      setNotification({ type: 'success', message: "Delete Successful! Task status removed." });
    } catch (err) {
      setIsModalOpen(false);
      const errorMsg = err.response?.data?.message || "Failed to delete status";
      setNotification({ type: 'error', message: errorMsg });
    }
  };

  const filteredStatuses = useMemo(() => {
    return statuses.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [statuses, searchTerm]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredStatuses.slice(firstIndex, lastIndex);
  }, [filteredStatuses, currentPage, itemsPerPage]);

  if (!user) return null;

  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">No Project Selected</h2>
        <p className="text-gray-500 dark:text-gray-400">Please select a project from the top navigation bar to manage task statuses.</p>
      </div>
    );
  }

  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader className="animate-spin text-primary-600 dark:text-primary-400" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto transition-colors">
      
      {/* ⭐ Floating Notification Component */}
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <Settings className="text-primary-600 dark:text-primary-400" /> Task Statuses
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage the available stages for your team's workflow.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <SearchBar 
            value={searchTerm} 
            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} 
            placeholder="Search statuses..." 
          />
          {can('roles_update') && (
            <CreateButton onClick={() => navigate("/admin/task-status/create")} label="Add Status" />
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden transition-colors">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              <th className="px-6 py-5">Status Name</th>
              <th className="px-6 py-4">System Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {currentTableData.length > 0 ? (
              currentTableData.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-5 font-bold text-gray-800 dark:text-gray-200">{s.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      s.status === 'active' 
                      ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                      : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                    }`}>
                      {s.status === 'active' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {can('roles_update') && (
                        <>
                          <EditButton onClick={() => navigate(`/admin/task-status/edit/${s._id}`)} />
                          <DeleteButton onClick={() => openDeleteModal(s._id)} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-20 text-center text-gray-400 dark:text-gray-500 italic">
                  No statuses found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <TableControls 
          currentPage={currentPage} 
          totalItems={filteredStatuses.length} 
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
        title="Delete Task Status"
        message="Are you sure you want to delete this status? This may affect tasks currently using it."
      />
    </div>
  );
}