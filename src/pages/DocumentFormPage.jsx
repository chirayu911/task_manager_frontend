import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader, ArrowLeft, UploadCloud, X, File as FileIcon, ShieldAlert, Search, Download } from "lucide-react"; // ⭐ Added Download icon
import API from "../api";
import FormActionButtons from "../components/FormActionButtons";
import Notification from "../components/Notification";

export default function DocumentFormPage({ user, activeProjectId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // ⭐ Hook to check current URL

  // ⭐ Detect View vs Edit modes from the URL path
  const isViewMode = location.pathname.includes('/view/');
  const isEditMode = Boolean(id) && !isViewMode;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(Boolean(id)); // Only fetch if we have an ID
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    accessType: "public", // 'public' or 'restricted'
    allowedUsers: [] // Array of user objects
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [existingFile, setExistingFile] = useState(null);

  useEffect(() => {
    if (!user || !activeProjectId) return;

    const initData = async () => {
      try {
        // 1. Fetch team members ONLY if we are NOT in view mode
        if (!isViewMode) {
          const teamRes = await API.get(`/projects/${activeProjectId}/team`);
          setStaffList(teamRes.data || []);
        }

        // 2. Fetch document if editing OR viewing
        if (isEditMode || isViewMode) {
          const { data } = await API.get(`/documents/${id}`);
          setFormData({
            title: data.title || "",
            description: data.description || "",
            accessType: data.accessType || "public",
            allowedUsers: data.allowedUsers || []
          });
          setExistingFile({ url: data.fileUrl, name: data.originalName, type: data.fileType });
        }
      } catch (err) {
        setNotification({ type: 'error', message: "Failed to load data." });
        setTimeout(() => navigate("/documents"), 2000);
      } finally {
        setFetching(false);
      }
    };
    initData();
  }, [id, isEditMode, isViewMode, navigate, user, activeProjectId]);

  const handleChange = (e) => {
    if (isViewMode) return; // Prevent changes in view mode
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    if (isViewMode) return; // Prevent changes in view mode
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return setNotification({ type: 'error', message: "File size cannot exceed 50MB." });
    setSelectedFile(file);
    if (errors.file) setErrors(prev => ({ ...prev, file: null }));
  };

  // User Selection Logic
  const addUser = (staff) => {
    if (isViewMode) return;
    if (!formData.allowedUsers.some(u => u._id === staff._id)) {
      setFormData(prev => ({ ...prev, allowedUsers: [...prev.allowedUsers, staff] }));
    }
    setSearchQuery("");
    setShowDropdown(false);
  };

  const removeUser = (userId) => {
    if (isViewMode) return;
    setFormData(prev => ({ ...prev, allowedUsers: prev.allowedUsers.filter(u => u._id !== userId) }));
  };

  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !formData.allowedUsers.some(u => u._id === s._id)
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Document Title is required.";
    if (!selectedFile && !existingFile) newErrors.file = "You must upload a document file.";
    if (formData.accessType === 'restricted' && formData.allowedUsers.length === 0) {
      newErrors.access = "Please select at least one user for restricted access.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewMode) return; // Guard to prevent submit on view mode

    if (!validateForm()) return setNotification({ type: 'error', message: "Please fix the errors before saving." });

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('accessType', formData.accessType);
      payload.append('project', activeProjectId);

      const userIds = formData.allowedUsers.map(u => u._id);
      payload.append('allowedUsers', JSON.stringify(userIds));

      if (selectedFile) payload.append('documentFile', selectedFile);
      else if (existingFile) payload.append('existingFile', existingFile.url);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (isEditMode) {
        await API.put(`/documents/${id}`, payload, config);
        setNotification({ type: 'success', message: "Document updated successfully!" });
      } else {
        await API.post("/documents", payload, config);
        setNotification({ type: 'success', message: "Document uploaded successfully!" });
      }
      setTimeout(() => navigate("/documents"), 1500);
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || "Operation failed" });
      setLoading(false);
    }
  };

  if (!activeProjectId) return null;
  if (fetching) return <div className="flex justify-center p-20"><Loader className="animate-spin text-primary-600 dark:text-primary-400" size={40} /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto transition-colors">
      {notification && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={() => navigate(-1)} data-btn-id="1" className="flex gap-2 mb-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium items-center">
            <ArrowLeft size={18} /> Back to Documents
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            {/* ⭐ Update Title dynamically */}
            {isViewMode ? "View Document" : isEditMode ? "Edit Document" : "Upload Document"}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-8 transition-colors">

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              Document Title {!isViewMode && <span className="text-red-500">*</span>}
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={isViewMode} // ⭐ Disable input
              placeholder="e.g. Q3 Financial Report"
              className={`w-full border p-4 rounded-xl outline-none transition-all shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed ${errors.title ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500/20 focus:border-primary-500'}`}
            />
            {errors.title && <p className="text-red-500 text-xs font-bold mt-1">{errors.title}</p>}
          </div>

          <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert size={16} className="text-primary-500" /> Access Control
            </label>

            <div className="flex gap-4">
              <label className={`flex items-center gap-2 ${isViewMode ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input type="radio" name="accessType" value="public" checked={formData.accessType === "public"} onChange={handleChange} disabled={isViewMode} className="w-4 h-4 accent-primary-600" />
                <span className="text-gray-800 dark:text-gray-200 font-medium">Public (All Project Members)</span>
              </label>
              <label className={`flex items-center gap-2 ${isViewMode ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input type="radio" name="accessType" value="restricted" checked={formData.accessType === "restricted"} onChange={handleChange} disabled={isViewMode} className="w-4 h-4 accent-primary-600" />
                <span className="text-gray-800 dark:text-gray-200 font-medium">Restricted (Specific Users)</span>
              </label>
            </div>

            {formData.accessType === 'restricted' && (
              <div className="relative pt-2">

                {/* ⭐ Hide Search Bar in View Mode */}
                {!isViewMode && (
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search and select users..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                  </div>
                )}

                {!isViewMode && showDropdown && searchQuery && filteredStaff.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {filteredStaff.map(staff => (
                      <div key={staff._id} onClick={() => addUser(staff)} className="p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer flex items-center gap-3 border-b border-gray-50 dark:border-gray-700/50 last:border-none transition-colors">
                        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{staff.name[0]}</div>
                        <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{staff.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected User Bubbles */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {isViewMode && formData.allowedUsers.length === 0 && (
                    <span className="text-sm text-gray-500 italic">No specific users selected.</span>
                  )}
                  {formData.allowedUsers.map(user => (
                    <div key={user._id} className="flex items-center gap-2 bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm border border-primary-200 dark:border-primary-800">
                      {user.name}
                      {/* ⭐ Hide remove button in View Mode */}
                      {!isViewMode && (
                        <button type="button" onClick={() => removeUser(user._id)} className="hover:text-red-500 transition-colors bg-primary-200 dark:bg-primary-800 rounded-full p-0.5"><X size={12} /></button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.access && <p className="text-red-500 text-xs font-bold mt-2">{errors.access}</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isViewMode} // ⭐ Disable input
              placeholder="Add details about this document..."
              className={`w-full border p-4 rounded-xl min-h-[120px] outline-none transition-all shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed ${errors.description ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500/20 focus:border-primary-500'}`}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">File Attachment {!isViewMode && <span className="text-red-500">*</span>}</h3>

            {(selectedFile || existingFile) ? (
              <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-600 text-white rounded-lg"><FileIcon size={24} /></div>
                  <div>
                    <p className="font-bold text-primary-900 dark:text-primary-100 line-clamp-1">{selectedFile ? selectedFile.name : existingFile.name}</p>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : existingFile.type}</p>
                  </div>
                </div>

                {/* ⭐ Show Download button in View Mode, Show Remove (X) in Edit Mode */}
                {isViewMode ? (
                  existingFile && (
                    <a
                      href={`https://fm8bp5cj-5000.inc1.devtunnels.ms/${existingFile.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="p-2 bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                      title="Download Document"
                    >
                      <Download size={20} />
                    </a>

                  )
                ) : (
                  <button type="button" onClick={() => { setSelectedFile(null); setExistingFile(null); }} className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"><X size={20} /></button>
                )}
              </div>
            ) : (
              // ⭐ Hide Dropzone completely in View Mode
              !isViewMode && (
                <div className={`relative h-48 bg-gray-50 dark:bg-gray-900/50 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-colors group ${errors.file ? 'border-red-400' : 'border-gray-300 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500'}`}>
                  <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <UploadCloud size={48} className="text-gray-400 group-hover:text-primary-500 mb-3 transition-colors" />
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Click or drag file to upload</p>
                </div>
              )
            )}
            {errors.file && <p className="text-red-500 text-xs font-bold">{errors.file}</p>}
          </div>
        </div>

        {/* ⭐ Hide Submit and Cancel buttons in View Mode */}
        {
          !isViewMode && (
            <FormActionButtons loading={loading} isEditMode={isEditMode} submitText={isEditMode ? "Update Document" : "Upload Document"} cancelPath="/documents" />
          )
        }
      </form >
    </div >
  );
}