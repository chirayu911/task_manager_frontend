import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader, ArrowLeft, Search, X } from 'lucide-react';
import API from '../api';
import FormActionButtons from '../components/FormActionButtons';
import Notification from '../components/Notification'; // ⭐ Imported custom Notification

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [staffList, setStaffList] = useState([]);
  
  const [formData, setFormData] = useState({ title: '', description: '', assignedUsers: [] });
  const [errors, setErrors] = useState({});
  
  // ⭐ Notification state
  const [notification, setNotification] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const { data: users } = await API.get('/users');
        setStaffList(users.filter(u => (u.role?.name || u.role) !== 'customer'));

        if (isEditMode) {
          const { data: project } = await API.get(`/projects/${id}`);
          setFormData({
            title: project.title || '',
            description: project.description || '',
            assignedUsers: project.assignedUsers?.map(u => u._id || u) || [] 
          });
        }
      } catch (err) {
        setNotification({ type: 'error', message: "Failed to load underlying data." });
      } finally { 
        setPageLoading(false); 
      }
    };
    initData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id, isEditMode]);

  const handleAddUser = (userId) => {
    if (!formData.assignedUsers.includes(userId)) {
      setFormData(prev => ({
        ...prev,
        assignedUsers: [...prev.assignedUsers, userId]
      }));
    }
    setSearchQuery('');
    inputRef.current?.focus(); 
  };

  const handleRemoveUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers.filter(id => id !== userId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Project title is required.";
    } else if (formData.title.length > 50) {
      newErrors.title = "Project title cannot exceed 50 characters.";
    } else if (!/^[A-Za-z\s-]+$/.test(formData.title)) {
      newErrors.title = "Title can only contain letters, spaces, and hyphens. Numbers and special characters are not allowed.";
    }

    if (formData.description) {
      const sqlPattern = /(--|;|UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+[A-Za-z]+\s+SET|EXEC(\s|\())/i;
      if (sqlPattern.test(formData.description)) {
        newErrors.description = "Invalid input: SQL commands and restricted characters ( ; -- ) are not allowed.";
      } else if (formData.description.length > 500) {
        newErrors.description = "Project description cannot exceed 500 characters.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEditMode) {
        await API.put(`/projects/${id}`, formData);
        setNotification({ type: 'success', message: "Project updated successfully!" });
      } else {
        await API.post('/projects', formData);
        setNotification({ type: 'success', message: "Project created successfully!" });
      }
      
      // ⭐ Wait 1.5 seconds so the user can read the notification before navigating away
      setTimeout(() => {
        navigate('/projects');
      }, 1500);

    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || "Failed to save project." });
      // window.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false); // Only set loading false if it fails, otherwise let it ride out the timeout
    }
  };

  const availableStaff = staffList.filter(staff => 
    !formData.assignedUsers.includes(staff._id) &&
    staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (pageLoading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-primary-600 dark:text-primary-400" size={40}/></div>;

  return (
    <div className="max-w-3xl mx-auto pb-12 transition-colors relative">
      
      {/* ⭐ Strict check: Only render if notification is not null */}
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="flex items-center gap-4 mb-8">
        <button type="button" onClick={() => navigate('/projects')} data-btn-id="7" className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{isEditMode ? "Edit Project" : "Create New Project"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 space-y-6 transition-colors">
        
        {errors.form && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-medium text-sm">
            {errors.form}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            className={`w-full p-3 border rounded-xl outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.title 
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
                : 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-400'
            }`} 
            value={formData.title} 
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) setErrors({ ...errors, title: null });
            }} 
          />
          {errors.title && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Project Description</label>
          <textarea 
            className={`w-full p-3 border rounded-xl outline-none transition-all min-h-[120px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.description 
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
                : 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-400'
            }`} 
            value={formData.description} 
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (errors.description) setErrors({ ...errors, description: null });
            }} 
          />
          {errors.description && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.description}</p>}
        </div>

        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Assign Team Members</label>
          
          <div className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 dark:focus-within:border-primary-400 transition-all min-h-[52px]">
            
            {formData.assignedUsers.map(userId => {
              const user = staffList.find(s => s._id === userId);
              if (!user) return null;
              return (
                <span key={userId} className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                  {user.name}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveUser(userId)}
                    data-btn-id="1"
                    className="hover:bg-primary-200 dark:hover:bg-primary-800/50 p-0.5 rounded-full transition-colors"
                  >
                    <X size={14} className="text-primary-600 dark:text-primary-400" />
                  </button>
                </span>
              );
            })}

            <div className="flex-1 min-w-[150px] flex items-center gap-2 px-2">
              <Search size={16} className="text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full outline-none bg-transparent text-sm p-1 text-gray-900 dark:text-white placeholder:text-gray-400"
                placeholder={formData.assignedUsers.length === 0 ? "Search and select members..." : "Add more members..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
              />
            </div>
          </div>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
              {availableStaff.length > 0 ? (
                availableStaff.map((staff) => (
                  <div 
                    key={staff._id} 
                    onClick={() => handleAddUser(staff._id)}
                    className="flex items-center gap-3 p-3 hover:bg-primary-50 dark:hover:bg-gray-700/50 cursor-pointer border-b last:border-none border-gray-100 dark:border-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{staff.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest">{staff.role?.name || 'Staff'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                  {searchQuery ? "No matching staff found" : "All staff members selected"}
                </div>
              )}
            </div>
          )}
        </div>

        <FormActionButtons 
          loading={loading} 
          isEditMode={isEditMode} 
          submitText={isEditMode ? "Save Changes" : "Initialize Project"}
          cancelPath="/projects" 
        />
      </form>
    </div>
  );
}