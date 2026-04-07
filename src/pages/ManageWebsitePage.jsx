import React, { useState, useEffect } from 'react';
import { Save, Upload, Trash2, Image as ImageIcon, Video, RefreshCw, Plus, Layout } from 'lucide-react';
import API from '../api';

export default function ManageWebsitePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ 
    logo: null, 
    images: [], 
    videos: [],
    adminName: '',
    adminEmail: '',
    adminMobile: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local state for newly uploaded files before saving
  const [newLogo, setNewLogo] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);

  // Feature state: array of { _id?, title, description, existingScreenshot, newScreenshotFile }
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/website-settings');
      setSettings(data);
      // Initialise features from DB
      setFeatures((data.features || []).map(f => ({
        _id: f._id,
        title: f.title || '',
        description: f.description || '',
        existingScreenshot: f.screenshot || null,
        newScreenshotFile: null,
        hasNewScreenshot: false
      })));
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

      // Append features metadata as JSON
      const featuresPayload = features.map(f => ({
        _id: f._id,
        title: f.title,
        description: f.description,
        existingScreenshot: f.existingScreenshot,
        hasNewScreenshot: f.hasNewScreenshot
      }));
      formData.append('featuresData', JSON.stringify(featuresPayload));

      // Append new feature screenshots IN ORDER (only those with hasNewScreenshot=true)
      features.forEach(f => {
        if (f.hasNewScreenshot && f.newScreenshotFile) {
          formData.append('featureScreenshots', f.newScreenshotFile);
        }
      });

      // Append new files
      if (newLogo) formData.append('logo', newLogo);
      newImages.forEach(file => formData.append('images', file));
      newVideos.forEach(file => formData.append('videos', file));

      // Append contact fields
      formData.append('adminName', settings.adminName || '');
      formData.append('adminEmail', settings.adminEmail || '');
      formData.append('adminMobile', settings.adminMobile || '');
      formData.append('companyAddress', settings.companyAddress || '');
      formData.append('companyEmail', settings.companyEmail || '');
      formData.append('companyPhone', settings.companyPhone || '');

      const { data } = await API.put('/website-settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Website settings updated successfully!');
      setSettings(data.settings);
      setFeatures((data.settings.features || []).map(f => ({
        _id: f._id,
        title: f.title || '',
        description: f.description || '',
        existingScreenshot: f.screenshot || null,
        newScreenshotFile: null,
        hasNewScreenshot: false
      })));
      
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

  const addFeature = () => {
    setFeatures([...features, { title: '', description: '', existingScreenshot: null, newScreenshotFile: null, hasNewScreenshot: false }]);
  };

  const removeFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index, field, value) => {
    setFeatures(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const setFeatureScreenshot = (index, file) => {
    setFeatures(prev => prev.map((f, i) => i === index
      ? { ...f, newScreenshotFile: file, hasNewScreenshot: true }
      : f
    ));
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

        {/* --- FEATURES SECTION --- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layout size={20} className="text-green-500" /> Feature Showcase
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Each feature appears as a section with a screenshot on the public landing page.</p>
            </div>
            <button
              onClick={addFeature}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg text-sm font-bold border border-green-200 dark:border-green-800 transition-colors"
            >
              <Plus size={16} /> Add Feature
            </button>
          </div>

          {features.length === 0 && (
            <div className="py-8 text-center text-sm font-bold text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              No features added yet. Click "Add Feature" to get started.
            </div>
          )}

          <div className="space-y-6">
            {features.map((feat, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                {/* Screenshot uploader */}
                <div className="flex-shrink-0">
                  <label className="relative cursor-pointer block w-40 h-28 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 transition-colors bg-white dark:bg-gray-800">
                    {feat.newScreenshotFile ? (
                      <img src={URL.createObjectURL(feat.newScreenshotFile)} alt="New" className="w-full h-full object-cover" />
                    ) : feat.existingScreenshot ? (
                      <img src={formatUrl(feat.existingScreenshot)} alt="Existing" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <ImageIcon size={24} />
                        <span className="text-[10px] font-bold mt-1">Screenshot</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files[0]) setFeatureScreenshot(i, e.target.files[0]);
                    }} />
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Click to change</div>
                  </label>
                </div>

                {/* Title & Description */}
                <div className="flex-1 flex flex-col gap-3">
                  <input
                    type="text"
                    value={feat.title}
                    onChange={(e) => updateFeature(i, 'title', e.target.value)}
                    placeholder="Feature title (e.g. Kanban Board)"
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500/30"
                  />
                  <textarea
                    value={feat.description}
                    onChange={(e) => updateFeature(i, 'description', e.target.value)}
                    placeholder="Describe this feature in 1-3 sentences..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500/30 resize-none"
                  />
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFeature(i)}
                  className="self-start p-2 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-red-100 dark:border-red-800"
                  title="Remove feature"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* --- ABOUT US & CONTACT INFO SECTION --- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus size={20} className="text-blue-500" /> About Us & Contact Details
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Provide administrator and company contact information for the landing page.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Administrator Details</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Admin Name"
                  value={settings.adminName || ''}
                  onChange={(e) => setSettings({ ...settings, adminName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <input
                  type="email"
                  placeholder="Admin Email"
                  value={settings.adminEmail || ''}
                  onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <input
                  type="text"
                  placeholder="Admin Mobile No."
                  value={settings.adminMobile || ''}
                  onChange={(e) => setSettings({ ...settings, adminMobile: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Company Details</h3>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Company Email"
                  value={settings.companyEmail || ''}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <input
                  type="text"
                  placeholder="Company Phone No."
                  value={settings.companyPhone || ''}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <textarea
                  placeholder="Company Address"
                  value={settings.companyAddress || ''}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
