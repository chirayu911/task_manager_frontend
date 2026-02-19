import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, Shield, Loader } from 'lucide-react';
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import Pagination from '../components/Pagination';

export default function AdminStaffCRUD({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Logic: Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Helper for inline permission checks
  const can = (perm) => {
    const perms = user?.permissions || [];
    const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
    if (roleName === 'admin' || perms.includes('*')) return true;
    return perms.includes(perm);
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/users');
      setUsers(data);
    } catch (err) { 
      console.error("Error fetching users", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will permanently remove the staff member.")) return;
    try {
      await API.delete(`/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) { 
      alert("Failed to delete user"); 
    }
  };

  // Logic: Search Filter (Checks Name and Email)
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Logic: Pagination
  const currentTableData = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 min-h-[400px]">
      <Loader className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-gray-500 font-medium">Loading staff directory...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Page Header with Search and Create Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Users className="text-blue-600" /> Staff Management
          </h2>
          <p className="text-gray-500 text-sm">Manage user accounts, roles, and system access.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <SearchBar 
            value={searchTerm} 
            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} 
            placeholder="Search by name or email..." 
          />
          {can('staff_create') && (
            <CreateButton 
              onClick={() => navigate('/admin/staff/create')} 
              label="New Staff" 
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-5">User Details</th>
              <th className="px-6 py-5">Role</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentTableData.length > 0 ? currentTableData.map((staffMember) => (
              <tr key={staffMember._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{staffMember.name}</span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail size={12} /> {staffMember.email}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border 
                    ${(staffMember.role?.name || staffMember.role) === 'admin' 
                      ? 'bg-purple-50 text-purple-700 border-purple-100' 
                      : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                    <Shield size={10} /> {staffMember.role?.name || staffMember.role || "No Role"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {can('staff_update') && (
                      <EditButton onClick={() => navigate(`/admin/staff/edit/${staffMember._id}`)} />
                    )}
                    {can('staff_delete') && (
                      <DeleteButton onClick={() => handleDelete(staffMember._id)} />
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

        {/* Reusable Pagination Component */}
        <Pagination 
          currentPage={currentPage} 
          totalItems={filteredUsers.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </div>
  );
}