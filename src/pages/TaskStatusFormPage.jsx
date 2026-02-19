import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader, X } from 'lucide-react'; 
import API from '../api';
import { toast } from 'react-toastify';

export default function TaskStatusFormPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({ name: '', status: 'active' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const perms = user?.permissions || [];
  const isAdmin = roleName === 'admin' || perms.includes('*');

  useEffect(() => {
    if (!user) return;

    if (isEditMode) {
      const fetchStatus = async () => {
        try {
          const { data } = await API.get(`/task-statuses/${id}`);
          setFormData({ name: data.name, status: data.status });
        } catch (err) {
          toast.error("Status not found");
          navigate("/admin/task-status");
        } finally {
          setFetching(false);
        }
      };
      fetchStatus();
    }
  }, [id, isEditMode, navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      if (isEditMode) {
        await API.put(`/task-statuses/${id}`, formData);
        toast.success("Status updated");
      } else {
        await API.post('/task-statuses', formData);
        toast.success("Status created");
      }
      navigate("/admin/task-status");
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (fetching) return (
    <div className="flex justify-center p-20">
      <Loader className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-500 hover:text-black transition"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-6">
          {isEditMode ? "Edit Status" : "Create New Status"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Status Name</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. In Review"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">System Status (Visibility)</label>
            <select 
              className="w-full p-3 border rounded-lg bg-white outline-none cursor-pointer"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-100"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
              {isEditMode ? "Update Status" : "Save Status"}
            </button>

            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}