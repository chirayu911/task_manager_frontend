import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, ArrowLeft, Search, X, AlertTriangle } from 'lucide-react';
import API from '../api';
import { toast } from 'react-toastify';
import FormActionButtons from '../components/FormActionButtons';

export default function IssueFormPage({ user, activeProjectId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [staffList, setStaffList] = useState([]);

  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    severity: 'Medium',
    status: 'Open',
    assignedTo: [] // ⭐ Array for multiple assignees
  });

  // Multi-select search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
  const STATUS_OPTIONS = ['Open', 'In Progress', 'Under Review', 'Resolved', 'Closed'];

  useEffect(() => {
    const initData = async () => {
      if (!activeProjectId) return;

      try {
        // ⭐ Fetch ONLY the team members assigned to the active project
        const { data: teamRes } = await API.get(`/projects/${activeProjectId}/team`);
        setStaffList(teamRes || []);

        if (isEditMode) {
          const { data: issue } = await API.get(`/issues/${id}`);
          setFormData({
            title: issue.title || '',
            description: issue.description || '',
            severity: issue.severity || 'Medium',
            status: issue.status || 'Open',
            // Handle both single object or array depending on backend state
            assignedTo: Array.isArray(issue.assignedTo) 
              ? issue.assignedTo.map(u => u._id || u) 
              : (issue.assignedTo ? [issue.assignedTo._id || issue.assignedTo] : [])
          });
        }
      } catch (err) {
        toast.error("Failed to load issue data.");
      } finally { 
        setFetching(false); 
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
  }, [id, isEditMode, activeProjectId]);

  const handleAddUser = (userId) => {
    if (!formData.assignedTo.includes(userId)) {
      setFormData(prev => ({ ...prev, assignedTo: [...prev.assignedTo, userId] }));
    }
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleRemoveUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.filter(id => id !== userId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Topic is required");

    setLoading(true);
    try {
      // ⭐ Force the active project ID into the payload
      const payload = { ...formData, project: activeProjectId };

      if (isEditMode) {
        await API.put(`/issues/${id}`, payload);
        toast.success("Issue updated successfully");
      } else {
        await API.post('/issues', payload);
        toast.success("Issue reported successfully");
      }
      navigate('/issues');
    } catch (err) { 
      toast.error(err.response?.data?.message || "Operation failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  // Filter staff for the dropdown
  const availableStaff = staffList.filter(staff => 
    !formData.assignedTo.includes(staff._id) &&
    staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Guard against missing project selection
  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Project Selected</h2>
        <p className="text-gray-500 mb-6">You must select a project from the top navigation bar before managing issues.</p>
        <button onClick={() => navigate('/issues')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Go Back</button>
      </div>
    );
  }

  if (fetching) return <div className="flex justify-center p-20"><Loader className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-50">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/issues')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
          <AlertTriangle className="text-red-500" /> 
          {isEditMode ? "Edit Issue" : "Report New Issue"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 space-y-8">
        
        {/* Topic & Description */}
        <div className="space-y-6">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Issue Topic</label>
            <input 
              type="text" 
              className="w-full p-4 border border-gray-100 rounded-2xl font-bold text-lg outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              placeholder="e.g. Database connection timeout"
              required 
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Detailed Description</label>
            <textarea 
              className="w-full p-4 border border-gray-100 rounded-2xl font-medium outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all min-h-[120px]"
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Describe how to reproduce the bug..."
              required
            />
          </div>
        </div>

        {/* Severity & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Severity</label>
            <select 
              className="w-full p-4 border border-gray-100 rounded-2xl font-bold outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              value={formData.severity} 
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            >
              {SEVERITY_OPTIONS.map(sev => <option key={sev} value={sev}>{sev}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Status</label>
            <select 
              className="w-full p-4 border border-gray-100 rounded-2xl font-bold outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              value={formData.status} 
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>

        {/* Multi-Select Assignees (Project Team Only) */}
        <div className="relative" ref={dropdownRef}>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Assign To (Project Team)</label>
          
          <div className="w-full p-3 border border-gray-100 rounded-2xl bg-gray-50 flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-blue-500 transition-all min-h-[60px]">
            {formData.assignedTo.map(userId => {
              const user = staffList.find(s => s._id === userId);
              if (!user) return null;
              return (
                <span key={userId} className="flex items-center gap-1.5 bg-blue-100 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                  {user.name}
                  <button type="button" onClick={() => handleRemoveUser(userId)} className="hover:bg-blue-200 p-0.5 rounded-full transition-colors">
                    <X size={14} className="text-blue-600" />
                  </button>
                </span>
              );
            })}

            <div className="flex-1 min-w-[150px] flex items-center gap-2 px-2">
              <Search size={16} className="text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full outline-none bg-transparent text-sm font-medium"
                placeholder={formData.assignedTo.length === 0 ? "Search project team..." : "Add more members..."}
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
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
              {availableStaff.length > 0 ? (
                availableStaff.map((staff) => (
                  <div 
                    key={staff._id} 
                    onClick={() => handleAddUser(staff._id)}
                    className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{staff.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">{staff.role?.name || 'Staff'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-400 italic">
                  {searchQuery ? "No matching team members found." : "All team members are assigned."}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-50">
          <FormActionButtons 
            loading={loading} 
            isEditMode={isEditMode} 
            submitText={isEditMode ? "Update Issue" : "Report Issue"}
            cancelPath="/issues" 
          />
        </div>
      </form>
    </div>
  );
}