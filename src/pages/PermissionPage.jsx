import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldPlus, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls'; // ⭐ Updated import

export default function PermissionPage({ user }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // ⭐ Added dynamic limit state
  const navigate = useNavigate();

  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const perms = user?.permissions || [];
  const isAdmin = roleName === 'admin' || perms.includes('*');

  // ⭐ Permission helper wrapped in useCallback for performance
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  useEffect(() => { 
    if (user) fetchPermissions(); 
  }, [user]);
    
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/permissions');
      setPermissions(data);
    } catch (err) { 
      toast.error("Failed to load permissions"); 
    } finally {
      setLoading(false);
    }
  };

  const deletePermission = async (id) => {
    if (!window.confirm("Permanently delete this permission? This may break existing roles.")) return;
    try {
      await API.delete(`/permissions/${id}`);
      setPermissions(prev => prev.filter(p => p._id !== id));
      toast.success("Permission deleted");
    } catch (err) { 
      toast.error("Error deleting permission"); 
    }
  };

  // ⭐ Filter Logic optimized with useMemo
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [permissions, searchTerm]);

  // ⭐ Pagination Logic optimized with useMemo
  const currentTableData = useMemo(() => {
    return filteredPermissions.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredPermissions, currentPage, itemsPerPage]);

  if (!user) return null;
  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader className="animate-spin text-purple-600" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <ShieldPlus className="text-purple-600" /> Permission Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">Configure individual system access slugs.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <SearchBar 
            value={searchTerm} 
            onChange={(val) => { 
              setSearchTerm(val); 
              setCurrentPage(1); // ⭐ Reset to page 1 on search
            }} 
            placeholder="Search name or slug..." 
          />
          {can('permissions_create') && (
            <CreateButton 
              onClick={() => navigate("/admin/permissions/create")} 
              label="New Permission" 
              color="purple"
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-5">Name</th>
              <th className="px-6 py-5">Value (Slug)</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentTableData.map((perm) => (
              <tr key={perm._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800">{perm.name}</td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border">
                    {perm.value}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {can('permissions_update') && (
                      <EditButton onClick={() => navigate(`/admin/permissions/update/${perm._id}`)} />
                    )}
                    {can('permissions_delete') && (
                      <DeleteButton onClick={() => deletePermission(perm._id)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ⭐ Integrated Table Controls */}
        <TableControls 
          currentPage={currentPage} 
          totalItems={filteredPermissions.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
          onLimitChange={(newLimit) => {
            setItemsPerPage(newLimit);
            setCurrentPage(1); // ⭐ Reset to page 1 when entries per page change
          }}
        />
      </div>
    </div>
  );
}