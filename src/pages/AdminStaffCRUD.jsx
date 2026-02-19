import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Edit, Trash2, Plus, Mail, Shield } from 'lucide-react';
import API from '../api';
import DataTable from '../components/DataTable';

export default function AdminStaffCRUD({ user }) {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Helper for inline permission checks
  const can = (perm) => {
    const perms = user?.permissions || [];
    if (user?.role === 'admin' || perms.includes('*')) return true;
    return perms.includes(perm);
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/users');
      setUsers(data);
    } catch (err) { console.error("Error fetching users", err); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await API.delete(`/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) { alert("Failed to delete user"); }
  };

  const headers = [
    { label: "User Details" },
    { label: "Role" },
    { label: "Actions", className: "text-center" }
  ];

  const renderRow = (staffMember) => (
    <tr key={staffMember._id} className="hover:bg-gray-50 transition bg-white">
      <td className="p-4">
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{staffMember.name}</span>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Mail size={12} /> {staffMember.email}
          </span>
        </div>
      </td>
      <td className="p-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
          ${staffMember.role?.name === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
          <Shield size={10} /> {staffMember.role?.name || "No Role"}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-center gap-2">
          {can('staff_update') && (
            <button onClick={() => navigate(`/admin/staff/edit/${staffMember._id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"><Edit size={18} /></button>
          )}
          {can('staff_delete') && (
            <button onClick={() => handleDelete(staffMember._id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={18} /></button>
          )}
        </div>
      </td>
    </tr>
  );

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Staff...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <Users className="text-blue-600" /> Staff Management
        </h2>
        {can('staff_create') && (
          <button onClick={() => navigate('/admin/staff/create')} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm">
            <Plus size={18} /> Add New Staff
          </button>
        )}
      </div>
      <DataTable headers={headers} data={users} renderRow={renderRow} emptyMessage="No staff members found." />
    </div>
  );
}