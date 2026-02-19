import React, { useState, useEffect } from "react";
import { Shield, Settings, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import DataTable from "../components/DataTable";

export default function RolePage({ user }) {
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { fetchRoles(); }, []);

  const can = (perm) => {
    const perms = user?.permissions || [];
    if (user?.role === 'admin' || perms.includes('*')) return true;
    return perms.includes(perm);
  };

  const fetchRoles = async () => {
    try {
      const { data } = await API.get("/roles");
      setRoles(data);
    } catch (err) { console.error("Error fetching roles", err); }
  };

  const deleteRole = async (id) => {
    if (!window.confirm("Delete this role?")) return;
    try {
      await API.delete(`/roles/${id}`);
      setRoles(roles.filter((r) => r._id !== id));
    } catch (err) { alert("Failed to delete role."); }
  };

  const headers = [
    { label: "Role Name" },
    { label: "Permissions" },
    { label: "Actions", className: "text-center" }
  ];

  const renderRow = (role) => (
    <tr key={role._id} className="hover:bg-gray-50 transition">
      <td className="p-4 border-b capitalize font-medium">{role.name}</td>
      <td className="p-4 border-b">{role.permissions?.length || 0} Active</td>
      <td className="p-4 border-b">
        <div className="flex items-center justify-center gap-2">
           {can('roles_update') &&(
          <button onClick={() => navigate(`/admin/roles/${role._id}/permissions`)} className="bg-blue-50 text-blue-700 px-3 py-2 rounded font-medium hover:bg-blue-100 flex items-center gap-2 transition"><Settings size={16} /> Manage</button>
           )}
           {can('roles_delete') &&(
          <button onClick={() => deleteRole(role._id)} className="bg-red-50 text-red-600 px-3 py-2 rounded font-medium hover:bg-red-100 flex items-center gap-2 transition"><Trash2 size={16} /></button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="text-blue-600" /> Role Management</h2>
        {can('roles_create') &&(
        <button onClick={() => navigate("/admin/roles/permissions")} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"><Plus size={18} /> Create Role</button>
        )}
      </div>
      <DataTable headers={headers} data={roles} renderRow={renderRow} emptyMessage="No roles found." />
    </div>
  );
}