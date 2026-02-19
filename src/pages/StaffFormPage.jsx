import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, Save, ArrowLeft } from "lucide-react";
import API from "../api";
import { toast } from 'react-toastify';

export default function StaffFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]); // Store roles from DB

  // Initialize state
  const [formData, setFormData] = useState({ 
    name: "", 
    username: "", 
    email: "", 
    role: "" // This will now store the Role ObjectId
  });

  // 1. Fetch available roles for the dropdown
  const fetchRoles = async () => {
    try {
      const { data } = await API.get('/roles'); // Adjust this endpoint to your routes
      setRoles(data);
      // Set default role if not in edit mode
      if (!isEditMode && data.length > 0) {
        setFormData(prev => ({ ...prev, role: data.find(r => r.name === 'staff')?._id || data[0]._id }));
      }
    } catch (err) {
      toast.error("Failed to load roles");
    }
  };

  // 2. Fetch User data if in Edit Mode
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/users/${id}`);
      setFormData({ 
        name: data.name, 
        username: data.username, 
        email: data.email, 
        role: data.role?._id || data.role // Handle populated or ID-only role
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
  }, [isEditMode, fetchUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (!isEditMode && name === "email" && value.includes('@')) {
        newData.username = value.split('@')[0];
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.username || !formData.role) {
      return toast.error("All fields including Role are required");
    }

    try {
      setLoading(true);
      
      if (isEditMode) {
        await API.put(`/users/${id}`, formData);
        toast.success("User Updated Successfully!");
      } else {
        // Backend handles password generation and email sending
        await API.post('/users', formData);
        toast.success("User Created! Credentials sent to their email.");
      }
      
      navigate("/admin/staff");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Operation failed.";
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
            className="flex gap-2 mb-2 text-gray-500 hover:text-gray-900 transition-colors items-center"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            {isEditMode ? "Edit Staff Member" : "Add New Staff"}
          </h2>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Full Name</label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="John Doe"
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="john@example.com"
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Username</label>
              <input 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                placeholder="johndoe123"
                className={`w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm ${isEditMode ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`} 
                required
                disabled={isEditMode}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">System Role</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                className="w-full border p-3 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm cursor-pointer"
                required
              >
                <option value="">Select a Role</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50">
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-blue-600 text-white px-8 py-3 rounded-xl flex gap-3 hover:bg-blue-700 transition-all w-full md:w-auto justify-center items-center shadow-lg hover:shadow-blue-200 disabled:opacity-50 font-bold"
            >
              {loading ? <Loader className="animate-spin" size={20}/> : <Save size={20} />}
              {isEditMode ? "Update User Information" : "Register User & Send Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}