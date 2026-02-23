import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, ArrowLeft } from "lucide-react";
import API from "../api";
import { toast } from "react-toastify"; 
import FormActionButtons from "../components/FormActionButtons"; // ⭐ Imported

export default function PermissionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);

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
      console.error(err);
      toast.error("Failed to fetch permission details");
      navigate("/admin/permissions");
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // ⭐ Added to prevent page reload
    if (!formData.name || !formData.value) return toast.error("Name and Value are required");

    try {
      setLoading(true);
      if (isEditMode) {
        await API.put(`/permissions/${id}`, formData);
        toast.success("Permission Updated!");
      } else {
        await API.post("/permissions", formData);
        toast.success("Permission Created!");
      }
      navigate("/admin/permissions");
    } catch (err) {
      console.error(err);
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <div className="flex justify-center mt-20"><Loader className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex gap-2 mb-2 text-gray-500 hover:text-gray-900 transition-colors font-medium items-center">
            <ArrowLeft size={18} /> Back
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            {isEditMode ? "Edit Permission" : "Create New Permission"}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl border border-gray-100 p-8 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Permission Name</label>
          <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Delete Users" className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
            Value <span className="text-gray-400 font-normal normal-case tracking-normal ml-2">(Auto-generated)</span>
          </label>
          <input name="value" value={formData.value} onChange={handleChange} placeholder="e.g. delete_users" className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 font-mono text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-200 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer">
            <option value="1">Active</option>
            <option value="2">Inactive</option>
          </select>
        </div>

        {/* ⭐ Standardized Action Buttons */}
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