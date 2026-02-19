import React, { useState, useEffect } from 'react';
import { Trash2, ShieldPlus, Edit2, Plus, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

export default function PermissionPage({ user }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Normalize role and permissions check
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const perms = user?.permissions || [];
  const isAdmin = roleName === 'admin' || perms.includes('*');

  const can = (perm) => isAdmin || perms.includes(perm);

  useEffect(() => { 
    if (user) fetchPermissions(); 
  }, [user]);
    
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/permissions');
      setPermissions(data);
    } catch (err) { 
      toast.error("Failed to load permissions"); 
    } finally {
      setLoading(false);
    }
  };

  const deletePermission = async (id) => {
    if (!window.confirm("Permanently delete this permission? This may break existing roles.")) return;
    try {
      await API.delete(`/permissions/${id}`);
      setPermissions(permissions.filter(p => p._id !== id));
      toast.success("Permission deleted");
    } catch (err) { 
      toast.error("Error deleting permission"); 
    }
  };

  if (!user) return <div className="p-20 text-center">Verifying session...</div>;
  if (loading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-purple-600" size={40} /></div>;

  const headers = [
    { label: "Name" },
    { label: "Value (Slug)" },
    { label: "Status" },
    { label: "Actions", className: "text-right" }
  ];

  const renderRow = (perm) => (
    <tr key={perm._id} className="border-b hover:bg-gray-50 transition last:border-0 bg-white">
      <td className="p-4 font-medium text-gray-800">{perm.name}</td>
      <td className="p-4">
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border">
          {perm.value}
        </span>
      </td>
      <td className="p-4">
        <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest border ${
          perm.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'
        }`}>
          {perm.status || 'active'}
        </span>
      </td>
      <td className="p-4 text-right flex justify-end gap-2">
        {can('permissions_update') && (
          <button 
            onClick={() => navigate(`/admin/permissions/update/${perm._id}`)} 
            className="text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition"
            title="Edit Permission"
          >
            <Edit2 size={18} />
          </button>
        )}
        {can('permissions_delete') && (
          <button 
            onClick={() => deletePermission(perm._id)} 
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition"
            title="Delete Permission"
          >
            <Trash2 size={18} />
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen bg-gray-50/30">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <ShieldPlus className="text-purple-600" /> Permission Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">Configure individual system access slugs.</p>
        </div>
        {can('permissions_create') && (
          <button 
            onClick={() => navigate("/admin/permissions/create")} 
            className="bg-purple-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-100 font-bold transition-all"
          >
            <Plus size={18} /> Create Permission
          </button>
        )}
      </div>
      <DataTable headers={headers} data={permissions} renderRow={renderRow} />
    </div>
  );
}