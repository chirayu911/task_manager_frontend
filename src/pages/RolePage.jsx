import React, { useState, useEffect } from "react";
import { Shield, Settings, Loader, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { EditButton, DeleteButton } from '../components/TableButtons'; // Ensure EditButton is imported
import { CreateButton, SearchBar } from '../components/PageHeader';
import Pagination from '../components/Pagination';

export default function RolePage({ user }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const perms = user?.permissions || [];
  const isAdmin = roleName === 'admin' || perms.includes('*');

  const can = (perm) => isAdmin || perms.includes(perm);

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/roles");
      setRoles(data);
    } catch (err) { 
      console.error("Error fetching roles", err); 
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (id) => {
    if (!window.confirm("Delete this role? This may affect users assigned to it.")) return;
    try {
      await API.delete(`/roles/${id}`);
      setRoles(roles.filter((r) => r._id !== id));
    } catch (err) { 
      console.error("Failed to delete role."); 
    }
  };

  // Filter & Pagination Logic
  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentTableData = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!user) return null;
  if (loading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Shield className="text-blue-600" /> Role Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">Define system roles and their associated permissions.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <SearchBar 
            value={searchTerm} 
            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} 
            placeholder="Search roles..." 
          />
          {/* ⭐ Updated navigation to the new create route */}
          {can('roles_create') && (
            <CreateButton 
              onClick={() => navigate("/admin/roles/create")} 
              label="Create Role" 
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-5">Role Name</th>
              <th className="px-6 py-5">Permissions</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentTableData.map((role) => (
              <tr key={role._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4 font-bold text-gray-800 capitalize">{role.name}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                    {role.permissions?.length || 0} permissions
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-2">
                    {/* Permission Matrix Button
                    {can('roles_update') && (
                      <button 
                        onClick={() => navigate(`/admin/roles/${role._id}/permissions`)} 
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                        title="Manage Permissions"
                      >
                        <Settings size={14} /> Permissions
                      </button>
                    )} */}
                    
                    {/* ⭐ Added Edit Button for Role Details */}
                    {can('roles_update') && (
                      <EditButton onClick={() => navigate(`/admin/roles/edit/${role._id}`)} />
                    )}

                    {/* Delete Button */}
                    {can('roles_delete') && <DeleteButton onClick={() => deleteRole(role._id)} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination 
          currentPage={currentPage} 
          totalItems={filteredRoles.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </div>
  );
}