import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Video, Maximize2, X, Trash2, AtSign, Loader } from 'lucide-react';
import API from '../api';
import FormActionButtons from '../components/FormActionButtons';
import Notification from '../components/Notification'; // ⭐ Custom notification component

export default function TaskFormPage({ user, activeProjectId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isIssueMode = location.pathname.includes('/issues');
  const typeLabel = isIssueMode ? 'Issue' : 'Task';
  const returnPath = isIssueMode ? '/issues' : '/tasks';

  const isViewMode = location.pathname.includes('/view/');
  const isEditMode = Boolean(id) && !isViewMode;

  const [formData, setFormData] = useState({ 
    title: '', 
    status: '', 
    assignedTo: '', 
    description: '',
    priority: 'Medium' 
  });
  
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPos, setMentionPos] = useState({ top: 0, left: 0 });
  const textAreaRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [staffList, setStaffList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  
  const [selectedMedia, setSelectedMedia] = useState(null);

  const perms = user?.permissions || [];
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const isAdmin = roleName === 'admin' || perms.includes('*');
  const canUpdate = isAdmin || perms.includes('tasks_update'); 

  useEffect(() => {
    const initData = async () => {
      if (!activeProjectId) return;

      try {
        const [statusRes, teamRes] = await Promise.all([
          API.get(`/task-statuses?project=${activeProjectId}`),
          API.get(`/projects/${activeProjectId}/team`)
        ]);

        const activeStatuses = statusRes.data.filter(s => s.status === 'active');
        setStatusList(activeStatuses);
        setStaffList(teamRes.data || []);

        if (isEditMode || isViewMode) {
          const { data: item } = await API.get(`/tasks/${id}`);
          setFormData({
            title: item.title || '',
            status: item.status?._id || item.status || '',
            assignedTo: item.assignedTo?._id || item.assignedTo || '',
            description: item.description || '',
            priority: item.priority || 'Medium' 
          });
          setExistingImages(item.images || []);
          setExistingVideos(item.videos || []);
        } else {
          // ⭐ BUG FIX: Default to "Pending" status if available
          const pendingStatus = activeStatuses.find(s => s.name.toLowerCase() === 'pending') || activeStatuses[0];
          if (pendingStatus) setFormData(prev => ({ ...prev, status: pendingStatus._id }));
        }
      } catch (err) {
        setNotification({ type: 'error', message: `Failed to load ${typeLabel.toLowerCase()} data.` });
      } finally { 
        setFetching(false); 
      }
    };
    initData();
  }, [id, isEditMode, isViewMode, activeProjectId, typeLabel]);

  // ⭐ BUG FIX: Image Validation & Removal
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setNotification({ type: 'error', message: "Only image files are allowed!" });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setNotification({ type: 'error', message: "Image size must be less than 5MB!" });
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > 5) {
      return setNotification({ type: 'error', message: "Max 5 images allowed!" });
    }
    
    setImages(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...validFiles.map(file => URL.createObjectURL(file))]);
  };

  // ⭐ BUG FIX: Video Validation & Removal
  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('video/')) {
        setNotification({ type: 'error', message: "Only video files are allowed!" });
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setNotification({ type: 'error', message: "Video size must be less than 50MB!" });
        return false;
      }
      if (videos.some(v => v.name === file.name)) {
        setNotification({ type: 'error', message: "Duplicate video file detected!" });
        return false;
      }
      return true;
    });

    if (videos.length + validFiles.length > 3) {
      return setNotification({ type: 'error', message: "Max 3 videos allowed!" });
    }
    
    setVideos(prev => [...prev, ...validFiles]);
    setVideoPreviews(prev => [...prev, ...validFiles.map(file => URL.createObjectURL(file))]);
  };

  const handleDescriptionChange = (e) => {
    if (isViewMode) return; 
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, selectionStart);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    setFormData({ ...formData, description: value });
    if (errors.description) setErrors(prev => ({ ...prev, description: null }));

    if (lastAtSymbol !== -1 && lastAtSymbol >= textBeforeCursor.length - 20) {
      const query = textBeforeCursor.substring(lastAtSymbol + 1);
      setMentionQuery(query);
      setShowMentionList(true);
      setMentionPos({ top: textAreaRef.current.offsetTop + 40, left: 20 });
    } else {
      setShowMentionList(false);
    }
  };

  const insertMention = (staff) => {
    const value = formData.description;
    const start = value.lastIndexOf('@');
    const end = textAreaRef.current.selectionStart;
    const newValue = value.substring(0, start) + `@${staff.name} ` + value.substring(end);
    setFormData({ ...formData, description: newValue });
    setShowMentionList(false);
    textAreaRef.current.focus();
  };

  const validateForm = () => {
    const newErrors = {};
    
    // ⭐ BUG FIX: Title Validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required.";
    } else if (formData.title.length > 50) {
      newErrors.title = "Title cannot exceed 50 characters.";
    } else if (!/^[A-Za-z\s-]+$/.test(formData.title)) {
      newErrors.title = "Title contains invalid characters (No specials/numbers allowed).";
    }

    // ⭐ BUG FIX: SQL Injection Check
    if (formData.description) {
      const sqlPattern = /(--|;|UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+[A-Za-z]+\s+SET|EXEC(\s|\())/i;
      if (sqlPattern.test(formData.description)) {
        newErrors.description = "Invalid input: SQL commands detected.";
      }
    }

    // ⭐ BUG FIX: Mandatory Media Check
    if (images.length === 0 && existingImages.length === 0 && videos.length === 0 && existingVideos.length === 0) {
      setNotification({ type: 'error', message: "At least one photo or video is mandatory!" });
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewMode) return; 
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('status', formData.status);
      data.append('assignedTo', formData.assignedTo || "");
      data.append('project', activeProjectId); 
      data.append('itemType', typeLabel);
      if (isIssueMode) data.append('priority', formData.priority);
      
      const mentionedIds = staffList
        .filter(s => formData.description.includes(`@${s.name}`))
        .map(s => s._id);
      data.append('mentionedUsers', JSON.stringify(mentionedIds));

      data.append('existingImages', JSON.stringify(existingImages));
      data.append('existingVideos', JSON.stringify(existingVideos));
      
      images.forEach(img => data.append('images', img));
      videos.forEach(vid => data.append('videos', vid));

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      
      if (isEditMode) {
        await API.put(`/tasks/${id}`, data, config);
        setNotification({ type: 'success', message: `${typeLabel} updated successfully!` });
      } else {
        await API.post('/tasks', data, config);
        setNotification({ type: 'success', message: `${typeLabel} created successfully!` });
      }

      // ⭐ Wait 1.5 seconds so the user can read the success popup
      setTimeout(() => navigate(returnPath), 1500);
      
    } catch (err) { 
      setNotification({ type: 'error', message: err.response?.data?.message || "Save failed" });
      setLoading(false);
    } 
  };

  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">No Project Selected</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">You must select a project from the top navigation bar before managing {typeLabel.toLowerCase()}s.</p>
        <button onClick={() => navigate(returnPath)} data-btn-id="7" className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors">Go Back</button>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center text-gray-400">
        <Loader className="animate-spin mb-4 text-primary-600 dark:text-primary-400" size={40} />
        <span className="font-bold tracking-widest uppercase text-sm">Loading {typeLabel} Data...</span>
      </div>
    );
  }

  const gridColumnsClass = isIssueMode && (canUpdate || isViewMode) ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      
      {/* ⭐ Custom Notification Component */}
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(returnPath)} data-btn-id="7" className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">
          {isViewMode ? `${typeLabel} Details` : `${typeLabel} Configuration`}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl dark:shadow-none border border-gray-100 dark:border-gray-700 space-y-10 transition-colors">
        
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
              {typeLabel} Title <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              className={`w-full p-4 border rounded-2xl font-bold text-lg outline-none transition-all text-gray-900 dark:text-white ${
                errors.title 
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary-500'
              } ${isViewMode && 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed'}`}
              value={formData.title} 
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors(prev => ({ ...prev, title: null }));
              }} 
              disabled={isViewMode}
              required 
            />
            {errors.title && <p className="text-red-500 text-xs font-bold ml-1">{errors.title}</p>}
          </div>

          <div className="relative space-y-2">
            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <AtSign size={14}/> Detailed Description
            </label>
            <textarea 
              ref={textAreaRef}
              className={`w-full p-4 border rounded-2xl min-h-[150px] font-medium leading-relaxed outline-none transition-all text-gray-900 dark:text-white ${
                errors.description 
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary-500'
              } ${isViewMode && 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed'}`}
              value={formData.description} 
              onChange={handleDescriptionChange} 
              disabled={isViewMode}
              placeholder="Describe requirements..."
            />
            {errors.description && <p className="text-red-500 text-xs font-bold ml-1">{errors.description}</p>}
            
            {showMentionList && !isViewMode && (
              <div className="absolute z-50 bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-100 dark:border-gray-700 w-64 max-h-48 overflow-y-auto" style={{ top: mentionPos.top, left: mentionPos.left }}>
                {staffList.filter(s => s.name.toLowerCase().includes(mentionQuery.toLowerCase())).map(s => (
                  <div key={s._id} onClick={() => insertMention(s)} className="p-3 hover:bg-primary-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3 border-b dark:border-gray-700 last:border-none transition-colors">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{s.name[0]}</div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${gridColumnsClass} gap-6`}>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Current Status</label>
              <select 
                className={`w-full p-4 border border-gray-100 dark:border-gray-700 rounded-2xl font-bold outline-none text-gray-900 dark:text-white transition-colors ${isViewMode ? 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed' : 'bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary-500 cursor-pointer'}`}
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                disabled={isViewMode}
                required
              >
                {statusList.length === 0 && <option value="">No Active Statuses Available</option>}
                {statusList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            {(canUpdate || isViewMode) && (
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Responsible Staff</label>
                <select 
                  className={`w-full p-4 border border-gray-100 dark:border-gray-700 rounded-2xl font-bold outline-none text-gray-900 dark:text-white transition-colors ${isViewMode ? 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed' : 'bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary-500 cursor-pointer'}`}
                  value={formData.assignedTo} 
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  disabled={isViewMode}
                >
                  <option value="">Unassigned</option>
                  {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {isIssueMode && (
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Priority Level</label>
                <select 
                  className={`w-full p-4 border border-gray-100 dark:border-gray-700 rounded-2xl font-bold outline-none text-gray-900 dark:text-white transition-colors ${isViewMode ? 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed' : 'bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary-500 cursor-pointer'}`}
                  value={formData.priority} 
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  disabled={isViewMode}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            )}
        </div>

        <div className="space-y-8 pt-10 border-t border-gray-100 dark:border-gray-700">
          
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={16}/> Photos (Max 5MB, Max 5 Files) <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              
              {!isViewMode && (
                <div className="relative aspect-square bg-primary-50 dark:bg-primary-900/20 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-2xl flex flex-col items-center justify-center text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <ImageIcon size={24} />
                </div>
              )}

              {existingImages.map((url, i) => (
                <div key={`ei-${i}`} className="group relative aspect-square rounded-2xl overflow-hidden shadow-md">
                   <img src={`http://localhost:5000/${url}`} className="w-full h-full object-cover" alt=""/>
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button type="button" data-btn-id="4" onClick={() => setSelectedMedia({url: `http://localhost:5000/${url}`, type: 'image'})} className="p-2 text-white"><Maximize2 size={18}/></button>
                      {!isViewMode && <button type="button" data-btn-id="2" onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:text-red-500"><Trash2 size={18}/></button>}
                   </div>
                </div>
              ))}

              {previews.map((url, i) => (
                <div key={`pi-${i}`} className="group relative aspect-square rounded-2xl overflow-hidden shadow-md">
                   <img src={url} className="w-full h-full object-cover" alt=""/>
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button type="button" data-btn-id="4" onClick={() => setSelectedMedia({url: url, type: 'image'})} className="p-2 text-white"><Maximize2 size={18}/></button>
                      <button type="button" data-btn-id="2" onClick={() => {
                        setImages(prev => prev.filter((_, idx) => idx !== i));
                        setPreviews(prev => prev.filter((_, idx) => idx !== i));
                      }} className="p-2 text-red-400 hover:text-red-500"><Trash2 size={18}/></button>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Video size={16}/> Videos (Max 50MB, Max 3 Files) <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {!isViewMode && (
                <div className="relative h-48 bg-purple-50 dark:bg-purple-900/20 border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-3xl flex flex-col items-center justify-center text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                  <input type="file" multiple accept="video/*" onChange={handleVideoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Video size={40} className="mb-2" />
                  <span className="text-[10px] font-black">DROP MP4 FILES</span>
                </div>
              )}

              {existingVideos.map((path, i) => (
                <div key={`ev-${i}`} className="group relative h-48 rounded-3xl overflow-hidden bg-black shadow-xl">
                  <video src={`http://localhost:5000/${path}`} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button type="button" data-btn-id="4" onClick={() => setSelectedMedia({url: `http://localhost:5000/${path}`, type: 'video'})} className="bg-white/20 p-2 rounded-lg backdrop-blur-md hover:bg-white/40 transition-colors"><Maximize2 size={16}/></button>
                    {!isViewMode && (
                      <button type="button" data-btn-id="2" onClick={() => setExistingVideos(prev => prev.filter((_, idx) => idx !== i))} className="bg-red-500 p-2 rounded-lg text-white hover:bg-red-600 transition-colors"><Trash2 size={16}/></button>
                    )}
                  </div>
                </div>
              ))}
              {videoPreviews.map((url, i) => (
                <div key={`nv-${i}`} className="group relative h-48 rounded-3xl overflow-hidden bg-primary-900 shadow-xl">
                  <video src={url} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute top-2 left-2 bg-primary-600 text-[8px] text-white px-2 py-1 rounded-full font-bold">NEW UPLOAD</div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button type="button" data-btn-id="4" onClick={() => setSelectedMedia({url: url, type: 'video'})} className="bg-white/20 p-2 rounded-lg backdrop-blur-md hover:bg-white/40 transition-colors"><Maximize2 size={16}/></button>
                    <button type="button" data-btn-id="2" onClick={() => {
                      setVideos(prev => prev.filter((_, idx) => idx !== i));
                      setVideoPreviews(prev => prev.filter((_, idx) => idx !== i));
                    }} className="bg-red-500 p-2 rounded-lg text-white hover:bg-red-600 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isViewMode ? (
          <div className="pt-8 border-t border-gray-100 dark:border-gray-700 mt-8 flex justify-end">
            <button 
              type="button" 
              onClick={() => navigate(returnPath)}
              data-btn-id="7"
              className="px-10 py-4 bg-gray-900 dark:bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
            >
              <ArrowLeft size={18} />
              Return to {typeLabel} Board
            </button>
          </div>
        ) : (
          <FormActionButtons 
            loading={loading} 
            isEditMode={isEditMode} 
            submitText={isEditMode ? `Update ${typeLabel}` : `Save ${typeLabel}`}
            cancelText="cancel"
            cancelPath={returnPath} 
          />
        )}

      </form>

      {/* Media Lightbox */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl" onClick={() => setSelectedMedia(null)}>
          <button data-btn-id="1" className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"><X size={32}/></button>
          {selectedMedia.type === 'video' ? (
            <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl" />
          ) : (
            <img src={selectedMedia.url} className="max-w-full max-h-[80vh] rounded-3xl object-contain shadow-2xl" alt=""/>
          )}
        </div>
      )}
    </div>
  );
}