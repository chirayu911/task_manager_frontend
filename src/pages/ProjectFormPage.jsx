import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader, ArrowLeft, Search, X } from 'lucide-react';
import API from '../api';
import { toast } from 'react-toastify';
import FormActionButtons from '../components/FormActionButtons';

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [staffList, setStaffList] = useState([]);
  
  const [formData, setFormData] = useState({ title: '', description: '', assignedUsers: [] });
  
  // New states for the multi-select search bar
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
        toast.error("Failed to load data");
      } finally { 
        setPageLoading(false); 
      }
    };
    initData();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id, isEditMode]);

  // Handle adding a user from the dropdown
  const handleAddUser = (userId) => {
    if (!formData.assignedUsers.includes(userId)) {
      setFormData(prev => ({
        ...prev,
        assignedUsers: [...prev.assignedUsers, userId]
      }));
    }
    setSearchQuery('');
    inputRef.current?.focus(); // Keep focus on input for rapid selection
  };

  // Handle removing a user via the bubble's "X"
  const handleRemoveUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers.filter(id => id !== userId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Project Title is required");

    setLoading(true);
    try {
      if (isEditMode) {
        await API.put(`/projects/${id}`, formData);
        toast.success("Project updated successfully!");
      } else {
        await API.post('/projects', formData);
        toast.success("Project created and teams notified!");
      }
      navigate('/projects');
    } catch (err) {
      toast.error(isEditMode ? "Failed to update project" : "Failed to create project");
    } finally { 
      setLoading(false); 
    }
  };

  // Filter staff to exclude already selected users and match the search query
  const availableStaff = staffList.filter(staff => 
    !formData.assignedUsers.includes(staff._id) &&
    staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (pageLoading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 max-w-3xl mx-auto min-h-screen bg-gray-50">
      <div className="flex items-center gap-4 mb-8">
        <button type="button" onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? "Edit Project" : "Create New Project"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Project Title</label>
          <input 
            type="text" 
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            value={formData.title} 
            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Project Description</label>
          <textarea 
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[120px]" 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Assign Team Members</label>
          
          {/* Multi-Select Search Container */}
          <div className="w-full p-2 border border-gray-300 rounded-xl bg-white flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-blue-500 transition-all min-h-[52px]">
            
            {/* Selected User Bubbles */}
            {formData.assignedUsers.map(userId => {
              const user = staffList.find(s => s._id === userId);
              if (!user) return null; // Safety check while loading
              return (
                <span key={userId} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                  {user.name}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveUser(userId)}
                    className="hover:bg-blue-200 p-0.5 rounded-full transition-colors"
                  >
                    <X size={14} className="text-blue-600" />
                  </button>
                </span>
              );
            })}

            {/* Search Input inside the box */}
            <div className="flex-1 min-w-[150px] flex items-center gap-2 px-2">
              <Search size={16} className="text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full outline-none bg-transparent text-sm p-1"
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

          {/* Search Results Dropdown */}
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
              {availableStaff.length > 0 ? (
                availableStaff.map((staff) => (
                  <div 
                    key={staff._id} 
                    onClick={() => handleAddUser(staff._id)}
                    className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-b last:border-none border-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{staff.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{staff.role?.name || 'Staff'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-500 italic">
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