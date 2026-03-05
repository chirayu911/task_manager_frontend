import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, ArrowLeft, ShieldPlus } from "lucide-react";
import API from "../api";
import FormActionButtons from "../components/FormActionButtons"; 
import Notification from '../components/Notification'; // ⭐ Replaced toast with Notification

export default function RolePermissionMatrix() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [roleName, setRoleName] = useState("");
  const [resources, setResources] = useState([]);
  const [selectedPerms, setSelectedPerms] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [notification, setNotification] = useState(null); 
  const [error, setError] = useState(""); // ⭐ Added targeted error state for the role name

  const actions = ["read", "create", "update", "delete"];

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const permRes = await API.get("/permissions");
      setResources(permRes.data);

      if (isEditMode) {
        const roleRes = await API.get(`/roles/${id}`);
        const role = roleRes.data;
        setRoleName(role.name);
        setSelectedPerms(role.permissions || []);
      }
    } catch (err) { 
      setNotification({ type: 'error', message: "Failed to load permissions data." });
    } finally { 
      setLoading(false); 
    }
  };

  const makePerm = (resource, action) => `${resource}_${action}`;
  const allPermissions = resources.flatMap(r => actions.map(a => makePerm(r.value, a)));

  const togglePerm = perm => setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);

  const toggleRow = resource => {
    const rowPerms = actions.map(a => makePerm(resource, a));
    const allSelected = rowPerms.every(p => selectedPerms.includes(p));
    setSelectedPerms(prev => allSelected ? prev.filter(p => !rowPerms.includes(p)) : [...new Set([...prev, ...rowPerms])]);
  };

  const toggleColumn = action => {
    const colPerms = resources.map(r => makePerm(r.value, action));
    const allSelected = colPerms.every(p => selectedPerms.includes(p));
    setSelectedPerms(prev => allSelected ? prev.filter(p => !colPerms.includes(p)) : [...new Set([...prev, ...colPerms])]);
  };

  const toggleAll = () => {
    const allSelected = allPermissions.every(p => selectedPerms.includes(p));
    setSelectedPerms(allSelected ? [] : allPermissions);
  };

  const isAllChecked = allPermissions.length > 0 && allPermissions.every(p => selectedPerms.includes(p));
  const isColumnChecked = action => resources.map(r => makePerm(r.value, action)).every(p => selectedPerms.includes(p));
  const isRowChecked = resource => actions.map(a => makePerm(resource, a)).every(p => selectedPerms.includes(p));

  // ⭐ BUG FIX: Validation Logic for Role Name
  const validateForm = () => {
    if (!roleName.trim()) return "Role name is required.";
    if (roleName.length > 50) return "Role name cannot exceed 50 characters.";
    if (!/^[A-Za-z\s]+$/.test(roleName)) return "Role name can only contain letters and spaces. No numbers or special characters allowed.";
    return null;
  };

  const saveChanges = async (e) => {
    e.preventDefault(); 
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const payload = { name: roleName, permissions: selectedPerms };

      if (isEditMode) {
        await API.put(`/roles/${id}`, payload);
        // ⭐ BUG FIX: Pass success state via router to show on the table page
        navigate("/admin/roles", { state: { feedback: { type: 'success', message: "Role updated successfully!" } } });
      } else {
        await API.post("/roles", payload);
        // ⭐ BUG FIX: Pass success state via router
        navigate("/admin/roles", { state: { feedback: { type: 'success', message: "Role created successfully!" } } });
      }
    } catch (err) { 
      setNotification({ type: 'error', message: err.response?.data?.message || "Internal Server Error" });
    } finally { 
      setLoading(false); 
    }
  };

  if (loading && isEditMode) return <div className="flex justify-center mt-20"><Loader className="animate-spin text-primary-600 dark:text-primary-400" size={40} /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto transition-colors">
      
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <button onClick={() => navigate(-1)} data-btn-id="7" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4 font-medium">
            <ArrowLeft size={18} /> Back to Roles
          </button>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
              <ShieldPlus className="text-primary-600 dark:text-primary-400" />
              {isEditMode ? "Edit Role" : "Create New Role"}
            </h2>
          </div>
        </div>
      </div>

      <form onSubmit={saveChanges} className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden p-6 transition-colors">
        <div className="mb-6">
           <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
             Role Name <span className="text-red-500">*</span>
           </label>
           <input 
             type="text" 
             placeholder="Enter Role Name (e.g. Manager)" 
             className={`max-w-md w-full border p-4 rounded-xl outline-none transition-all text-lg font-medium bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm ${error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-400'}`} 
             value={roleName} 
             onChange={(e) => {
               setRoleName(e.target.value);
               if (error) setError(""); // clear error on type
             }} 
           />
           {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
        </div>
        
        <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg hidden sm:table transition-colors">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
            <tr>
              <th className="p-5 text-left text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Feature</th>
              <th className="text-center p-3 border-l border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50">
                <input type="checkbox" className="w-5 h-5 cursor-pointer accent-primary-600" checked={isAllChecked} onChange={toggleAll} />
                <div className="text-[10px] font-black mt-1 text-gray-500 dark:text-gray-400">ALL</div>
              </th>
              {actions.map(a => (
                <th key={a} className="text-center p-3 text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700">
                  <input type="checkbox" className="w-5 h-5 cursor-pointer accent-primary-600" checked={isColumnChecked(a)} onChange={() => toggleColumn(a)} />
                  <div className="uppercase text-[10px] font-black mt-1">{a}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {resources.map(r => (
              <tr key={r._id} className="hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-colors">
                <td className="p-5 capitalize font-semibold text-gray-700 dark:text-gray-300">{r.name}</td>
                <td className="text-center p-3 border-l border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30">
                  <input type="checkbox" className="w-5 h-5 cursor-pointer accent-primary-600" checked={isRowChecked(r.value)} onChange={() => toggleRow(r.value)} />
                </td>
                {actions.map(a => {
                  const perm = makePerm(r.value, a);
                  return (
                    <td key={a} className="text-center p-3 border-l border-gray-50 dark:border-gray-700">
                      <input type="checkbox" className="w-5 h-5 cursor-pointer accent-primary-600" checked={selectedPerms.includes(perm)} onChange={() => togglePerm(perm)} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8">
          <FormActionButtons 
            loading={loading} 
            isEditMode={isEditMode} 
            submitText={isEditMode ? "Update Permissions" : "Create Role"}
            cancelPath="/admin/roles" 
          />
        </div>
      </form>
    </div>
  );
}