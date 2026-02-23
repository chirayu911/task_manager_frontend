import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldCheck, Loader, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal';
import Declaration from '../components/Declaration'; 

export default function RolePage({ user, socket }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
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

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/roles');
      setRoles(data);
    } catch (err) {
      setFeedback({ type: 'error', message: "Failed to load roles" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchRoles();
  }, [user, fetchRoles]);

  useEffect(() => {
    if (socket) {
      socket.on("permissionsUpdated", fetchRoles);
      return () => socket.off("permissionsUpdated", fetchRoles);
    }
  }, [socket, fetchRoles]);

  const openDeleteModal = (id) => {
    setRoleToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/roles/${roleToDelete}`);
      setRoles(prev => prev.filter(r => r._id !== roleToDelete));
      setFeedback({ type: 'success', message: "Role deleted successfully" });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error deleting role";
      setFeedback({ type: 'error', message: errorMsg });
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredRoles.slice(firstIndex, lastIndex);
  }, [filteredRoles, currentPage, itemsPerPage]);

  if (!user) return null;
  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader className="animate-spin text-indigo-600" size={40} />
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
            <ShieldCheck className="text-indigo-600" /> Role Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">Define system roles and map permissions to them.</p>
        </div>
        {can('roles_create') && (
          <CreateButton 
            onClick={() => navigate("/admin/roles/create")} 
            label="New Role" 
            color="indigo"
          />
        )}
      </div>

      {/* Filter Row: Search Bar Underneath */}
      <div className="mb-8 w-full md:max-w-md">
        <SearchBar 
          value={searchTerm} 
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} 
          placeholder="Search roles..." 
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-5">Role Name</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Permissions Count</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentTableData.length > 0 ? currentTableData.map((role) => (
              <tr key={role._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800">{role.name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                    role.status === 1 || role.status === 'Active'
                      ? 'bg-green-50 text-green-700 border-green-100' 
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {role.status === 1 || role.status === 'Active' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                    {role.status === 1 || role.status === 'Active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500 font-medium">
                    {role.permissions?.length || 0} permissios Assigned
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {can('roles_update') && (
                      <EditButton onClick={() => navigate(`/admin/roles/edit/${role._id}`)} />
                    )}
                    {can('roles_delete') && (
                      <DeleteButton onClick={() => openDeleteModal(role._id)} />
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center text-gray-400 italic">
                  No roles found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <TableControls 
          currentPage={currentPage} 
          totalItems={filteredRoles.length} 
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
        title="Delete Role"
        message="Permanently delete this role? This will affect all assigned users."
      />
    </div>
  );
}