import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldPlus, Loader } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal';
import Notification from '../components/Notification'; // ⭐ Swapped fixed Declaration for floating Notification

export default function PermissionPage({ user, socket }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permToDelete, setPermToDelete] = useState(null);
  const [notification, setNotification] = useState(null); // ⭐ Switched state to notification

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
      setNotification({ type: 'error', message: 'Failed to load permissions.' });
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
      setIsModalOpen(false);
      // ⭐ BUG FIX: Will trigger floating Notification so it can't be missed if scrolled down
      setNotification({ type: 'success', message: 'Delete Successful! Permission permanently removed.' });
    } catch (err) { 
      setIsModalOpen(false);
      setNotification({ type: 'error', message: 'Error deleting permission. It may be in use by a role.' });
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
      <Loader className="animate-spin text-primary-600 dark:text-primary-400" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen transition-colors">
      
      {/* ⭐ Floating Notification Component */}
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      {/* Header Row: Title & Create Button */}
      <div className="flex justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <ShieldPlus className="text-primary-600 dark:text-primary-400" /> Permission Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Configure individual system access slugs.</p>
        </div>
        {can('permissions_create') && (
          <CreateButton 
            onClick={() => navigate("/admin/permissions/create")} 
            label="New Permission" 
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

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              <th className="px-6 py-5">Name</th>
              <th className="px-6 py-5">Value</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {currentTableData.length > 0 ? currentTableData.map((perm) => (
              <tr key={perm._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{perm.name}</td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
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
            )) : (
              <tr>
                <td colSpan="3" className="px-6 py-20 text-center text-gray-400 dark:text-gray-500 italic">
                  No permissions found matching your search.
                </td>
              </tr>
            )}
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