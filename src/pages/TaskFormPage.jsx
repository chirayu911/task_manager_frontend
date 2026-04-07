import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Video, Maximize2, X, Trash2, AtSign, Loader, Calendar, Clock, CheckSquare, Plus } from 'lucide-react';
import API from '../api';
import FormActionButtons from '../components/FormActionButtons';
import Notification from '../components/Notification';

// Helper: Formats a JS Date to YYYY-MM-DDTHH:mm for datetime-local inputs in the user's local timezone
const toLocalISO = (date) => {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

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
    priority: 'Medium',
    startDate: '', // ⭐ NEW
    hours: '',     // ⭐ NEW
    endDate: ''    // ⭐ NEW (Auto-calculated)
  });
  
  // ⭐ NEW: Sub-tasks State
  const [subTasks, setSubTasks] = useState([]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  
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
  const [companySettings, setCompanySettings] = useState(null); // ⭐ NEW: For Date Calculation
  
  const [selectedMedia, setSelectedMedia] = useState(null);

  const perms = user?.permissions || [];
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const isAdmin = roleName === 'admin' || perms.includes('*');
  const canUpdate = isAdmin || perms.includes('tasks_update'); 

  useEffect(() => {
    const initData = async () => {
      if (!activeProjectId) return;

      try {
        const [statusRes, teamRes, companyRes] = await Promise.all([
          API.get(`/task-statuses?project=${activeProjectId}`),
          API.get(`/projects/${activeProjectId}/team`),
          API.get('/company/mine').catch(() => ({ data: null })) // Fetch company working hours
        ]);

        const activeStatuses = statusRes.data.filter(s => s.status === 'active');
        setStatusList(activeStatuses);
        setStaffList(teamRes.data || []);
        
        if (companyRes.data) {
          setCompanySettings(companyRes.data);
        }

        if (isEditMode || isViewMode) {
          const { data: item } = await API.get(`/tasks/${id}`);
          setFormData({
            title: item.title || '',
            status: item.status?._id || item.status || '',
            assignedTo: item.assignedTo?._id || item.assignedTo || '',
            description: item.description || '',
            priority: item.priority || 'Medium',
            startDate: item.startDate ? toLocalISO(item.startDate) : '',
            hours: item.hours || '',
            endDate: item.endDate ? toLocalISO(item.endDate) : ''
          });
          setSubTasks(item.subTasks || []);
          setExistingImages(item.images || []);
          setExistingVideos(item.videos || []);
        } else {
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

  // ==========================================
  // ⭐ ENGINE: Auto-Calculate End Date
  // ==========================================
  useEffect(() => {
    // Only auto-calculate if we have start date, hours, and company rules
    if (!formData.startDate || !formData.hours || !companySettings) return;

    const hoursNeeded = parseFloat(formData.hours);
    if (isNaN(hoursNeeded) || hoursNeeded <= 0) return;

    const { workingDays, workingHours, breakTimings, holidays } = companySettings;
    if (!workingDays || !workingHours) return;

    let current = new Date(formData.startDate);
    let minutesNeeded = Math.ceil(hoursNeeded * 60);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Fast-forward minute by minute (very fast in JS, handles weird fractions perfectly)
    while (minutesNeeded > 0) {
      const dayOfWeek = dayNames[current.getDay()];
      
      // Format to local date string to check against holidays (YYYY-MM-DD)
      const currentYear = current.getFullYear();
      const currentMonth = String(current.getMonth() + 1).padStart(2, '0');
      const currentDay = String(current.getDate()).padStart(2, '0');
      const dateStr = `${currentYear}-${currentMonth}-${currentDay}`;

      const isWorkingDay = workingDays.includes(dayOfWeek);
      const isHoliday = holidays?.some(h => h.date === dateStr);

      if (isWorkingDay && !isHoliday) {
        // Fast time check
        const h = current.getHours();
        const m = current.getMinutes();
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        const isWithinWork = timeStr >= workingHours.start && timeStr < workingHours.end;
        
        let isWithinBreak = false;
        if (breakTimings?.start && breakTimings?.end) {
          isWithinBreak = timeStr >= breakTimings.start && timeStr < breakTimings.end;
        }

        if (isWithinWork && !isWithinBreak) {
          minutesNeeded--;
        }
      }

      // If we still need minutes, increment by 1 min and check again
      if (minutesNeeded > 0) {
        current.setMinutes(current.getMinutes() + 1);
      }
    }

    setFormData(prev => ({ ...prev, endDate: toLocalISO(current) }));

  }, [formData.startDate, formData.hours, companySettings]);


  // ==========================================
  // ⭐ Sub-Tasks Logic
  // ==========================================
  const handleAddSubTask = () => {
    if (!newSubTaskTitle.trim()) return;
    const newTask = { id: Date.now().toString(), title: newSubTaskTitle, isCompleted: false };
    setSubTasks([...subTasks, newTask]);
    setNewSubTaskTitle('');
  };

  const toggleSubTask = (taskId) => {
    if (!canUpdate && isViewMode) return; // Prevent clicking if no permission
    setSubTasks(subTasks.map(t => 
      (t.id === taskId || t._id === taskId) ? { ...t, isCompleted: !t.isCompleted } : t
    ));
  };

  const removeSubTask = (taskId) => {
    setSubTasks(subTasks.filter(t => t.id !== taskId && t._id !== taskId));
  };


  // ==========================================
  // Media Handlers
  // ==========================================
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setNotification({ type: 'error', message: "Only image files are allowed!" });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { 
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

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('video/')) {
        setNotification({ type: 'error', message: "Only video files are allowed!" });
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { 
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
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required.";
    } else if (formData.title.length > 50) {
      newErrors.title = "Title cannot exceed 50 characters.";
    } else if (!/^[A-Za-z0-9\s-]+$/.test(formData.title)) { // Allowed numbers for task names
      newErrors.title = "Title contains invalid characters.";
    }

    // Optional Start Date & Hours
    // if (!formData.startDate) newErrors.startDate = "Start date is required.";
    // if (!formData.hours) newErrors.hours = "Estimated hours are required.";

    if (formData.description) {
      const sqlPattern = /(--|;|UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+[A-Za-z]+\s+SET|EXEC(\s|\())/i;
      if (sqlPattern.test(formData.description)) {
        newErrors.description = "Invalid input: SQL commands detected.";
      }
    }

    // Media is now optional
    /*
    if (images.length === 0 && existingImages.length === 0 && videos.length === 0 && existingVideos.length === 0) {
      setNotification({ type: 'error', message: "At least one photo or video is mandatory!" });
      return false;
    }
    */

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewMode && !canUpdate) return; 

    // If view mode but has update access, they might be checking off a sub-task. Save that!
    if (isViewMode && canUpdate) {
      setLoading(true);
      try {
        await API.put(`/tasks/${id}/subtasks`, { subTasks });
        setNotification({ type: 'success', message: `Checklist updated successfully!` });
      } catch (err) {
        setNotification({ type: 'error', message: "Failed to update checklist." });
      } finally {
        setLoading(false);
      }
      return;
    }

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
      
      // ⭐ Append New Fields
      data.append('startDate', formData.startDate);
      data.append('hours', formData.hours);
      data.append('endDate', formData.endDate);
      data.append('subTasks', JSON.stringify(subTasks));

      if (isIssueMode) data.append('priority', formData.priority);
      
      const mentionedIds = staffList
        .filter(s => formData.description.toLowerCase().includes(`@${s.name.toLowerCase()}`))
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
        <button onClick={() => navigate(returnPath)} className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors">Go Back</button>
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
  const inputBaseStyle = "w-full p-4 border rounded-2xl font-bold text-lg outline-none transition-all text-gray-900 dark:text-white";
  const inputActiveStyle = "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary-500";
  const inputDisabledStyle = "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed border-transparent";
  const labelStyle = "text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2";

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(returnPath)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">
          {isViewMode ? `${typeLabel} Details` : `${typeLabel} Configuration`}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl dark:shadow-none border border-gray-100 dark:border-gray-700 space-y-10 transition-colors">
        
        {/* ============================== */}
        {/* CORE DETAILS                   */}
        {/* ============================== */}
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-2">
            <label className={labelStyle}>
              {typeLabel} Title <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              className={`${inputBaseStyle} ${errors.title ? 'border-red-500 focus:ring-red-500' : inputActiveStyle} ${isViewMode && inputDisabledStyle}`}
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
            <label className={labelStyle}>
              <AtSign size={14}/> Detailed Description
            </label>
            <textarea 
              ref={textAreaRef}
              className={`${inputBaseStyle} min-h-[150px] font-medium leading-relaxed ${errors.description ? 'border-red-500' : inputActiveStyle} ${isViewMode && inputDisabledStyle}`}
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

        {/* ============================== */}
        {/* ⭐ TIMING & DATES SECTION      */}
        {/* ============================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="space-y-2">
              <label className={labelStyle}><Calendar size={14}/> Start Date <span className="text-red-500"></span></label>
              <input 
                type="datetime-local" 
                className={`w-full p-4 border rounded-2xl font-bold text-sm outline-none transition-all text-gray-900 dark:text-white ${errors.startDate ? 'border-red-500' : inputActiveStyle} ${isViewMode && inputDisabledStyle}`}
                value={formData.startDate} 
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value });
                  if (errors.startDate) setErrors(prev => ({ ...prev, startDate: null }));
                }}
                disabled={isViewMode}
              />
              {errors.startDate && <p className="text-red-500 text-xs font-bold ml-1">{errors.startDate}</p>}
            </div>

            <div className="space-y-2">
              <label className={labelStyle}><Clock size={14}/> Estimated Hours <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                min="0.5"
                step="0.5"
                placeholder="e.g. 10.5"
                className={`w-full p-4 border rounded-2xl font-bold text-sm outline-none transition-all text-gray-900 dark:text-white ${errors.hours ? 'border-red-500' : inputActiveStyle} ${isViewMode && inputDisabledStyle}`}
                value={formData.hours} 
                onChange={(e) => {
                  setFormData({ ...formData, hours: e.target.value });
                  if (errors.hours) setErrors(prev => ({ ...prev, hours: null }));
                }}
                disabled={isViewMode}
              />
              {errors.hours && <p className="text-red-500 text-xs font-bold ml-1">{errors.hours}</p>}
            </div>

            <div className="space-y-2">
              <label className={labelStyle}><Calendar size={14}/> Calculated End Date</label>
              <input 
                type="datetime-local" 
                className={`w-full p-4 border border-transparent rounded-2xl font-bold text-sm outline-none transition-all text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 cursor-not-allowed`}
                value={formData.endDate} 
                readOnly
                title="Auto-calculated based on start date, hours, and company timings"
              />
              <p className="text-[10px] text-gray-400 font-bold ml-1 italic">*Skips holidays & non-working hours</p>
            </div>
        </div>

        {/* ============================== */}
        {/* ⭐ SUB-TASKS (CHECKLIST)       */}
        {/* ============================== */}
        <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700">
          <h3 className={labelStyle}><CheckSquare size={16}/> Checklist / Sub-Tasks</h3>
          
          <div className="space-y-3">
            {subTasks.map((task, index) => (
              <div key={task.id || task._id || index} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${task.isCompleted ? 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30' : 'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700'}`}>
                <input 
                  type="checkbox" 
                  checked={task.isCompleted} 
                  onChange={() => toggleSubTask(task.id || task._id)}
                  disabled={!canUpdate && isViewMode}
                  className="w-5 h-5 accent-green-500 cursor-pointer"
                />
                <span className={`flex-1 text-sm font-bold ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                  {task.title}
                </span>
                {!isViewMode && (
                  <button type="button" onClick={() => removeSubTask(task.id || task._id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            {!isViewMode && (
              <div className="flex gap-2 items-center mt-2">
                <input 
                  type="text" 
                  placeholder="Add a new sub-task..."
                  value={newSubTaskTitle}
                  onChange={(e) => setNewSubTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubTask())}
                  className="flex-1 p-3 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                />
                <button type="button" onClick={handleAddSubTask} className="p-3 bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 rounded-xl hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors font-bold flex items-center gap-1 text-sm">
                  <Plus size={16}/> Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================== */}
        {/* META DETAILS                   */}
        {/* ============================== */}
        <div className={`grid grid-cols-1 ${gridColumnsClass} gap-6 pt-6 border-t border-gray-100 dark:border-gray-700`}>
            <div className="space-y-2">
              <label className={labelStyle}>Current Status</label>
              <select 
                className={`w-full p-4 border border-gray-100 dark:border-gray-700 rounded-2xl font-bold outline-none text-gray-900 dark:text-white transition-colors ${isViewMode ? inputDisabledStyle : inputActiveStyle + ' cursor-pointer'}`}
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                disabled={isViewMode}
                required
              >
                {statusList.length === 0 && <option value="">No Active Statuses</option>}
                {statusList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            {(canUpdate || isViewMode) && (
              <div className="space-y-2">
                <label className={labelStyle}>Responsible Staff</label>
                <select 
                  className={`w-full p-4 border border-gray-100 dark:border-gray-700 rounded-2xl font-bold outline-none text-gray-900 dark:text-white transition-colors ${isViewMode ? inputDisabledStyle : inputActiveStyle + ' cursor-pointer'}`}
                  value={formData.assignedTo} 
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  disabled={isViewMode}
                  required
                >
                  <option value="">Unassigned</option>
                  {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {isIssueMode && (
              <div className="space-y-2">
                <label className={labelStyle}>Priority Level</label>
                <select 
                  className={`w-full p-4 border border-gray-100 dark:border-gray-700 rounded-2xl font-bold outline-none text-gray-900 dark:text-white transition-colors ${isViewMode ? inputDisabledStyle : inputActiveStyle + ' cursor-pointer'}`}
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

        {/* ============================== */}
        {/* MEDIA UPLOADS                  */}
        {/* ============================== */}
        <div className="space-y-8 pt-10 border-t border-gray-100 dark:border-gray-700">
          
          <div className="space-y-4">
            <h3 className={labelStyle}>
              <ImageIcon size={16}/> Photos (Max 5MB, Max 5 Files)
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
                   <img src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${url}`} className="w-full h-full object-cover" alt=""/>
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button type="button" onClick={() => setSelectedMedia({url: `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${url}`, type: 'image'})} className="p-2 text-white"><Maximize2 size={18}/></button>
                      {!isViewMode && <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:text-red-500"><Trash2 size={18}/></button>}
                   </div>
                </div>
              ))}

              {previews.map((url, i) => (
                <div key={`pi-${i}`} className="group relative aspect-square rounded-2xl overflow-hidden shadow-md">
                   <img src={url} className="w-full h-full object-cover" alt=""/>
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button type="button" onClick={() => setSelectedMedia({url: url, type: 'image'})} className="p-2 text-white"><Maximize2 size={18}/></button>
                      <button type="button" onClick={() => {
                        setImages(prev => prev.filter((_, idx) => idx !== i));
                        setPreviews(prev => prev.filter((_, idx) => idx !== i));
                      }} className="p-2 text-red-400 hover:text-red-500"><Trash2 size={18}/></button>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <h3 className={labelStyle}>
              <Video size={16}/> Videos (Max 50MB, Max 3 Files)
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
                  <video src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${path}`} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button type="button" onClick={() => setSelectedMedia({url: `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${path}`, type: 'video'})} className="bg-white/20 p-2 rounded-lg backdrop-blur-md hover:bg-white/40 transition-colors"><Maximize2 size={16}/></button>
                    {!isViewMode && (
                      <button type="button" onClick={() => setExistingVideos(prev => prev.filter((_, idx) => idx !== i))} className="bg-red-500 p-2 rounded-lg text-white hover:bg-red-600 transition-colors"><Trash2 size={16}/></button>
                    )}
                  </div>
                </div>
              ))}
              {videoPreviews.map((url, i) => (
                <div key={`nv-${i}`} className="group relative h-48 rounded-3xl overflow-hidden bg-primary-900 shadow-xl">
                  <video src={url} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute top-2 left-2 bg-primary-600 text-[8px] text-white px-2 py-1 rounded-full font-bold">NEW UPLOAD</div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button type="button" onClick={() => setSelectedMedia({url: url, type: 'video'})} className="bg-white/20 p-2 rounded-lg backdrop-blur-md hover:bg-white/40 transition-colors"><Maximize2 size={16}/></button>
                    <button type="button" onClick={() => {
                      setVideos(prev => prev.filter((_, idx) => idx !== i));
                      setVideoPreviews(prev => prev.filter((_, idx) => idx !== i));
                    }} className="bg-red-500 p-2 rounded-lg text-white hover:bg-red-600 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isViewMode && !canUpdate ? (
          <div className="pt-8 border-t border-gray-100 dark:border-gray-700 mt-8 flex justify-end">
            <button 
              type="button" 
              onClick={() => navigate(returnPath)}
              className="px-10 py-4 bg-gray-900 dark:bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
            >
              <ArrowLeft size={18} />
              Return to {typeLabel} Board
            </button>
          </div>
        ) : (
          <FormActionButtons 
            loading={loading} 
            isEditMode={isEditMode || isViewMode} // If in viewMode and reached here, they updated the checklist
            submitText={isViewMode ? `Save Checklist` : (isEditMode ? `Update ${typeLabel}` : `Save ${typeLabel}`)}
            cancelText="cancel"
            cancelPath={returnPath} 
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