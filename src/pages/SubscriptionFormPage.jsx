import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, ArrowLeft, Plus, Trash2, ShieldAlert, Users, Layers, Zap } from "lucide-react";
import API from "../api";
import FormActionButtons from "../components/FormActionButtons";
import Notification from "../components/Notification";

export default function SubscriptionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    cycle: "monthly",
    status: 1,
    maxProjects: 1,
    maxTasks: 50,
    maxDocuments: 10,
    // ⭐ NEW: Additional Limits
    maxStaff: 5,
    maxTeamMembersPerProject: 5,
    hasBulkUpload: false,
    features: [""]
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/subscriptions/${id}`);
      setFormData({
        name: data.name || "",
        price: data.price || "",
        cycle: data.cycle || "monthly",
        status: data.status ?? 1,
        maxProjects: data.maxProjects ?? 1,
        maxTasks: data.maxTasks ?? 50,
        maxDocuments: data.maxDocuments ?? 10,
        // ⭐ NEW: Map fetched additional limits
        maxStaff: data.maxStaff ?? 5,
        maxTeamMembersPerProject: data.maxTeamMembersPerProject ?? 5,
        hasBulkUpload: data.hasBulkUpload ?? false,
        features: data.features?.length ? data.features : [""]
      });
    } catch (err) {
      setNotification({ type: 'error', message: "Failed to fetch plan details" });
      setTimeout(() => navigate("/admin/subscriptions"), 2000);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEditMode) fetchData();
  }, [isEditMode, fetchData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
    if (errors.features) setErrors(prev => ({ ...prev, features: null }));
  };

  const addFeatureRow = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ""] }));
  };

  const removeFeatureRow = (index) => {
    if (formData.features.length === 1) return;
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Plan Name is required.";
    if (formData.price === "" || formData.price === null) newErrors.price = "Price is required.";

    // Usage Limit Validation
    const limitFields = ['maxProjects', 'maxTasks', 'maxDocuments', 'maxStaff', 'maxTeamMembersPerProject'];
    limitFields.forEach(field => {
      if (formData[field] === "" || formData[field] === null) newErrors[field] = "Required.";
      else if (Number(formData[field]) < -1) newErrors[field] = "Min -1.";
    });

    const validFeatures = formData.features.filter(f => f.trim() !== "");
    if (validFeatures.length === 0) newErrors.features = "At least one feature description is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return setNotification({ type: 'error', message: "Please fix errors." });

    const cleanData = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== "")
    };

    try {
      setLoading(true);
      if (isEditMode) {
        await API.put(`/subscriptions/${id}`, cleanData);
        navigate("/admin/subscriptions", { state: { feedback: { type: 'success', message: "Plan modified." } } });
      } else {
        await API.post("/subscriptions", cleanData);
        navigate("/admin/subscriptions", { state: { feedback: { type: 'success', message: "Plan Created!" } } });
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || "Operation failed" });
      setLoading(false);
    }
  };

  const inputClass = "w-full border p-3 rounded-xl outline-none transition-all shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";
  const errorInputClass = "w-full border p-3 rounded-xl outline-none transition-all shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-red-500 focus:ring-2 focus:ring-red-500/20";
  const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide";

  if (loading && isEditMode) return <div className="flex justify-center mt-20"><Loader className="animate-spin text-primary-600 dark:text-primary-400" size={40} /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto transition-colors">
      {notification && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex gap-2 mb-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium items-center">
            <ArrowLeft size={18} /> Back to Plans
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            {isEditMode ? "Edit Subscription Plan" : "Create New Plan"}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-8 transition-colors">

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>Plan Name <span className="text-red-500">*</span></label>
            <input name="name" value={formData.name} onChange={handleChange} className={errors.name ? errorInputClass : inputClass} />
            {errors.name && <p className="text-red-500 text-xs font-bold">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Price (USD) <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className={errors.price ? errorInputClass : inputClass} />
            {errors.price && <p className="text-red-500 text-xs font-bold">{errors.price}</p>}
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Billing Cycle</label>
            <select name="cycle" value={formData.cycle} onChange={handleChange} className={inputClass}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Plan Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
              <option value="1">Active</option>
              <option value="2">Inactive</option>
            </select>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-primary-500" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Usage Restrictions</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4 uppercase tracking-widest">Enter -1 for unlimited.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Max Projects</label>
              <input type="number" min="-1" name="maxProjects" value={formData.maxProjects} onChange={handleChange} className={errors.maxProjects ? errorInputClass : inputClass} />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Max Tasks</label>
              <input type="number" min="-1" name="maxTasks" value={formData.maxTasks} onChange={handleChange} className={errors.maxTasks ? errorInputClass : inputClass} />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Max Documents</label>
              <input type="number" min="-1" name="maxDocuments" value={formData.maxDocuments} onChange={handleChange} className={errors.maxDocuments ? errorInputClass : inputClass} />
            </div>

            {/* ⭐ NEW LIMIT FIELDS */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase"><Users size={12} /> Max Staff (Global)</label>
              <input type="number" min="-1" name="maxStaff" value={formData.maxStaff} onChange={handleChange} className={errors.maxStaff ? errorInputClass : inputClass} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase"><Layers size={12} /> Team Size / Project</label>
              <input type="number" min="-1" name="maxTeamMembersPerProject" value={formData.maxTeamMembersPerProject} onChange={handleChange} className={errors.maxTeamMembersPerProject ? errorInputClass : inputClass} />
            </div>
            <div className="flex items-center space-x-3 pt-6">
              <input
                type="checkbox"
                id="hasBulkUpload"
                name="hasBulkUpload"
                checked={formData.hasBulkUpload}
                onChange={handleChange}
                className="w-5 h-5 accent-primary-600"
              />
              <label htmlFor="hasBulkUpload" className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase cursor-pointer">
                <Zap size={16} className="text-amber-500" /> Enable Bulk Upload
              </label>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <label className={labelClass}>Included Features <span className="text-red-500">*</span></label>
            <button type="button" onClick={addFeatureRow} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add Row</button>
          </div>
          {formData.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <input type="text" value={feature} onChange={(e) => handleFeatureChange(index, e.target.value)} placeholder="Feature description..." className="flex-1 border border-gray-200 dark:border-gray-700 p-3 rounded-xl outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              <button type="button" onClick={() => removeFeatureRow(index)} disabled={formData.features.length === 1} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 rounded-xl disabled:opacity-50"><Trash2 size={18} /></button>
            </div>
          ))}
          {errors.features && <p className="text-red-500 text-xs font-bold">{errors.features}</p>}
        </div>

        <FormActionButtons loading={loading} isEditMode={isEditMode} submitText={isEditMode ? "Save Changes" : "Create Plan"} cancelPath="/admin/subscriptions" />
      </form>
    </div>
  );
}