import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, Save, ArrowLeft } from "lucide-react";
import API from "../api";

export default function PermissionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    value: "",
    status: 1
  });

  // ✅ Memoized fetchData to fix eslint warning
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
      alert("Failed to fetch permission details");
      navigate("/admin/permissions");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // ✅ Proper dependency array
  useEffect(() => {
    if (isEditMode) {
      fetchData();
    }
  }, [isEditMode, fetchData]);

  // --- HANDLERS ---

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      if (name === "name" && !isEditMode) {
        return {
          ...prev,
          name: value,
          value: value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_")
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.value) {
      return alert("Name and Value are required");
    }

    try {
      setLoading(true);

      if (isEditMode) {
        await API.put(`/permissions/${id}`, formData);
        alert("Permission Updated!");
      } else {
        await API.post("/permissions", formData);
        alert("Permission Created!");
      }

      navigate("/admin/permissions");

    } catch (err) {
      console.error(err);
      alert("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center mt-20">
        <Loader className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex gap-2 mb-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <h2 className="text-2xl font-bold text-gray-800">
            {isEditMode ? "Edit Permission" : "Create New Permission"}
          </h2>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded flex gap-2 hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading
            ? <Loader className="animate-spin" size={18}/>
            : <Save size={18} />
          }
          {isEditMode ? "Save Changes" : "Create Permission"}
        </button>
      </div>

      {/* FORM CARD */}
      <div className="bg-white shadow rounded-lg border p-6 space-y-6">

        {/* Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Permission Name
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Delete Users"
            className="w-full border p-3 rounded outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Value */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Value 
            <span className="text-gray-400 font-normal">
              {" "} (Auto-generated)
            </span>
          </label>

          <input
            name="value"
            value={formData.value}
            onChange={handleChange}
            placeholder="e.g. delete_users"
            className="w-full border p-3 rounded bg-gray-50 font-mono text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Status
          </label>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border p-3 rounded bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Active</option>
            <option value="2">Inactive</option>
          </select>
        </div>

      </div>
    </div>
  );
}
