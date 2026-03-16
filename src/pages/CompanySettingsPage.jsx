import React, { useState, useEffect } from 'react';
import { Building2, Clock, CalendarX, Save, Loader2, Plus, Trash2, MapPin, Mail, Phone, ImagePlus } from 'lucide-react';
import API from '../api';
import Notification from '../components/Notification';

export default function CompanySettingsPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // ⭐ New State for Logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    phoneNumber: '',
    fullAddress: '',
    industry: '',
    workingDays: [],
    workingHours: { start: '09:00', end: '17:00' },
    breakTimings: { start: '13:00', end: '14:00' },
    holidays: []
  });

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const canEdit = user?.isCompanyOwner || user?.permissions?.includes('*');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { data } = await API.get('/company/mine');
        setFormData({
          companyName: data.companyName || '',
          companyEmail: data.companyEmail || '',
          phoneNumber: data.phoneNumber || '',
          fullAddress: data.fullAddress || '',
          industry: data.industry || '',
          workingDays: data.workingDays || [],
          workingHours: data.workingHours || { start: '09:00', end: '17:00' },
          breakTimings: data.breakTimings || { start: '13:00', end: '14:00' },
          holidays: data.holidays || []
        });

        // ⭐ Set initial logo preview if it exists in DB
        const existingLogo = data.logo || data.logoUrl;
        if (existingLogo) {
          // Point to your backend URL (e.g., http://localhost:5000/uploads/...)
          setLogoPreview(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${existingLogo.replace(/\\/g, '/')}`);
        }
      } catch (err) {
        console.error("Failed to fetch company", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchCompany();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const toggleDay = (day) => {
    if (!canEdit) return;
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const addHoliday = () => {
    setFormData(prev => ({
      ...prev,
      holidays: [...prev.holidays, { name: '', date: '' }]
    }));
  };

  const updateHoliday = (index, field, value) => {
    const newHolidays = [...formData.holidays];
    newHolidays[index][field] = value;
    setFormData(prev => ({ ...prev, holidays: newHolidays }));
  };

  const removeHoliday = (index) => {
    const newHolidays = formData.holidays.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, holidays: newHolidays }));
  };

  // ⭐ Handle Logo Selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file)); // Show preview instantly
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // ⭐ Since we have a file, we MUST use FormData
      const submitData = new FormData();
      submitData.append('companyName', formData.companyName);
      submitData.append('companyEmail', formData.companyEmail);
      submitData.append('phoneNumber', formData.phoneNumber);
      submitData.append('fullAddress', formData.fullAddress);
      submitData.append('industry', formData.industry);
      
      // Complex objects need to be stringified for FormData
      submitData.append('workingDays', JSON.stringify(formData.workingDays));
      submitData.append('workingHours', JSON.stringify(formData.workingHours));
      submitData.append('breakTimings', JSON.stringify(formData.breakTimings));
      submitData.append('holidays', JSON.stringify(formData.holidays));

      if (logoFile) {
        submitData.append('logo', logoFile); // The field name 'logo' must match your multer setup
      }

      await API.put('/company/mine', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setNotification({ type: 'success', message: 'Company settings updated successfully!' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  // Standardized Input Styling
  const inputClass = "w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm font-medium text-gray-700 dark:text-gray-200 mt-1 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all";
  const labelClass = "text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 flex items-center gap-1";
  const cardClass = "bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700";
  const cardHeaderClass = "text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4";

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen transition-colors">
      
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      {/* Standardized Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <Building2 className="text-blue-600" /> Company Settings
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage organization details, logo & working hours.</p>
        </div>

        <div className="flex gap-4">
          {canEdit && (
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex items-center gap-2.5 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none animate-in fade-in zoom-in-95 duration-200 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Changes
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* ================= SECTION 1: GENERAL INFO & LOGO ================= */}
        <div className={`${cardClass} space-y-5 h-fit`}>
          <h2 className={cardHeaderClass}><Building2 size={18} className="text-gray-400 dark:text-gray-500" /> General Info</h2>
          
          {/* ⭐ Logo Upload Section */}
          <div className="flex items-center gap-5 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="relative w-16 h-16 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Company Logo Preview" className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 size={24} className="text-gray-300 dark:text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Company Logo</label>
              <p className="text-[10px] text-gray-500 mb-2">Recommended size: Square (PNG/JPG). Used in PDF Headers.</p>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={handleLogoChange} 
                  disabled={!canEdit}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                />
                <button 
                  disabled={!canEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ImagePlus size={14} className="text-blue-500" />
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Company Name</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} disabled={!canEdit} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><Mail size={12}/> Email</label>
              <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} disabled={!canEdit} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}><Phone size={12}/> Phone</label>
              <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} disabled={!canEdit} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}><MapPin size={12}/> Full Address</label>
            <textarea name="fullAddress" value={formData.fullAddress} onChange={handleChange} disabled={!canEdit} rows="3" className={`${inputClass} resize-none`} />
          </div>
        </div>

        {/* ================= SECTION 2: TIMINGS & DAYS ================= */}
        <div className="space-y-8">
          <div className={cardClass}>
            <h2 className={cardHeaderClass}><Clock size={18} className="text-gray-400 dark:text-gray-500" /> Working Hours & Days</h2>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {allDays.map(day => {
                const isActive = formData.workingDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    disabled={!canEdit}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                        : 'bg-gray-50 text-gray-500 border border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 pb-2">Shift Timings</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-8">Start</span>
                  <input type="time" disabled={!canEdit} value={formData.workingHours.start} onChange={(e) => handleTimeChange('workingHours', 'start', e.target.value)} className={inputClass} style={{ marginTop: 0 }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-8">End</span>
                  <input type="time" disabled={!canEdit} value={formData.workingHours.end} onChange={(e) => handleTimeChange('workingHours', 'end', e.target.value)} className={inputClass} style={{ marginTop: 0 }} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 pb-2">Break Timings</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-8">Start</span>
                  <input type="time" disabled={!canEdit} value={formData.breakTimings.start} onChange={(e) => handleTimeChange('breakTimings', 'start', e.target.value)} className={inputClass} style={{ marginTop: 0 }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-8">End</span>
                  <input type="time" disabled={!canEdit} value={formData.breakTimings.end} onChange={(e) => handleTimeChange('breakTimings', 'end', e.target.value)} className={inputClass} style={{ marginTop: 0 }} />
                </div>
              </div>
            </div>
          </div>

          {/* ================= SECTION 3: HOLIDAYS ================= */}
          <div className={cardClass}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={cardHeaderClass} style={{ marginBottom: 0 }}>
                <CalendarX size={18} className="text-gray-400 dark:text-gray-500" /> Public Holidays
              </h2>
              {canEdit && (
                <button onClick={addHoliday} className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  <Plus size={14} /> Add Date
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {formData.holidays.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-4">No holidays configured yet.</p>
              ) : (
                formData.holidays.map((holiday, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input type="text" placeholder="Holiday Name (e.g. New Year)" value={holiday.name} onChange={(e) => updateHoliday(index, 'name', e.target.value)} disabled={!canEdit} className={inputClass} style={{ marginTop: 0 }} />
                    <input type="date" value={holiday.date} onChange={(e) => updateHoliday(index, 'date', e.target.value)} disabled={!canEdit} className={`${inputClass} w-36`} style={{ marginTop: 0 }} />
                    {canEdit && (
                      <button onClick={() => removeHoliday(index)} className="p-2.5 mt-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}