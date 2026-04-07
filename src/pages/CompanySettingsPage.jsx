import React, { useState, useEffect } from 'react';
import {
  Building2, Clock, CalendarX, Save, Loader2, Plus, Trash2,
  MapPin, Mail, Phone, ImagePlus, CreditCard, Users, Layers, Zap, ArrowUpCircle
} from 'lucide-react';
import { Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom'; // ⭐ Added for navigation
import API from '../api';
import Notification from '../components/Notification';
import { useThemeManager } from '../context/ThemeLoader';

export default function CompanySettingsPage({ user }) {
  const navigate = useNavigate(); // ⭐ Initialize navigate
  const { setThemeColor, THEME_PRESETS } = useThemeManager();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [usageData, setUsageData] = useState(null);

  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    phoneNumber: '',
    fullAddress: '',
    industry: '',
    themeColor: 'indigo',
    workingDays: [],
    workingHours: { start: '09:00', end: '17:00' },
    breakTimings: { start: '13:00', end: '14:00' },
    holidays: []
  });

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const canEdit = user?.isCompanyOwner || user?.permissions?.includes('*');

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const [companyRes, usageRes] = await Promise.all([
          API.get('/company/mine'),
          API.get('/company/usage').catch(() => ({ data: null }))
        ]);

        const data = companyRes.data;

        setFormData({
          companyName: data.companyName || '',
          companyEmail: data.companyEmail || '',
          phoneNumber: data.phoneNumber || '',
          fullAddress: data.fullAddress || '',
          industry: data.industry || '',
          themeColor: data.themeColor || 'indigo',
          workingDays: data.workingDays || [],
          workingHours: data.workingHours || { start: '09:00', end: '17:00' },
          breakTimings: data.breakTimings || { start: '13:00', end: '14:00' },
          holidays: data.holidays || []
        });

        const existingLogo = data.logo || data.logoUrl;
        if (existingLogo) {
          setLogoPreview(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${existingLogo.replace(/\\/g, '/')}`);
        }

        if (usageRes?.data) {
          setUsageData(usageRes.data);
        }

      } catch (err) {
        console.error("Failed to fetch company data", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchCompanyData();
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleThemeChange = (color) => {
    if (!canEdit) return;
    setFormData(prev => ({ ...prev, themeColor: color }));
    setThemeColor(color); // Provide live preview of the theme
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append('companyName', formData.companyName);
      submitData.append('companyEmail', formData.companyEmail);
      submitData.append('phoneNumber', formData.phoneNumber);
      submitData.append('fullAddress', formData.fullAddress);
      submitData.append('industry', formData.industry);
      submitData.append('workingDays', JSON.stringify(formData.workingDays));
      submitData.append('workingHours', JSON.stringify(formData.workingHours));
      submitData.append('breakTimings', JSON.stringify(formData.breakTimings));
      submitData.append('holidays', JSON.stringify(formData.holidays));
      submitData.append('themeColor', formData.themeColor);

      if (logoFile) submitData.append('logo', logoFile);

      await API.put('/company/mine', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNotification({ type: 'success', message: 'Company settings updated successfully!' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  const renderProgressBar = (label, current, max, Icon) => {
    const isUnlimited = max === -1;
    const displayMax = isUnlimited ? '∞' : max;
    const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
    const isNearLimit = !isUnlimited && percentage >= 90;

    return (
      <div className="mb-5 last:mb-0">
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            {Icon && <Icon size={12} className="text-primary-500" />} {label}
          </span>
          <span className={`text-xs font-black ${isNearLimit ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
            {current} <span className="text-gray-400 font-medium">/ {displayMax}</span>
          </span>
        </div>
        {!isUnlimited ? (
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden flex">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isNearLimit ? 'bg-red-500' : 'bg-primary-500'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        ) : (
          <div className="w-full bg-green-500/20 rounded-full h-1.5 overflow-hidden">
            <div className="w-full h-full bg-green-500 opacity-30"></div>
          </div>
        )}
      </div>
    );
  };

  const inputClass = "w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm font-medium text-gray-700 dark:text-gray-200 mt-1 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 transition-all";
  const labelClass = "text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 flex items-center gap-1";
  const cardClass = "bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700";
  const cardHeaderClass = "text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4";

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen transition-colors text-gray-900 dark:text-white">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <Building2 className="text-primary-600" /> Company Settings
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage organization details, logo & working hours.</p>
        </div>

        <div className="flex gap-4">
          {canEdit && (
            <Button
              onClick={handleSave}
              isLoading={saving}
              colorScheme="brand"
              size="lg"
              rounded="2xl"
              shadow="md"
              leftIcon={!saving && <Save size={18} />}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* LEFT COLUMN */}
        <div className="space-y-8">

          {/* ================= SECTION: SUBSCRIPTION & USAGE ================= */}
          {usageData && (
            <div className={`${cardClass} border-primary-100 dark:border-primary-900/30`}>
              <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <CreditCard size={20} className="text-primary-500" /> Plan Usage
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Current Plan: <span className="text-primary-600">{usageData.planName}</span></p>
                </div>

                {/* ⭐ UPGRADE BUTTON */}
                <button
                  onClick={() => navigate('/choose-plan')}
                  className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-orange-500/20 transition-all active:scale-95 animate-pulse hover:animate-none"
                >
                  <ArrowUpCircle size={14} className="group-hover:rotate-12 transition-transform" />
                  Upgrade Plan
                </button>
              </div>

              <div className="space-y-6 mt-2">
                {renderProgressBar("Staff Members", usageData.staff?.current || 0, usageData.staff?.max || 5, Users)}
                {renderProgressBar("Projects", usageData.projects?.current || 0, usageData.projects?.max || 1, Layers)}
                {renderProgressBar("Tasks & Issues", usageData.tasks?.current || 0, usageData.tasks?.max || 50, Zap)}

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className={labelClass}>Team Limit</p>
                    <p className="text-sm font-bold mt-1 text-gray-700 dark:text-gray-300">
                      {usageData.teamPerProject?.max === -1 ? 'Unlimited' : `${usageData.teamPerProject?.max} Per Project`}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${usageData.hasBulkUpload ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800/50' : 'bg-gray-50 border-gray-100 dark:bg-gray-900/50 dark:border-gray-800'}`}>
                    <p className={labelClass}>Bulk Upload</p>
                    <p className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${usageData.hasBulkUpload ? 'text-green-600' : 'text-gray-400'}`}>
                      {usageData.hasBulkUpload ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 1: GENERAL INFO & LOGO ================= */}
          <div className={`${cardClass} h-fit`}>
            <h2 className={cardHeaderClass}><Building2 size={18} className="text-gray-400 dark:text-gray-500" /> General Info</h2>
            <div className="space-y-5">
              <div className="flex items-center gap-5 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="relative w-16 h-16 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 size={24} className="text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Company Logo</label>
                  <p className="text-[10px] text-gray-500 mb-2 font-medium">PNG/JPG. Used in headers.</p>
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={handleLogoChange} disabled={!canEdit} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                    <button disabled={!canEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-lg">
                      <ImagePlus size={14} className="text-primary-500" /> {logoPreview ? 'Change' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>
              <div><label className={labelClass}>Company Name</label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} disabled={!canEdit} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}><Mail size={12} /> Email</label><input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} disabled={!canEdit} className={inputClass} /></div>
                <div><label className={labelClass}><Phone size={12} /> Phone</label><input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} disabled={!canEdit} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}><MapPin size={12} /> Full Address</label><textarea name="fullAddress" value={formData.fullAddress} onChange={handleChange} disabled={!canEdit} rows="3" className={`${inputClass} resize-none`} /></div>

              {/* THEME BRAND COLOR SELECTOR */}
              <div className="pt-2">
                <label className={labelClass}>Brand Color</label>
                <div className="flex gap-3 flex-wrap mt-3">
                  {Object.keys(THEME_PRESETS).map(color => {
                    const isActive = formData.themeColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleThemeChange(color)}
                        className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-all disabled:cursor-not-allowed ${isActive ? 'ring-offset-2 ring-2 ring-gray-400 dark:ring-gray-500 scale-110' : 'hover:scale-110 opacity-80'
                          }`}
                        style={{ backgroundColor: THEME_PRESETS[color]?.[500] || '#8b63f1' }}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          {/* Working Hours */}
          <div className={cardClass}>
            <h2 className={cardHeaderClass}><Clock size={18} className="text-gray-400" /> Working Hours</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {allDays.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)} disabled={!canEdit} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.workingDays.includes(day) ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-50 text-gray-500'}`}>
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Shift</h3>
                <input type="time" disabled={!canEdit} value={formData.workingHours.start} onChange={(e) => handleTimeChange('workingHours', 'start', e.target.value)} className={inputClass} />
                <input type="time" disabled={!canEdit} value={formData.workingHours.end} onChange={(e) => handleTimeChange('workingHours', 'end', e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Break</h3>
                <input type="time" disabled={!canEdit} value={formData.breakTimings.start} onChange={(e) => handleTimeChange('breakTimings', 'start', e.target.value)} className={inputClass} />
                <input type="time" disabled={!canEdit} value={formData.breakTimings.end} onChange={(e) => handleTimeChange('breakTimings', 'end', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Holidays */}
          <div className={cardClass}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={cardHeaderClass} style={{ marginBottom: 0 }}><CalendarX size={18} className="text-gray-400" /> Holidays</h2>
              {canEdit && <button type="button" onClick={addHoliday} className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg"><Plus size={14} /></button>}
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
              {formData.holidays.length === 0 ? <p className="text-sm text-gray-400 italic text-center py-4">No holidays.</p> : formData.holidays.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={h.name} onChange={(e) => updateHoliday(i, 'name', e.target.value)} disabled={!canEdit} className={inputClass} />
                  <input type="date" value={h.date} onChange={(e) => updateHoliday(i, 'date', e.target.value)} disabled={!canEdit} className={`${inputClass} w-36`} />
                  {canEdit && <button type="button" onClick={() => removeHoliday(i)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}