import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Loader, CheckCircle2, XCircle } from 'lucide-react';
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal'; 
import Declaration from '../components/Declaration';  

export default function TaskStatusPage({ user, socket }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const roleName = useMemo(() => 
    typeof user?.role === 'object' ? user.role?.name : user?.role, 
  [user]);

  const perms = useMemo(() => user?.permissions || [], [user]);

  const isAdmin = useMemo(() => 
    roleName === 'admin' || perms.includes('*'), 
  [roleName, perms]);

  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/task-statuses');
      setStatuses(data);
    } catch (err) {
      setFeedback({ type: 'error', message: "Failed to load statuses" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStatuses();
    }
  }, [user, fetchStatuses]);

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
      setFeedback({ type: 'success', message: "Status deleted successfully" });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete status";
      setFeedback({ type: 'error', message: errorMsg });
    }
  };

  const filteredStatuses = useMemo(() => {
    return statuses.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [statuses, searchTerm]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredStatuses.slice(firstIndex, lastIndex);
  }, [filteredStatuses, currentPage, itemsPerPage]);

  if (!user) return null;

  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Declaration 
        type={feedback.type} 
        message={feedback.message} 
        onClose={() => setFeedback({ type: '', message: '' })} 
      />

      {/* Header Row: Title & Create Button */}
      <div className="flex justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Settings className="text-blue-600" /> Task Statuses
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage the available stages for your team's workflow.</p>
        </div>
        {can('roles_update') && (
          <CreateButton 
            onClick={() => navigate("/admin/task-status/create")} 
            label="Add Status" 
          />
        )}
      </div>

      {/* Filter Row: Search Bar Underneath */}
      <div className="mb-8 w-full md:max-w-md">
        <SearchBar 
          value={searchTerm} 
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} 
          placeholder="Search statuses..." 
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-5">Status Name</th>
              <th className="px-6 py-4">System Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentTableData.length > 0 ? (
              currentTableData.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5 font-bold text-gray-800">{s.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      s.status === 'active' 
                        ? 'bg-green-50 text-green-700 border-green-100' 
                        : 'bg-red-50 text-red-700 border-red-100'
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
                <td colSpan="3" className="px-6 py-20 text-center text-gray-400 italic">
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