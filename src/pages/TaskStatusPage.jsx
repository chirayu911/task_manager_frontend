import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Plus, Edit, Trash2, Loader, CheckCircle2, XCircle } from 'lucide-react';
import API from '../api';
import { toast } from 'react-toastify';

export default function TaskStatusPage({ user }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Safety Guard: Normalize role and permissions check
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const perms = user?.permissions || [];
  const isAdmin = roleName === 'admin' || perms.includes('*');

  // Permission helper
  const can = (perm) => isAdmin || perms.includes(perm);

  useEffect(() => {
    // Only fetch if session is validated
    if (user) {
      fetchStatuses();
    }
  }, [user]);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/task-statuses');
      setStatuses(data);
    } catch (err) {
      toast.error("Failed to load statuses");
    } finally {
      setLoading(false);
    }
  };

  // ✅ New Delete Function
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this status? This may affect tasks currently using it.")) return;

    try {
      await API.delete(`/task-statuses/${id}`);
      setStatuses(statuses.filter(s => s._id !== id));
      toast.success("Status deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete status");
    }
  };

  // ✅ Critical Guard: Do not render if user is not loaded
  if (!user) return null;

  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Settings className="text-blue-600" /> Task Statuses
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage the available stages for your team's workflow.</p>
        </div>
        
        {can('roles_update') && (
          <button 
            onClick={() => navigate("/admin/task-status/create")}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100 font-bold"
          >
            <Plus size={18} /> Add Status
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              <th className="px-6 py-5">Status Name</th>
              <th className="px-6 py-4">System Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {statuses.length > 0 ? (
              statuses.map((s) => (
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
                    <div className="flex justify-end gap-2">
                      {can('roles_update') && (
                        <>
                          <button 
                            onClick={() => navigate(`/admin/task-status/edit/${s._id}`)}
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-all"
                            title="Edit Status"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(s._id)}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all"
                            title="Delete Status"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-20 text-center text-gray-400 italic">
                  No statuses found. Click "Add Status" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}