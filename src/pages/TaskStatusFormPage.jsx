import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, ArrowLeft } from 'lucide-react'; 
import API from '../api';
import FormActionButtons from '../components/FormActionButtons';
import Notification from '../components/Notification'; // ⭐ Replaced toast with Notification

export default function TaskStatusFormPage({ user, activeProjectId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({ name: '', status: 'active' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [notification, setNotification] = useState(null); // ⭐ Added notification state

  useEffect(() => {
    if (!user || !activeProjectId) return;
    if (isEditMode) {
      const fetchStatus = async () => {
        try {
          const { data } = await API.get(`/task-statuses/${id}`);
          setFormData({ name: data.name, status: data.status });
        } catch (err) {
          setNotification({ type: 'error', message: "Status not found" });
          setTimeout(() => navigate("/admin/task-status"), 2000);
        } finally { 
          setFetching(false); 
        }
      };
      fetchStatus();
    }
  }, [id, isEditMode, navigate, user, activeProjectId]);

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !activeProjectId) return;
    
    if (!formData.name.trim()) {
      return setNotification({ type: 'error', message: "Status Name is required." });
    }

    setLoading(true);
    try {
      const payload = { ...formData, project: activeProjectId };

      if (isEditMode) {
        await API.put(`/task-statuses/${id}`, payload);
        setNotification({ type: 'success', message: "Update Successful! Task status modified." });
      } else {
        await API.post('/task-statuses', payload);
        setNotification({ type: 'success', message: "Task Status Created Successfully!" });
      }

      // ⭐ Wait 1.5 seconds, then navigate
      setTimeout(() => navigate("/admin/task-status"), 1500);

    } catch (err) { 
      setNotification({ type: 'error', message: err.response?.data?.message || "Operation failed" }); 
      setLoading(false); 
    }
  };

  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">No Project Selected</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">You must select a project from the top navigation bar before managing statuses.</p>
        <button onClick={() => navigate('/admin/task-status')} data-btn-id="7" className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors">Go Back</button>
      </div>
    );
  }

  if (!user) return null;
  if (fetching) return <div className="flex justify-center p-20"><Loader className="animate-spin text-primary-600 dark:text-primary-400" size={40} /></div>;

  return (
    <div className="p-8 max-w-xl mx-auto transition-colors">
      
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} data-btn-id="7" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium">
          <ArrowLeft size={18} /> Back
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{isEditMode ? "Edit Status" : "Create New Status"}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              Status Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-sm" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              placeholder="e.g. In Review" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">System Status (Visibility)</label>
            <select 
              className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-sm cursor-pointer" 
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