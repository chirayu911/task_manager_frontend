import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, Save, ArrowLeft, Send } from "lucide-react"; // Added Send icon
import API from "../api";
import { toast } from 'react-toastify';

export default function StaffFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  const [formData, setFormData] = useState({ 
    name: "", 
    username: "", 
    email: "", 
    role: "" 
  });

  // 1. Fetch available roles
  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await API.get('/roles');
      setRoles(data);
      // Set default role to 'staff' if creating new user
      if (!isEditMode && data.length > 0) {
        const staffRole = data.find(r => r.name.toLowerCase() === 'staff') || data[0];
        setFormData(prev => ({ ...prev, role: staffRole._id }));
      }
    } catch (err) {
      toast.error("Failed to load roles");
    }
  }, [isEditMode]);

  // 2. Fetch User data for Edit Mode
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
    } catch (err) {
      toast.error("Failed to fetch user details");
      navigate("/admin/staff");
    } finally { 
      setLoading(false); 
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchRoles();
    if (isEditMode) fetchUser();
  }, [fetchRoles, fetchUser, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Logic: Auto-generate username from email prefix for new staff
      if (!isEditMode && name === "email" && value.includes('@')) {
        newData.username = value.split('@')[0];
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.username || !formData.role) {
      return toast.error("All fields are mandatory");
    }

    try {
      setLoading(true);
      
      if (isEditMode) {
        await API.put(`/users/${id}`, formData);
        toast.success("Staff details updated!");
      } else {
        // Backend generates random password and emits 'staffChanged' socket event
        const response = await API.post('/users', formData);
        
        if (response.status === 201) {
          toast.success("Staff registered! Credentials sent via email.");
        }
      }
      
      navigate("/admin/staff");
    } catch (err) {
      // Correcting common 500 error by showing specific backend message
      const errorMsg = err.response?.data?.message || "Failed to save staff member";
      toast.error(errorMsg);
    } finally { 
      setLoading(false); 
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center mt-20">
        <Loader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="flex gap-2 mb-2 text-gray-500 hover:text-gray-900 transition-colors items-center font-medium"
          >
            <ArrowLeft size={18} /> Return to List
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            {isEditMode ? "Modify Staff Record" : "Onboard New Staff"}
          </h2>
          {!isEditMode && <p className="text-gray-500 text-sm mt-1">An automated welcome email with credentials will be sent.</p>}
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Full Name</label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. Rahul Sharma"
                className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" 
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="rahul@company.com"
                className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" 
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Username</label>
              <input 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                placeholder="rsharma_dev"
                className={`w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm ${isEditMode ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'focus:border-blue-500'}`} 
                required
                disabled={isEditMode}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Designated Role</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                className="w-full border border-gray-200 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer"
                required
              >
                <option value="">-- Choose Role --</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-blue-600 text-white px-10 py-4 rounded-2xl flex gap-3 hover:bg-blue-700 transition-all w-full md:w-auto justify-center items-center shadow-lg shadow-blue-200 disabled:opacity-50 font-bold text-lg"
            >
              {loading ? (
                <Loader className="animate-spin" size={24}/>
              ) : isEditMode ? (
                <Save size={24} />
              ) : (
                <Send size={24} />
              )}
              {isEditMode ? "Save Changes" : "Complete Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}