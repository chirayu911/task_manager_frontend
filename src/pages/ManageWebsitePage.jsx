import React, { useState, useEffect } from 'react';
import { Save, Upload, Trash2, Image as ImageIcon, Video, RefreshCw } from 'lucide-react';
import API from '../api';

export default function ManageWebsitePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ logo: null, images: [], videos: [] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local state for newly uploaded files before saving
  const [newLogo, setNewLogo] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/website-settings');
      setSettings(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load website settings.');
      setLoading(false);
    }
  };

  const formatUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    let baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    baseUrl = baseUrl.replace(/\/api\/?$/, '');
    const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
    return `${baseUrl}/${cleanPath}`;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const formData = new FormData();

      // Append kept existing images
      settings.images.forEach(img => formData.append('existingImages', img));
      
      // Append kept existing videos
      settings.videos.forEach(vid => formData.append('existingVideos', vid));

      // Append new files
      if (newLogo) formData.append('logo', newLogo);
      newImages.forEach(file => formData.append('images', file));
      newVideos.forEach(file => formData.append('videos', file));

      const { data } = await API.put('/website-settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Website settings updated successfully!');
      setSettings(data.settings);
      
      // Clear new uploads
      setNewLogo(null);
      setNewImages([]);
      setNewVideos([]);
      setSaving(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update website settings.');
      setSaving(false);
    }
  };

  const removeExistingImage = (index) => {
    const updatedImages = [...settings.images];
    updatedImages.splice(index, 1);
    setSettings({ ...settings, images: updatedImages });
  };

  const removeExistingVideo = (index) => {
    const updatedVideos = [...settings.videos];
    updatedVideos.splice(index, 1);
    setSettings({ ...settings, videos: updatedVideos });
  };

  const removeNewImage = (index) => {
    const updated = [...newImages];
    updated.splice(index, 1);
    setNewImages(updated);
  };

  const removeNewVideo = (index) => {
    const updated = [...newVideos];
    updated.splice(index, 1);
    setNewVideos(updated);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Manage Website Data</h1>
          <p className="text-sm font-bold text-gray-400">Update landing page logo, hero images, and showcase videos.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 border border-green-200 rounded-xl font-bold">
          {success}
        </div>
      )}

      <div className="space-y-8">
        
        {/* --- LOGO SECTION --- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon size={20} className="text-blue-500" /> Landing Page Logo
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Displayed in the top left navigation bar of the landing page.</p>
            </div>
            
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold border border-gray-200 dark:border-gray-600 transition-colors">
              <Upload size={16} /> Choose Logo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                if (e.target.files[0]) setNewLogo(e.target.files[0]);
              }} />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 items-center">
            {newLogo ? (
              <div className="relative group">
                <img src={URL.createObjectURL(newLogo)} alt="New Logo Preview" className="h-16 object-contain rounded border border-blue-300 shadow-sm bg-gray-50" />
                <button 
                  onClick={() => setNewLogo(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
                <div className="text-[10px] text-center font-bold text-blue-500 mt-1">NEW</div>
              </div>
            ) : settings.logo ? (
              <div className="relative group">
                <img src={formatUrl(settings.logo)} alt="Current Logo" className="h-16 object-contain rounded border border-gray-200 bg-gray-50" />
                <button 
                  onClick={() => setSettings({ ...settings, logo: null })}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <div className="text-sm font-bold text-gray-400 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">No logo uploaded</div>
            )}
          </div>
        </div>

        {/* --- IMAGES SECTION --- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon size={20} className="text-blue-500" /> Showcase Images
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload amazing screenshots to show what's new. (Max 10)</p>
            </div>
            
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold border border-gray-200 dark:border-gray-600 transition-colors">
              <Upload size={16} /> Choose Images
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                const files = Array.from(e.target.files);
                setNewImages([...newImages, ...files]);
              }} />
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {settings.images.map((img, i) => (
              <div key={i} className="relative group aspect-video bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img src={formatUrl(img)} alt={`Showcase ${i}`} className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeExistingImage(i)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            
            {newImages.map((file, i) => (
              <div key={`new-${i}`} className="relative group aspect-video bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border-2 border-blue-400 border-dashed">
                <img src={URL.createObjectURL(file)} alt={`New ${i}`} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-blue-500/20 pointer-events-none"></div>
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow">NEW</div>
                <button 
                  onClick={() => removeNewImage(i)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {settings.images.length === 0 && newImages.length === 0 && (
              <div className="col-span-full py-8 text-center text-sm font-bold text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                No images uploaded yet.
              </div>
            )}
          </div>
        </div>

        {/* --- VIDEOS SECTION --- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Video size={20} className="text-purple-500" /> Product Videos
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload MP4, WebM videos. Max 5 videos.</p>
            </div>
            
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold border border-gray-200 dark:border-gray-600 transition-colors">
              <Upload size={16} /> Choose Videos
              <input type="file" accept="video/mp4,video/mkv,video/avi,video/webm" multiple className="hidden" onChange={(e) => {
                const files = Array.from(e.target.files);
                setNewVideos([...newVideos, ...files]);
              }} />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {settings.videos.map((vid, i) => (
              <div key={i} className="relative group aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                <video src={formatUrl(vid)} controls className="w-full h-full object-contain" />
                <button 
                  onClick={() => removeExistingVideo(i)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 z-10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            {newVideos.map((file, i) => (
              <div key={`new-${i}`} className="relative group aspect-video bg-black rounded-xl overflow-hidden border-2 border-purple-400 border-dashed shadow-sm">
                <video src={URL.createObjectURL(file)} controls className="w-full h-full object-contain opacity-80" />
                <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs font-black px-2 py-0.5 rounded shadow z-10">NEW</div>
                <button 
                  onClick={() => removeNewVideo(i)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 z-10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {settings.videos.length === 0 && newVideos.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm font-bold text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                No videos uploaded yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
