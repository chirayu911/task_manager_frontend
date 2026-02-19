import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, Save, ArrowLeft, ShieldPlus } from "lucide-react";
import API from "../api";

export default function RolePermissionMatrix() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id); // Check if we are editing or creating

  const [roleName, setRoleName] = useState("");
  const [resources, setResources] = useState([]);
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [loading, setLoading] = useState(true);

  const actions = ["read", "create", "update", "delete"];

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch all available permissions/resources for the matrix rows
      const permRes = await API.get("/permissions");
      setResources(permRes.data);

      // 2. If in Edit Mode, fetch existing role data
      if (isEditMode) {
        const roleRes = await API.get(`/roles/${id}`);
        const role = roleRes.data;
        setRoleName(role.name);
        // Ensure permissions are handled as an array of IDs or slugs based on your Model
        setSelectedPerms(role.permissions || []);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // -------- HELPERS --------
  const makePerm = (resource, action) => `${resource}_${action}`;

  const allPermissions = resources.flatMap(r =>
    actions.map(a => makePerm(r.value, a))
  );

  // -------- TOGGLES --------
  const togglePerm = perm => {
    setSelectedPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const toggleRow = resource => {
    const rowPerms = actions.map(a => makePerm(resource, a));
    const allSelected = rowPerms.every(p => selectedPerms.includes(p));
    setSelectedPerms(prev =>
      allSelected
        ? prev.filter(p => !rowPerms.includes(p))
        : [...new Set([...prev, ...rowPerms])]
    );
  };

  const toggleColumn = action => {
    const colPerms = resources.map(r => makePerm(r.value, action));
    const allSelected = colPerms.every(p => selectedPerms.includes(p));
    setSelectedPerms(prev =>
      allSelected
        ? prev.filter(p => !colPerms.includes(p))
        : [...new Set([...prev, ...colPerms])]
    );
  };

  const toggleAll = () => {
    const allSelected = allPermissions.every(p => selectedPerms.includes(p));
    setSelectedPerms(allSelected ? [] : allPermissions);
  };

  // -------- CHECK STATES --------
  const isAllChecked = allPermissions.length > 0 && allPermissions.every(p => selectedPerms.includes(p));
  const isColumnChecked = action => resources.map(r => makePerm(r.value, action)).every(p => selectedPerms.includes(p));
  const isRowChecked = resource => actions.map(a => makePerm(resource, a)).every(p => selectedPerms.includes(p));

  // -------- SAVE / CREATE --------
  const saveChanges = async () => {
    if (!roleName.trim()) {
      alert("Please enter a role name.");
      return;
    }

    try {
      const payload = {
        name: roleName.toLowerCase(), // Store as lowercase for consistency
        permissions: selectedPerms,
      };

      if (isEditMode) {
        await API.put(`/roles/${id}`, payload);
        alert("Role Updated!");
      } else {
        await API.post(`/roles`, payload);
        alert("New Role Created!");
      }

      navigate("/admin/roles");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <Loader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black mb-4">
            <ArrowLeft size={18} /> Back to Roles
          </button>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShieldPlus className="text-blue-600" />
              {isEditMode ? "Edit Role" : "Create New Role"}
            </h2>
            <input
              type="text"
              placeholder="Enter Role Name (e.g. Manager)"
              className="max-w-md border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={saveChanges}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-all font-bold"
        >
          <Save size={20} /> {isEditMode ? "Update Permissions" : "Create Role"}
        </button>
      </div>

      {/* MATRIX TABLE */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-5 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Feature</th>
              <th className="text-center p-3 border-l border-gray-200 bg-gray-100/50">
                <input type="checkbox" className="w-5 h-5 cursor-pointer" checked={isAllChecked} onChange={toggleAll} />
                <div className="text-[10px] font-black mt-1">ALL</div>
              </th>
              {actions.map(a => (
                <th key={a} className="text-center p-3">
                  <input type="checkbox" className="w-5 h-5 cursor-pointer" checked={isColumnChecked(a)} onChange={() => toggleColumn(a)} />
                  <div className="uppercase text-[10px] font-black mt-1">{a}</div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {resources.map(r => (
              <tr key={r._id} className="hover:bg-blue-50/30 transition-colors">
                <td className="p-5 capitalize font-semibold text-gray-700">{r.name}</td>
                <td className="text-center p-3 border-l border-gray-50 bg-gray-50/30">
                  <input type="checkbox" className="w-5 h-5 cursor-pointer" checked={isRowChecked(r.value)} onChange={() => toggleRow(r.value)} />
                </td>
                {actions.map(a => {
                  const perm = makePerm(r.value, a);
                  return (
                    <td key={a} className="text-center p-3">
                      <input type="checkbox" className="w-5 h-5 cursor-pointer" checked={selectedPerms.includes(perm)} onChange={() => togglePerm(perm)} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}