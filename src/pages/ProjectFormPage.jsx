import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader, ArrowLeft, ChevronDown, Check } from 'lucide-react';
import API from '../api';
import { toast } from 'react-toastify';
import FormActionButtons from '../components/FormActionButtons'; // ⭐ Imported

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [staffList, setStaffList] = useState([]);
  
  const [formData, setFormData] = useState({ title: '', description: '', assignedUsers: [] });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
      } finally { setPageLoading(false); }
    };
    initData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id, isEditMode]);

  const handleCheckboxChange = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers.includes(userId) 
        ? prev.assignedUsers.filter(id => id !== userId) 
        : [...prev.assignedUsers, userId]
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
    } finally { setLoading(false); }
  };

  if (pageLoading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 max-w-3xl mx-auto min-h-screen bg-gray-50">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? "Edit Project" : "Create New Project"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Project Title</label>
          <input type="text" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Project Description</label>
          <textarea className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        </div>

        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Assign Team Members</label>
          <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full p-3 border border-gray-300 rounded-xl bg-white cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors">
            <span className={formData.assignedUsers.length === 0 ? "text-gray-400" : "text-gray-800 font-medium"}>
              {formData.assignedUsers.length === 0 ? "Select members..." : `${formData.assignedUsers.length} member(s) selected`}
            </span>
            <ChevronDown size={20} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
              {staffList.map((staff) => (
                <label key={staff._id} className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-b last:border-none border-gray-100">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.assignedUsers.includes(staff._id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                    {formData.assignedUsers.includes(staff._id) && <Check size={14} className="text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.assignedUsers.includes(staff._id)} onChange={() => handleCheckboxChange(staff._id)} />
                  <div>
                    <p className="text-sm font-bold text-gray-800">{staff.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{staff.role?.name || 'Staff'}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* ⭐ Standardized Action Buttons */}
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