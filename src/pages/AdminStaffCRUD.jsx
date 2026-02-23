import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader } from 'lucide-react';
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal';
import Declaration from '../components/Declaration';

export default function AdminStaffCRUD({ user, socket }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal & Feedback States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/users');
      setUsers(data);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to fetch users.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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
      setFeedback({ type: 'success', message: 'Staff member removed successfully.' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to delete user. Please try again.' });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredUsers.slice(firstIndex, lastIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 min-h-[400px]">
      <Loader className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-gray-500 font-medium">Loading staff directory...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Declaration
        type={feedback.type}
        message={feedback.message}
        onClose={() => setFeedback({ type: '', message: '' })}
      />

      {/* Header Row: Title & Create Button */}
      <div className="flex justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Users className="text-blue-600" /> Staff Management
          </h2>
          <p className="text-gray-500 text-sm">Manage user accounts, roles, and system access.</p>
        </div>
        {can('staff_create') && (
          <CreateButton onClick={() => navigate('/admin/staff/create')} label="New Staff" />
        )}
      </div>

      {/* Filter Row: Search Bar Underneath */}
      <div className="mb-8 w-full md:max-w-md">
        <SearchBar
          value={searchTerm}
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          placeholder="Search by name or email..."
        />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-5 text-left">User Details</th>
              <th className="px-6 py-5 text-left">Role</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentTableData.length > 0 ? currentTableData.map((staffMember) => (
              <tr key={staffMember._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{staffMember.name}</span>
                    <span className="text-sm text-gray-500">{staffMember.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border 
                    ${(staffMember.role?.name || staffMember.role) === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-100'
                      : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                    {staffMember.role?.name || staffMember.role || "No Role"}
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
                <td colSpan="3" className="px-6 py-20 text-center text-gray-400 italic">
                  No staff members found matching your search.
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
        message="Are you sure you want to remove this account? This action cannot be undone."
      />
    </div>
  );
}