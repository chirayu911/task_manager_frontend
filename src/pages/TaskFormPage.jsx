import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, Loader, ArrowLeft, CheckCircle } from 'lucide-react';
import API from '../api';
import { toast } from 'react-toastify';

export default function TaskFormPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    status: '', // Now expects a TaskStatus ObjectId
    assignedTo: ''
  });

  const [staffList, setStaffList] = useState([]);
  const [statusList, setStatusList] = useState([]); // ⭐ Dynamic status state
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // ✅ Safety Guard: Normalize role and permissions
  const userRoleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const isAdmin = userRoleName === 'admin' || (user?.permissions || []).includes('*');

  useEffect(() => {
    // 1. Wait for user session to be verified
    if (!user) return;

    const initData = async () => {
      try {
        // 2. Fetch Active Statuses from your new API
        const { data: allStatuses } = await API.get('/task-statuses');
        const activeStatuses = allStatuses.filter(s => s.status === 'active');
        setStatusList(activeStatuses);

        // 3. Fetch Staff list if Admin
        if (isAdmin) {
          const { data: users } = await API.get('/users');
          setStaffList(users.filter(u => {
            const rName = typeof u.role === 'object' ? u.role?.name : u.role;
            return rName === 'staff' || rName === 'admin';
          }));
        }

        // 4. Fetch Task Data if Editing
        if (isEditMode) {
          const { data: task } = await API.get(`/tasks/${id}`);
          setFormData({
            title: task.title || '',
            // Ensure we handle both populated objects and raw IDs
            status: task.status?._id || task.status || '',
            assignedTo: task.assignedTo?._id || task.assignedTo || ''
          });
        } else if (activeStatuses.length > 0) {
          // Default to the first active status for new tasks
          setFormData(prev => ({ ...prev, status: activeStatuses[0]._id }));
        }
      } catch (err) {
        console.error("Initialization error:", err);
        toast.error("Failed to load task or status data.");
        if (isEditMode) navigate('/tasks');
      } finally {
        setFetching(false);
      }
    };

    initData();
  }, [id, isEditMode, isAdmin, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Title is required");
    if (!formData.status) return toast.error("Please select a status");

    setLoading(true);
    try {
      const payload = {
        ...formData,
        assignedTo: formData.assignedTo === "" ? null : formData.assignedTo
      };

      if (isEditMode) {
        await API.put(`/tasks/${id}`, payload);
        toast.success("Task updated successfully");
      } else {
        if (!isAdmin) payload.assignedTo = user._id;
        await API.post('/tasks', payload);
        toast.success("Task created successfully");
      }
      navigate('/tasks');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save task.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Early return to prevent "undefined role" crash
  if (!user) return <div className="p-20 text-center"><Loader className="animate-spin inline mr-2"/> Verifying session...</div>;
  
  if (fetching) return (
    <div className="p-20 text-center bg-gray-50 min-h-screen">
      <Loader className="animate-spin text-blue-600 inline mr-2" size={32}/>
      <p className="mt-4 text-gray-500 font-medium">Preparing Form...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen bg-gray-50">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/tasks')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          {isEditMode ? 'Edit Task' : 'Create New Task'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 space-y-6">
        {/* Title Field */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Task Title</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="What needs to be done?"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dynamic Status Dropdown */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Status</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white cursor-pointer shadow-sm focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="" disabled>Select Status</option>
              {statusList.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Assignment Field */}
          {isAdmin ? (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Assign To</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white cursor-pointer shadow-sm focus:ring-2 focus:ring-blue-500"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                <option value="">Unassigned</option>
                {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Assignee</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 flex items-center gap-2 text-sm font-medium italic">
                <CheckCircle size={16} className="text-green-500" /> Assigned to you
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="pt-4 flex gap-3">
          <button 
            type="submit" 
            disabled={loading} 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
            {isEditMode ? 'Update Task' : 'Create Task'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/tasks')} 
            className="px-6 py-3 border border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <X size={20} /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
}