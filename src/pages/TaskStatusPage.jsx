import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Loader, CheckCircle2, XCircle } from 'lucide-react';
import API from '../api';
import { toast } from 'react-toastify';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import Pagination from '../components/Pagination';

export default function TaskStatusPage({ user }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Search and Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Normalize role and permissions check
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const perms = user?.permissions || [];
  const isAdmin = roleName === 'admin' || perms.includes('*');

  // Permission helper
  const can = (perm) => isAdmin || perms.includes(perm);

  useEffect(() => {
    if (user) {
      fetchStatuses();
    }
  }, [user]);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/task-statuses');
      setStatuses(data);
    } catch (err) {
      toast.error("Failed to load statuses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this status? This may affect tasks currently using it.")) return;

    try {
      await API.delete(`/task-statuses/${id}`);
      setStatuses(statuses.filter(s => s._id !== id));
      toast.success("Status deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete status");
    }
  };

  // Logic: Search Filter
  const filteredStatuses = statuses.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Logic: Pagination
  const currentTableData = filteredStatuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!user) return null;

  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Settings className="text-blue-600" /> Task Statuses
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage the available stages for your team's workflow.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <SearchBar 
            value={searchTerm} 
            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} 
            placeholder="Search statuses..." 
          />
          {can('roles_update') && (
            <CreateButton 
              onClick={() => navigate("/admin/task-status/create")} 
              label="Add Status" 
            />
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-5">Status Name</th>
              <th className="px-6 py-4">System Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentTableData.length > 0 ? (
              currentTableData.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5 font-bold text-gray-800">{s.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      s.status === 'active' 
                        ? 'bg-green-50 text-green-700 border-green-100' 
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {s.status === 'active' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {can('roles_update') && (
                        <>
                          <EditButton onClick={() => navigate(`/admin/task-status/edit/${s._id}`)} />
                          <DeleteButton onClick={() => handleDelete(s._id)} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-20 text-center text-gray-400 italic">
                  No statuses found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination 
          currentPage={currentPage} 
          totalItems={filteredStatuses.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </div>
  );
}