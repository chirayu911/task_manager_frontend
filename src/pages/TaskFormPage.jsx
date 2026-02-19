import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Loader, ArrowLeft, Image as ImageIcon, Video, Maximize2, X, Trash2 } from 'lucide-react';
import API from '../api';
import { toast } from 'react-toastify';

export default function TaskFormPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({ title: '', status: '', assignedTo: '' });
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideo, setExistingVideo] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Permission Logic
  const perms = user?.permissions || [];
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const isAdmin = roleName === 'admin' || perms.includes('*');
  const canUpdate = isAdmin || perms.includes('tasks_update');

  useEffect(() => {
    if (!user) return;
    const initData = async () => {
      try {
        const { data: allStatuses } = await API.get('/task-statuses');
        const activeStatuses = allStatuses.filter(s => s.status === 'active');
        setStatusList(activeStatuses);

        // ⭐ Fetch staff list if admin OR has update permission
        if (isAdmin || perms.includes('tasks_update')) {
          const { data: users } = await API.get('/users');
          setStaffList(users.filter(u => (u.role?.name || u.role) !== 'customer'));
        }

        if (isEditMode) {
          const { data: task } = await API.get(`/tasks/${id}`);
          setFormData({
            title: task.title || '',
            status: task.status?._id || task.status || '',
            assignedTo: task.assignedTo?._id || task.assignedTo || ''
          });
          setExistingImages(task.images || []);
          setExistingVideo(task.video || null);
        } else if (activeStatuses.length > 0) {
          setFormData(prev => ({ ...prev, status: activeStatuses[0]._id }));
        }
      } catch (err) {
        toast.error("Failed to load task data.");
        if (isEditMode) navigate('/tasks');
      } finally { setFetching(false); }
    };
    initData();
  }, [id, isEditMode, isAdmin, perms, user, navigate]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingImages.length > 5) return toast.error("Max 5 images allowed");
    setImages(files);
    setPreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('status', formData.status);
      data.append('assignedTo', formData.assignedTo || "");
      data.append('existingImages', JSON.stringify(existingImages));
      data.append('existingVideo', existingVideo || "");
      
      images.forEach(img => data.append('images', img));
      if (video) data.append('video', video);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (isEditMode) await API.put(`/tasks/${id}`, data, config);
      else await API.post('/tasks', data, config);

      toast.success("Task saved");
      navigate('/tasks');
    } catch (err) {
      toast.error("Save failed");
    } finally { setLoading(false); }
  };

  const ActionOverlay = ({ onOpen, onDelete }) => (
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all duration-200">
      <button type="button" onClick={onOpen} className="p-3 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md transition-transform hover:scale-110"><Maximize2 size={20} /></button>
      <button type="button" onClick={onDelete} className="p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-xl backdrop-blur-md transition-transform hover:scale-110"><Trash2 size={20} /></button>
    </div>
  );

  if (!user) return null;
  if (fetching) return <div className="p-20 text-center"><Loader className="animate-spin inline mr-2" /> Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-50">
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" onClick={() => setSelectedMedia(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-red-500"><X size={40} /></button>
          {selectedMedia.type === 'video' ? (
            <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={selectedMedia.url} className="max-w-full max-h-[85vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} alt="" />
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/tasks')} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Task' : 'Create Task'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Task Title</label>
            <input type="text" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Status</label>
              <select className="w-full p-3 border border-gray-300 rounded-xl bg-white" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} required>
                {statusList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            {/* ⭐ Updated: Check for admin OR tasks_update permission */}
            {canUpdate && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Assign To</label>
                <select className="w-full p-3 border border-gray-300 rounded-xl bg-white" value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Image Gallery</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div className="relative aspect-square border-2 border-dashed border-blue-200 rounded-2xl hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-blue-400 group cursor-pointer">
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <ImageIcon size={32} className="mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Add New</span>
            </div>
            {existingImages.map((path, i) => (
              <div key={`old-${i}`} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border">
                <img src={`http://localhost:5000/${path}`} className="w-full h-full object-cover" alt="" />
                <span className="absolute top-2 left-2 bg-black/50 text-[8px] text-white px-2 py-0.5 rounded-full font-bold">SAVED</span>
                <ActionOverlay onOpen={() => setSelectedMedia({ url: `http://localhost:5000/${path}`, type: 'image' })} onDelete={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))} />
              </div>
            ))}
            {previews.map((src, i) => (
              <div key={`new-${i}`} className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-blue-500">
                <img src={src} className="w-full h-full object-cover" alt="" />
                <span className="absolute top-2 left-2 bg-blue-600 text-[8px] text-white px-2 py-0.5 rounded-full font-bold uppercase">New</span>
                <ActionOverlay onOpen={() => setSelectedMedia({ url: src, type: 'image' })} onDelete={() => { setImages(images.filter((_, idx) => idx !== i)); setPreviews(previews.filter((_, idx) => idx !== i)); }} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Video Documentation</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative h-40 border-2 border-dashed border-purple-200 rounded-2xl hover:bg-purple-50 transition-colors flex flex-col items-center justify-center text-purple-400 group cursor-pointer">
              <input type="file" accept="video/*" onChange={handleVideoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Video size={32} className="mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Replace Video</span>
            </div>
            {(existingVideo || videoPreview) && (
              <div className="group relative h-40 rounded-2xl overflow-hidden bg-black border shadow-lg">
                <video src={videoPreview || `http://localhost:5000/${existingVideo}`} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Video size={40} className="text-white opacity-40" /></div>
                <ActionOverlay onOpen={() => setSelectedMedia({ url: videoPreview || `http://localhost:5000/${existingVideo}`, type: 'video' })} onDelete={() => { setVideo(null); setVideoPreview(null); setExistingVideo(null); }} />
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 flex gap-3 border-t">
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg disabled:opacity-50">
            {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
            {isEditMode ? 'Save Task Updates' : 'Publish Task'}
          </button>
          <button type="button" onClick={() => navigate('/tasks')} className="px-8 py-4 border border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
        </div>
      </form>
    </div>
  );
}