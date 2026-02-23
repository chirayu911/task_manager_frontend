import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, ArrowLeft, Send } from "lucide-react"; 
import API from "../api";
import { toast } from 'react-toastify';
import FormActionButtons from '../components/FormActionButtons'; // ⭐ Imported

export default function StaffFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  const [formData, setFormData] = useState({ name: "", username: "", email: "", role: "" });

  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await API.get('/roles');
      setRoles(data);
      if (!isEditMode && data.length > 0) {
        const staffRole = data.find(r => r.name.toLowerCase() === 'staff') || data[0];
        setFormData(prev => ({ ...prev, role: staffRole._id }));
      }
    } catch (err) { toast.error("Failed to load roles"); }
  }, [isEditMode]);

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
    } catch (err) { toast.error("Failed to fetch user details"); navigate("/admin/staff"); } 
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.username || !formData.role) return toast.error("All fields are mandatory");

    try {
      setLoading(true);
      if (isEditMode) {
        await API.put(`/users/${id}`, formData);
        toast.success("Staff details updated!");
      } else {
        const response = await API.post('/users', formData);
        if (response.status === 201) toast.success("Staff registered! Credentials sent via email.");
      }
      navigate("/admin/staff");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save staff member"); } 
    finally { setLoading(false); }
  };

  if (loading && isEditMode) return <div className="flex justify-center mt-20"><Loader className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex gap-2 mb-2 text-gray-500 hover:text-gray-900 transition-colors items-center font-medium"><ArrowLeft size={18} /> Return to List</button>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">{isEditMode ? "Modify Staff Record" : "Onboard New Staff"}</h2>
          {!isEditMode && <p className="text-gray-500 text-sm mt-1">An automated welcome email with credentials will be sent.</p>}
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Full Name</label>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Rahul Sharma" className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="rahul@company.com" className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Username</label>
              <input name="username" value={formData.username} onChange={handleChange} placeholder="rsharma_dev" className={`w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm ${isEditMode ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'focus:border-blue-500'}`} required disabled={isEditMode} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Designated Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full border border-gray-200 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer" required>
                <option value="">-- Choose Role --</option>
                {roles.map(r => <option key={r._id} value={r._id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* ⭐ Standardized Action Buttons */}
          <FormActionButtons 
            loading={loading} 
            isEditMode={isEditMode} 
            submitText={isEditMode ? "Save Changes" : "Complete Registration"}
            submitIcon={!isEditMode && <Send size={20} />} // Optional custom icon
            cancelPath="/admin/staff" 
          />
        </form>
      </div>
    </div>
  );
}