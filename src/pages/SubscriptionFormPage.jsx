import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, ArrowLeft, Plus, Trash2 } from "lucide-react";
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
    features: [""] // Initialize with one empty feature row
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // Dynamic Feature Handlers
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
    if (formData.features.length === 1) return; // Prevent deleting the last box
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Plan Name is required.";
    else if (formData.name.length > 50) newErrors.name = "Plan Name cannot exceed 50 characters.";

    if (formData.price === "" || formData.price === null) newErrors.price = "Price is required.";
    else if (Number(formData.price) < 0) newErrors.price = "Price cannot be negative.";

    // Filter out completely empty features before saving, but ensure at least one remains
    const validFeatures = formData.features.filter(f => f.trim() !== "");
    if (validFeatures.length === 0) newErrors.features = "At least one feature description is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    if (!validateForm()) {
      return setNotification({ type: 'error', message: "Please fix the errors before saving." });
    }

    // Clean up empty features before sending to backend
    const cleanData = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== "")
    };

    try {
      setLoading(true);
      if (isEditMode) {
        await API.put(`/subscriptions/${id}`, cleanData);
        navigate("/admin/subscriptions", { state: { feedback: { type: 'success', message: "Update Successful! Plan modified." } } });
      } else {
        await API.post("/subscriptions", cleanData);
        navigate("/admin/subscriptions", { state: { feedback: { type: 'success', message: "Plan Created Successfully!" } } });
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
            <ArrowLeft size={18} /> Back to Plans
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            {isEditMode ? "Edit Subscription Plan" : "Create New Plan"}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-8 transition-colors">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Plan Name <span className="text-red-500">*</span>
            </label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g. Enterprise" 
              className={`w-full border p-3 rounded-xl outline-none transition-all shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${errors.name ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'}`} 
            />
            {errors.name && <p className="text-red-500 text-xs font-bold">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Price (USD) <span className="text-red-500">*</span>
            </label>
            <input 
              type="number"
              min="0"
              step="0.01"
              name="price" 
              value={formData.price} 
              onChange={handleChange} 
              placeholder="e.g. 29.99" 
              className={`w-full border p-3 rounded-xl outline-none transition-all shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${errors.price ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'}`} 
            />
            {errors.price && <p className="text-red-500 text-xs font-bold">{errors.price}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Billing Cycle</label>
            <select 
              name="cycle" 
              value={formData.cycle} 
              onChange={handleChange} 
              className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Plan Status</label>
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
        </div>

        {/* Dynamic Features Section */}
        <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Included Features <span className="text-red-500">*</span>
            </label>
            <button 
              type="button" 
              onClick={addFeatureRow}
              data-btn-id="3"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus size={16} /> Add Feature
            </button>
          </div>
          
          {formData.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <input 
                type="text" 
                value={feature} 
                onChange={(e) => handleFeatureChange(index, e.target.value)} 
                placeholder="e.g. Unlimited Projects" 
                className="flex-1 border border-gray-200 dark:border-gray-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
              />
              <button 
                type="button" 
                onClick={() => removeFeatureRow(index)}
                data-btn-id="2"
                disabled={formData.features.length === 1}
                className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {errors.features && <p className="text-red-500 text-xs font-bold">{errors.features}</p>}
        </div>

        <FormActionButtons 
          loading={loading} 
          isEditMode={isEditMode} 
          submitText={isEditMode ? "Save Changes" : "Create Plan"}
          cancelPath="/admin/subscriptions" 
        />
      </form>
    </div>
  );
}