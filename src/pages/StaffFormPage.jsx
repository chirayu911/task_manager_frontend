import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, ArrowLeft, Send } from "lucide-react"; 
import API from "../api";
import FormActionButtons from '../components/FormActionButtons';
import Notification from '../components/Notification'; 

export default function StaffFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [notification, setNotification] = useState(null); 
  const [errors, setErrors] = useState({});
  const [isAdminUser, setIsAdminUser] = useState(false); // ⭐ Track if editing an Admin

  const [formData, setFormData] = useState({ name: "", username: "", email: "", role: "" });

  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await API.get('/roles');
      setRoles(data);
      // ⭐ BUG FIX: Removed the logic that auto-selected 'staff' by default.
    } catch (err) { 
      setNotification({ type: 'error', message: "Failed to load roles" });
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/users/${id}`);
      setFormData({ 
        name: data.name || "", 
        username: data.username || "", 
        email: data.email || "", 
        role: data.role?._id || data.role || "" 
      });
      
      // ⭐ BUG FIX: Identify if this user is currently an Admin to lock their role
      if ((data.role?.name || data.role) === 'admin') {
        setIsAdminUser(true);
      }
    } catch (err) { 
      setNotification({ type: 'error', message: "Failed to fetch user details" });
      setTimeout(() => navigate("/admin/staff"), 2000);
    } 
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => {
    fetchRoles();
    if (isEditMode) fetchUser();
  }, [fetchRoles, fetchUser, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (!isEditMode && name === "email" && value.includes('@')) newData.username = value.split('@')[0];
      return newData;
    });
    
    // Clear specific error as user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // ⭐ BUG FIX: Name Validation (No special chars/numbers, max 50)
    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required.";
    } else if (formData.name.length > 50) {
      newErrors.name = "Name cannot exceed 50 characters.";
    } else if (!/^[A-Za-z\s]+$/.test(formData.name)) {
      newErrors.name = "Name can only contain letters and spaces.";
    }

    if (!formData.email.trim()) newErrors.email = "Email Address is required.";
    if (!formData.username.trim()) newErrors.username = "Username is required.";
    if (!formData.role) newErrors.role = "Designated Role is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return setNotification({ type: 'error', message: "Please correct the errors before submitting." });
    }

    try {
      setLoading(true);
      if (isEditMode) {
        await API.put(`/users/${id}`, formData);
        // ⭐ BUG FIX: Pass success message through router state
        navigate("/admin/staff", { 
          state: { feedback: { type: 'success', message: "Update Successful! Staff details modified." } } 
        });
      } else {
        await API.post('/users', formData);
        // ⭐ BUG FIX: Pass success message through router state
        navigate("/admin/staff", { 
          state: { feedback: { type: 'success', message: "Staff created successfully! Credentials sent via email." } } 
        });
      }
    } catch (err) { 
      // ⭐ BUG FIX: Will catch duplicate email errors from backend and NOT redirect
      setNotification({ 
        type: 'error', 
        message: err.response?.data?.message || "Failed to save staff member. Check for duplicate email/username." 
      });
      setLoading(false);
    } 
  };

  if (loading && isEditMode) return <div className="flex justify-center mt-20"><Loader className="animate-spin text-primary-600 dark:text-primary-400" size={40} /></div>;

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
          <button onClick={() => navigate(-1)} data-btn-id="1" className="flex gap-2 mb-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors items-center font-medium">
            <ArrowLeft size={18} /> Return to List
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">{isEditMode ? "Modify Staff Record" : "Onboard New Staff"}</h2>
          {!isEditMode && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">An automated welcome email with credentials will be sent.</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 p-8 transition-colors">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. Rahul Sharma" 
                className={`w-full border p-3 rounded-xl outline-none transition-all shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'}`} 
              />
              {errors.name && <p className="text-red-500 text-xs font-bold mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="rahul@company.com" 
                className={`w-full border p-3 rounded-xl outline-none transition-all shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'}`} 
              />
              {errors.email && <p className="text-red-500 text-xs font-bold mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Username <span className="text-red-500">*</span>
              </label>
              <input 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                placeholder="rsharma_dev" 
                className={`w-full border p-3 rounded-xl outline-none transition-all shadow-sm ${errors.username ? 'border-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'} ${isEditMode ? 'bg-gray-50 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'}`} 
                disabled={isEditMode} 
              />
              {errors.username && <p className="text-red-500 text-xs font-bold mt-1">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Designated Role <span className="text-red-500">*</span>
              </label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                disabled={isAdminUser} // ⭐ BUG FIX: Lock dropdown if user is an Admin
                className={`w-full border p-3 rounded-xl outline-none transition-all shadow-sm cursor-pointer ${errors.role ? 'border-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'} ${isAdminUser ? 'bg-gray-50 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'}`} 
              >
                <option value="">-- Choose Role --</option>
                {roles.map(r => <option key={r._id} value={r._id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>)}
              </select>
              {errors.role && <p className="text-red-500 text-xs font-bold mt-1">{errors.role}</p>}
              {isAdminUser && <p className="text-primary-500 dark:text-primary-400 text-xs font-bold mt-1">Admin role cannot be modified.</p>}
            </div>

          </div>

          <FormActionButtons 
            loading={loading} 
            isEditMode={isEditMode} 
            submitText={isEditMode ? "Save Changes" : "Complete Registration"}
            submitIcon={!isEditMode && <Send size={20} />} 
            cancelPath="/admin/staff" 
          />
        </form>
      </div>
    </div>
  );
}