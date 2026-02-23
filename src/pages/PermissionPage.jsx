import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldPlus, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal';
import Declaration from '../components/Declaration';

export default function PermissionPage({ user, socket }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permToDelete, setPermToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const roleName = useMemo(() => 
    typeof user?.role === 'object' ? user.role?.name : user?.role, 
  [user]);

  const perms = useMemo(() => user?.permissions || [], [user]);

  const isAdmin = useMemo(() => 
    roleName === 'admin' || perms.includes('*'), 
  [roleName, perms]);

  const can = useCallback((perm) => 
    isAdmin || perms.includes(perm), 
  [isAdmin, perms]);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/permissions');
      setPermissions(data);
    } catch (err) { 
      setFeedback({ type: 'error', message: 'Failed to load permissions.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    if (user) fetchPermissions(); 
  }, [user, fetchPermissions]);

  useEffect(() => {
    if (socket) {
      socket.on("permissionsUpdated", fetchPermissions);
      return () => socket.off("permissionsUpdated", fetchPermissions);
    }
  }, [socket, fetchPermissions]);

  const openDeleteModal = (id) => {
    setPermToDelete(id);
    setIsModalOpen(true);
  };
    
  const handleDelete = async () => {
    try {
      await API.delete(`/permissions/${permToDelete}`);
      setPermissions(prev => prev.filter(p => p._id !== permToDelete));
      setFeedback({ type: 'success', message: 'Permission deleted successfully.' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) { 
      setFeedback({ type: 'error', message: 'Error deleting permission. It may be in use by a role.' });
    }
  };

  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [permissions, searchTerm]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredPermissions.slice(firstIndex, lastIndex);
  }, [filteredPermissions, currentPage, itemsPerPage]);

  if (!user) return null;
  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader className="animate-spin text-purple-600" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <Declaration 
        type={feedback.type} 
        message={feedback.message} 
        onClose={() => setFeedback({ type: '', message: '' })} 
      />

      {/* Header Row: Title & Create Button */}
      <div className="flex justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <ShieldPlus className="text-purple-600" /> Permission Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">Configure individual system access slugs.</p>
        </div>
        {can('permissions_create') && (
          <CreateButton 
            onClick={() => navigate("/admin/permissions/create")} 
            label="New Permission" 
            color="purple"
          />
        )}
      </div>

      {/* Filter Row: Search Bar Underneath */}
      <div className="mb-8 w-full md:max-w-md">
        <SearchBar 
          value={searchTerm} 
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} 
          placeholder="Search name or slug..." 
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-5">Name</th>
              <th className="px-6 py-5">Value (Slug)</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentTableData.map((perm) => (
              <tr key={perm._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800">{perm.name}</td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border">
                    {perm.value}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {can('permissions_update') && (
                      <EditButton onClick={() => navigate(`/admin/permissions/update/${perm._id}`)} />
                    )}
                    {can('permissions_delete') && (
                      <DeleteButton onClick={() => openDeleteModal(perm._id)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <TableControls 
          currentPage={currentPage} 
          totalItems={filteredPermissions.length} 
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
        title="Delete Permission"
        message="Permanently delete this permission? This may break existing roles."
      />
    </div>
  );
}