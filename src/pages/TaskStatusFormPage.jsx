import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, ArrowLeft } from 'lucide-react'; 
import API from '../api';
import { toast } from 'react-toastify';
import FormActionButtons from '../components/FormActionButtons';

// ⭐ Added activeProjectId prop
export default function TaskStatusFormPage({ user, activeProjectId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({ name: '', status: 'active' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  useEffect(() => {
    if (!user || !activeProjectId) return;
    if (isEditMode) {
      const fetchStatus = async () => {
        try {
          const { data } = await API.get(`/task-statuses/${id}`);
          setFormData({ name: data.name, status: data.status });
        } catch (err) {
          toast.error("Status not found");
          navigate("/admin/task-status");
        } finally { setFetching(false); }
      };
      fetchStatus();
    }
  }, [id, isEditMode, navigate, user, activeProjectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !activeProjectId) return;
    setLoading(true);
    try {
      // ⭐ Inject the active project into the payload
      const payload = { ...formData, project: activeProjectId };

      if (isEditMode) {
        await API.put(`/task-statuses/${id}`, payload);
        toast.success("Status updated");
      } else {
        await API.post('/task-statuses', payload);
        toast.success("Status created");
      }
      navigate("/admin/task-status");
    } catch (err) { 
      toast.error(err.response?.data?.message || "Operation failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  // ⭐ Guard against missing project selection
  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Project Selected</h2>
        <p className="text-gray-500 mb-6">You must select a project from the top navigation bar before managing statuses.</p>
        <button onClick={() => navigate('/admin/task-status')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Go Back</button>
      </div>
    );
  }

  if (!user) return null;
  if (fetching) return <div className="flex justify-center p-20"><Loader className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-black transition"><ArrowLeft size={18} /> Back</button>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-6">{isEditMode ? "Edit Status" : "Create New Status"}</h2>
        
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

          <FormActionButtons 
            loading={loading} 
            isEditMode={isEditMode} 
            submitText={isEditMode ? "Update Status" : "Save Status"}
            cancelPath="/admin/task-status" 
          />
        </form>
      </div>
    </div>
  );
}