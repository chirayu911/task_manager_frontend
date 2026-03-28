import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Loader, Building2 } from 'lucide-react'; 
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal';
import Notification from '../components/Notification';

export default function AdminStaffCRUD({ user, socket }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  // ⭐ Context Trigger: Listen for the global company context from the Navbar
  const activeCompanyId = localStorage.getItem('activeCompanyId');

  useEffect(() => {
    if (location.state?.feedback) {
      setNotification(location.state.feedback);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const roleName = useMemo(() => typeof user?.role === 'object' ? user.role?.name : user?.role, [user]);
  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === 'admin' || perms.includes('*'), [roleName, perms]);
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/users');
      // ⭐ Robustness Check: Ensure data is always an array to prevent .map crashes
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setNotification({ type: 'error', message: 'Failed to fetch users. Check server connection.' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ⭐ Context Sync: RE-FETCH whenever the company is switched or component mounts
  useEffect(() => { 
    fetchUsers(); 
  }, [fetchUsers, activeCompanyId]);

  useEffect(() => {
    if (socket) {
      socket.on("staffChanged", fetchUsers);
      return () => socket.off("staffChanged", fetchUsers);
    }
  }, [socket, fetchUsers]);

  const openDeleteModal = (id) => {
    setUserToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/users/${userToDelete}`);
      setUsers(prev => prev.filter(u => u._id !== userToDelete));
      setIsModalOpen(false);
      setNotification({ type: 'success', message: 'Staff member removed successfully.' });
    } catch (err) {
      setIsModalOpen(false);
      setNotification({ type: 'error', message: 'Failed to delete user.' });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredUsers.slice(firstIndex, lastIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 min-h-[400px]">
      <Loader className="animate-spin text-primary-600 mb-4" size={40} />
      <p className="text-gray-500 font-medium">Updating staff directory...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto transition-colors">
      
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="flex justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <Users className="text-primary-600" /> Staff Management
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Building2 size={14} className="text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">
              {activeCompanyId === 'all' ? 'System-Wide Directory' : `Organization: ${users[0]?.company?.companyName || 'Current Organization'}`}
            </p>
          </div>
        </div>
        {can('staff_create') && (
          <CreateButton onClick={() => navigate('/admin/staff/create')} label="New Staff" />
        )}
      </div>

      <div className="mb-8 w-full md:max-w-md">
        <SearchBar
          value={searchTerm}
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          placeholder="Search members by name or email..."
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              <th className="px-6 py-5">User Details</th>
              <th className="px-6 py-5">Organization</th>
              <th className="px-6 py-5">Role</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {currentTableData.length > 0 ? currentTableData.map((staffMember) => (
              <tr key={staffMember._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{staffMember.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{staffMember.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {staffMember.company?.companyName || 'Unassigned'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border 
                    ${(user.role?.name || staffMember.role) === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30'
                      : 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/30'}`}>
                    {user.role?.name || staffMember.role || "No Role"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {can('staff_update') && (
                      <EditButton onClick={() => navigate(`/admin/staff/edit/${staffMember._id}`)} />
                    )}
                    {can('staff_delete') && (staffMember.role?.name || staffMember.role) !== 'admin' && (
                      <DeleteButton onClick={() => openDeleteModal(staffMember._id)} />
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center text-gray-400 italic">
                  No staff members found in this context.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <TableControls
          currentPage={currentPage}
          totalItems={filteredUsers.length}
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
        title="Delete Staff Account"
        message="Are you sure? This action cannot be undone."
      />
    </div>
  );
}