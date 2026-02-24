import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Video, Maximize2, X, Trash2, AtSign, Loader } from 'lucide-react';
import API from '../api';
import { toast } from 'react-toastify';
import FormActionButtons from '../components/FormActionButtons';

export default function TaskFormPage({ user, activeProjectId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isViewMode = location.pathname.includes('/view/');
  const isEditMode = Boolean(id) && !isViewMode;

  const [formData, setFormData] = useState({ 
    title: '', 
    status: '', 
    assignedTo: '', 
    description: ''
  });
  
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  
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
      // Guard clause: Require active project
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
          const { data: task } = await API.get(`/tasks/${id}`);
          setFormData({
            title: task.title || '',
            status: task.status?._id || task.status || '',
            assignedTo: task.assignedTo?._id || task.assignedTo || '',
            description: task.description || ''
          });
          setExistingImages(task.images || []);
          setExistingVideos(task.videos || []);
        } else {
          // ⭐ CRITICAL FIX: Automatically select the first status so it doesn't send an empty string
          if (activeStatuses.length > 0) {
            setFormData(prev => ({ ...prev, status: activeStatuses[0]._id }));
          }
        }
      } catch (err) {
        toast.error("Failed to load form data.");
      } finally { 
        setFetching(false); 
      }
    };
    initData();
  }, [id, isEditMode, isViewMode, activeProjectId]);

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingVideos.length > 3) return toast.error("Max 3 videos allowed");
    setVideos(prev => [...prev, ...files]);
    setVideoPreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  const handleDescriptionChange = (e) => {
    if (isViewMode) return; 
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, selectionStart);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    setFormData({ ...formData, description: value });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewMode) return; 

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('status', formData.status);
      data.append('assignedTo', formData.assignedTo || "");
      
      // ⭐ Force the active project ID into the payload
      data.append('project', activeProjectId); 
      
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
        toast.success("Task updated successfully");
      } else {
        await API.post('/tasks', data, config);
        toast.success("Task created successfully");
      }

      navigate('/tasks');
    } catch (err) { 
      // ⭐ Logs the exact validation error from Mongoose if it fails again
      console.error("BACKEND REJECTION:", err.response?.data); 
      toast.error(err.response?.data?.message || "Save failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  // Guard against missing project selection
  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Project Selected</h2>
        <p className="text-gray-500 mb-6">You must select a project from the top navigation bar before managing tasks.</p>
        <button onClick={() => navigate('/tasks')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Go Back</button>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center text-gray-400">
        <Loader className="animate-spin mb-4 text-blue-600" size={40} />
        <span className="font-bold tracking-widest uppercase text-sm">Loading Task Data...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/tasks')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
          {isViewMode ? "Task Details" : "Task Configuration"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 space-y-10">
        
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Task Title</label>
            <input 
              type="text" 
              className={`w-full p-4 border border-gray-100 rounded-2xl font-bold text-lg outline-none transition-all ${isViewMode ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white'}`}
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              disabled={isViewMode}
              required 
            />
          </div>

          <div className="relative space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <AtSign size={14}/> Detailed Description
            </label>
            <textarea 
              ref={textAreaRef}
              className={`w-full p-4 border border-gray-100 rounded-2xl min-h-[150px] font-medium leading-relaxed outline-none transition-all ${isViewMode ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white'}`}
              value={formData.description} 
              onChange={handleDescriptionChange} 
              disabled={isViewMode}
              placeholder="Describe requirements..."
            />
            
            {showMentionList && !isViewMode && (
              <div className="absolute z-50 bg-white shadow-2xl rounded-xl border border-gray-100 w-64 max-h-48 overflow-y-auto" style={{ top: mentionPos.top, left: mentionPos.left }}>
                {staffList.filter(s => s.name.toLowerCase().includes(mentionQuery.toLowerCase())).map(s => (
                  <div key={s._id} onClick={() => insertMention(s)} className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b last:border-none">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{s.name[0]}</div>
                    <span className="text-sm font-bold text-gray-700">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Current Status</label>
              <select 
                className={`w-full p-4 border border-gray-100 rounded-2xl font-bold outline-none ${isViewMode ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer'}`}
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
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Responsible Staff</label>
                <select 
                  className={`w-full p-4 border border-gray-100 rounded-2xl font-bold outline-none ${isViewMode ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer'}`}
                  value={formData.assignedTo} 
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  disabled={isViewMode}
                >
                  <option value="">Unassigned</option>
                  {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}
        </div>

        <div className="space-y-8 pt-10 border-t border-gray-100">
          
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={16}/> Visual Documentation
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              
              {!isViewMode && (
                <div className="relative aspect-square bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center text-blue-400 hover:bg-blue-100 transition-colors">
                  <input type="file" multiple accept="image/*" onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setImages([...images, ...files]);
                    setPreviews([...previews, ...files.map(f => URL.createObjectURL(f))]);
                  }} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <ImageIcon size={24} />
                </div>
              )}

              {existingImages.concat(previews).map((url, i) => (
                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden shadow-md">
                   <img src={url.startsWith('blob') ? url : `http://localhost:5000/${url}`} className="w-full h-full object-cover" alt=""/>
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button type="button" onClick={() => setSelectedMedia({url: url.startsWith('blob') ? url : `http://localhost:5000/${url}`, type: 'image'})} className="p-2 text-white"><Maximize2 size={18}/></button>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Video size={16}/> Video Attachments
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {!isViewMode && (
                <div className="relative h-48 bg-purple-50 border-2 border-dashed border-purple-200 rounded-3xl flex flex-col items-center justify-center text-purple-400 hover:bg-purple-100 transition-colors">
                  <input type="file" multiple accept="video/*" onChange={handleVideoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Video size={40} className="mb-2" />
                  <span className="text-[10px] font-black">DROP MP4 FILES</span>
                </div>
              )}

              {existingVideos.map((path, i) => (
                <div key={`ev-${i}`} className="group relative h-48 rounded-3xl overflow-hidden bg-black shadow-xl">
                  <video src={`http://localhost:5000/${path}`} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button type="button" onClick={() => setSelectedMedia({url: `http://localhost:5000/${path}`, type: 'video'})} className="bg-white/20 p-2 rounded-lg backdrop-blur-md hover:bg-white/40 transition-colors"><Maximize2 size={16}/></button>
                    {!isViewMode && (
                      <button type="button" onClick={() => setExistingVideos(existingVideos.filter((_, idx) => idx !== i))} className="bg-red-500 p-2 rounded-lg text-white hover:bg-red-600 transition-colors"><Trash2 size={16}/></button>
                    )}
                  </div>
                </div>
              ))}
              {videoPreviews.map((url, i) => (
                <div key={`nv-${i}`} className="group relative h-48 rounded-3xl overflow-hidden bg-blue-900 shadow-xl">
                  <video src={url} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute top-2 left-2 bg-blue-600 text-[8px] text-white px-2 py-1 rounded-full font-bold">NEW UPLOAD</div>
                  <button type="button" onClick={() => {
                    setVideos(videos.filter((_, idx) => idx !== i));
                    setVideoPreviews(videoPreviews.filter((_, idx) => idx !== i));
                  }} className="absolute top-2 right-2 bg-red-500 p-2 rounded-lg text-white hover:bg-red-600 transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isViewMode ? (
          <div className="pt-8 border-t border-gray-100 mt-8 flex justify-end">
            <button 
              type="button" 
              onClick={() => navigate('/tasks')}
              className="px-10 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
            >
              <ArrowLeft size={18} />
              Return to Task Board
            </button>
          </div>
        ) : (
          <FormActionButtons 
            loading={loading} 
            isEditMode={isEditMode} 
            submitText={isEditMode ? "Update task" : "Save task"}
            cancelText="cancel"
            cancelPath="/tasks" 
          />
        )}

      </form>

      {/* Media Lightbox */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl" onClick={() => setSelectedMedia(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"><X size={32}/></button>
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