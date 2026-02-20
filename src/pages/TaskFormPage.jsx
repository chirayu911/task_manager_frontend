import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Loader, ArrowLeft, Image as ImageIcon, Video, Maximize2, X, Trash2, AtSign } from 'lucide-react';
import API from '../api';
import { toast } from 'react-toastify';

export default function TaskFormPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({ title: '', status: '', assignedTo: '', description: '' });
  
  // Media States
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]); // ⭐ Changed to Array
  const [previews, setPreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]); // ⭐ Changed to Array
  
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]); // ⭐ Changed to Array
  
  // Mentions State
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
      try {
        const [statusRes, userRes] = await Promise.all([
          API.get('/task-statuses'),
          API.get('/users')
        ]);

        setStatusList(statusRes.data.filter(s => s.status === 'active'));
        setStaffList(userRes.data.filter(u => (u.role?.name || u.role) !== 'customer'));

        if (isEditMode) {
          const { data: task } = await API.get(`/tasks/${id}`);
          setFormData({
            title: task.title || '',
            status: task.status?._id || task.status || '',
            assignedTo: task.assignedTo?._id || task.assignedTo || '',
            description: task.description || ''
          });
          setExistingImages(task.images || []);
          setExistingVideos(task.videos || []);
        }
      } catch (err) {
        toast.error("Failed to load task data.");
      } finally { setFetching(false); }
    };
    initData();
  }, [id, isEditMode]);

  // ⭐ Multi-Video Logic
  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingVideos.length > 3) return toast.error("Max 3 videos allowed");
    setVideos(prev => [...prev, ...files]);
    setVideoPreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  // ⭐ Mentions Logic
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, selectionStart);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    setFormData({ ...formData, description: value });

    if (lastAtSymbol !== -1 && lastAtSymbol >= textBeforeCursor.length - 20) {
      const query = textBeforeCursor.substring(lastAtSymbol + 1);
      setMentionQuery(query);
      setShowMentionList(true);
      // Basic positioning
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
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('status', formData.status);
      data.append('assignedTo', formData.assignedTo || "");
      
      // Collect mentioned user IDs to trigger backend mailer
      const mentionedIds = staffList
        .filter(s => formData.description.includes(`@${s.name}`))
        .map(s => s._id);
      data.append('mentionedUsers', JSON.stringify(mentionedIds));

      data.append('existingImages', JSON.stringify(existingImages));
      data.append('existingVideos', JSON.stringify(existingVideos));
      
      images.forEach(img => data.append('images', img));
      videos.forEach(vid => data.append('videos', vid));

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (isEditMode) await API.put(`/tasks/${id}`, data, config);
      else await API.post('/tasks', data, config);

      toast.success("Task updated and notifications sent");
      navigate('/tasks');
    } catch (err) { toast.error("Save failed"); } finally { setLoading(false); }
  };

  if (fetching) return <div className="p-20 text-center animate-pulse font-bold text-gray-400">LOADING TASK ARCHIVE...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/tasks')} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Task Configuration</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 space-y-10">
        <div className="grid grid-cols-1 gap-8">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Task Title</label>
            <input type="text" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-lg" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>

          {/* Description with Mentions */}
          <div className="relative space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <AtSign size={14}/> Detailed Description (use @ to mention)
            </label>
            <textarea 
              ref={textAreaRef}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 min-h-[150px] font-medium leading-relaxed" 
              value={formData.description} 
              onChange={handleDescriptionChange} 
              placeholder="Describe requirements..."
            />
            
            {showMentionList && (
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

        {/* Status & Assign */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Current Status</label>
              <select className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} required>
                {statusList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            {canUpdate && (
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Responsible Staff</label>
                <select className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold" value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}
        </div>

        {/* Media Section: Multi-Image & Multi-Video */}
        <div className="space-y-8 pt-10 border-t border-gray-100">
          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={16}/> Visual Documentation</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="relative aspect-square bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center text-blue-400 hover:bg-blue-100 transition-colors">
                <input type="file" multiple accept="image/*" onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setImages([...images, ...files]);
                  setPreviews([...previews, ...files.map(f => URL.createObjectURL(f))]);
                }} className="absolute inset-0 opacity-0 cursor-pointer" />
                <ImageIcon size={24} />
              </div>
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

          {/* Videos - Now Bigger and Multi-Video */}
          <div className="space-y-4 pt-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Video size={16}/> Video Attachments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="relative h-48 bg-purple-50 border-2 border-dashed border-purple-200 rounded-3xl flex flex-col items-center justify-center text-purple-400 hover:bg-purple-100 transition-colors">
                <input type="file" multiple accept="video/*" onChange={handleVideoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Video size={40} className="mb-2" />
                <span className="text-[10px] font-black">DROP MP4 FILES</span>
              </div>
              {existingVideos.map((path, i) => (
                <div key={`ev-${i}`} className="group relative h-48 rounded-3xl overflow-hidden bg-black shadow-xl">
                  <video src={`http://localhost:5000/${path}`} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button type="button" onClick={() => setSelectedMedia({url: `http://localhost:5000/${path}`, type: 'video'})} className="bg-white/20 p-2 rounded-lg backdrop-blur-md"><Maximize2 size={16}/></button>
                    <button type="button" onClick={() => setExistingVideos(existingVideos.filter((_, idx) => idx !== i))} className="bg-red-500 p-2 rounded-lg text-white"><Trash2 size={16}/></button>
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
                  }} className="absolute top-2 right-2 bg-red-500 p-2 rounded-lg text-white"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-10 flex gap-4">
          <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:shadow-2xl hover:scale-[1.01] transition-all disabled:opacity-50 uppercase tracking-widest text-sm">
            {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
            Synchronize Task Data
          </button>
          <button type="button" onClick={() => navigate('/tasks')} className="px-10 py-5 bg-white border border-gray-200 text-gray-400 font-bold rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-xs">Abondon</button>
        </div>
      </form>

      {/* Media Lightbox */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl" onClick={() => setSelectedMedia(null)}>
          <button className="absolute top-6 right-6 text-white"><X size={32}/></button>
          {selectedMedia.type === 'video' ? (
            <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-3xl" />
          ) : (
            <img src={selectedMedia.url} className="max-w-full max-h-[80vh] rounded-3xl object-contain" alt=""/>
          )}
        </div>
      )}
    </div>
  );
}