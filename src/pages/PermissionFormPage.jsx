import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, ArrowLeft } from "lucide-react";
import API from "../api";
import FormActionButtons from "../components/FormActionButtons"; 
import Notification from "../components/Notification"; // ⭐ Swapped toast for Notification

export default function PermissionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(""); // ⭐ Added targeted error state for validation

  const [formData, setFormData] = useState({
    name: "",
    value: "",
    status: 1
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/permissions/${id}`);
      setFormData({
        name: data.name || "",
        value: data.value || "",
        status: data.status ?? 1
      });
    } catch (err) {
      setNotification({ type: 'error', message: "Failed to fetch permission details" });
      setTimeout(() => navigate("/admin/permissions"), 2000);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEditMode) fetchData();
  }, [isEditMode, fetchData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === "name") {
        return {
          ...prev,
          name: value,
          value: value.toLowerCase().trim().replace(/\s+/g, "_")
        };
      }
      return { ...prev, [name]: value };
    });

    if (error) setError(""); // Clear error when user types
  };

  // ⭐ BUG FIX: Strict Validation Logic
  const validateForm = () => {
    if (!formData.name.trim()) return "Permission Name is required.";
    if (formData.name.length > 50) return "Permission Name cannot exceed 50 characters.";
    if (!/^[A-Za-z\s]+$/.test(formData.name)) return "Permission Name can only contain letters and spaces. No numbers or special characters.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      if (isEditMode) {
        await API.put(`/permissions/${id}`, formData);
        // ⭐ BUG FIX: Pass success message via router state to show on the table page
        navigate("/admin/permissions", { state: { feedback: { type: 'success', message: "Update Successful! Permission modified." } } });
      } else {
        await API.post("/permissions", formData);
        // ⭐ BUG FIX: Pass success message via router state
        navigate("/admin/permissions", { state: { feedback: { type: 'success', message: "Permission Created Successfully!" } } });
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || "Operation failed" });
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <div className="flex justify-center mt-20"><Loader className="animate-spin text-primary-600 dark:text-primary-400" size={40}/></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto transition-colors">
      
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={() => navigate(-1)} data-btn-id="1" className="flex gap-2 mb-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium items-center">
            <ArrowLeft size={18} /> Back
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            {isEditMode ? "Edit Permission" : "Create New Permission"}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-6 transition-colors">
        
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
            Permission Name <span className="text-red-500">*</span>
          </label>
          <input 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="e.g. Delete Users" 
            className={`w-full border p-3 rounded-xl outline-none transition-all shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'}`} 
          />
          {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
            Value <span className="text-gray-400 dark:text-gray-500 font-normal normal-case tracking-normal ml-2">(Auto-generated)</span>
          </label>
          <input 
            name="value" 
            value={formData.value} 
            onChange={handleChange} 
            placeholder="e.g. delete_users" 
            className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 font-mono text-sm text-gray-600 dark:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm" 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Status</label>
          <select 
            name="status" 
            value={formData.status} 
            onChange={handleChange} 
            className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm cursor-pointer"
          >
            <option value="1">Active</option>
            <option value="2">Inactive</option>
          </select>
        </div>

        <FormActionButtons 
          loading={loading} 
          isEditMode={isEditMode} 
          submitText={isEditMode ? "Save Changes" : "Create Permission"}
          cancelPath="/admin/permissions" 
        />
      </form>
    </div>
  );
}