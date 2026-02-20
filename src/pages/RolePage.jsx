import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldCheck, Loader, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls'; // ⭐ Integrated TableControls

export default function RolePage({ user }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Logic: Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // ⭐ Integrated dynamic limit

  // Permission Logic
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const perms = user?.permissions || [];
  const isAdmin = roleName === 'admin' || perms.includes('*');

  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/roles');
      setRoles(data);
    } catch (err) {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchRoles();
  }, [user, fetchRoles]);

  const deleteRole = async (id) => {
    if (!window.confirm("Permanently delete this role? This will affect all assigned users.")) return;
    try {
      await API.delete(`/roles/${id}`);
      setRoles(prev => prev.filter(r => r._id !== id));
      toast.success("Role deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting role");
    }
  };

  // Logic: Search Filter
  const filteredRoles = useMemo(() => {
    return roles.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  // Logic: Pagination Slicing
  const currentTableData = useMemo(() => {
    return filteredRoles.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredRoles, currentPage, itemsPerPage]);

  if (!user) return null;
  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <ShieldCheck className="text-indigo-600" /> Role Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">Define system roles and map permissions to them.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <SearchBar 
            value={searchTerm} 
            onChange={(val) => { 
              setSearchTerm(val); 
              setCurrentPage(1); // ⭐ Reset to page 1 on search
            }} 
            placeholder="Search roles..." 
          />
          {can('roles_create') && (
            <CreateButton 
              onClick={() => navigate("/admin/roles/create")} 
              label="New Role"
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-5">Role Name</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Permissions Count</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentTableData.length > 0 ? currentTableData.map((role) => (
              <tr key={role._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800">{role.name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                    role.status === 1 || role.status === 'Active'
                      ? 'bg-green-50 text-green-700 border-green-100' 
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {role.status === 1 || role.status === 'Active' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                    {role.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500 font-medium">
                    {role.permissions?.length || 0} Slugs Assigned
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {can('roles_update') && (
                      <EditButton onClick={() => navigate(`/admin/roles/edit/${role._id}`)} />
                    )}
                    {can('roles_delete') && (
                      <DeleteButton onClick={() => deleteRole(role._id)} />
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center text-gray-400 italic">
                  No roles found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ⭐ Integrated Table Controls */}
        <TableControls 
          currentPage={currentPage} 
          totalItems={filteredRoles.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
          onLimitChange={(newLimit) => {
            setItemsPerPage(newLimit);
            setCurrentPage(1); // ⭐ Reset to page 1 when entry limit changes
          }}
        />
      </div>
    </div>
  );
}