import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Loader, Download, Lock, MailCheck, Eye, EyeOff } from 'lucide-react'; // ⭐ Imported Eye and EyeOff
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal';
import Notification from '../components/Notification'; 

export default function DocumentPage({ user, activeProjectId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (location.state?.feedback) {
      setNotification(location.state.feedback);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const roleName = useMemo(() => typeof user?.role === 'object' ? user.role?.name : user?.role, [user]);
  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === 'admin' || perms.includes('*'), [roleName, perms]);
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  const fetchDocuments = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      setLoading(true);
      const { data } = await API.get('/documents', { params: { project: activeProjectId } });
      setDocuments(data);
    } catch (err) {
      setNotification({ type: 'error', message: "Failed to load documents." });
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (user && activeProjectId) fetchDocuments();
  }, [user, activeProjectId, fetchDocuments]);

  // ⭐ Request Access Function with Payload
  const handleRequestAccess = async (docId) => {
    try {
      await API.post(`/documents/${docId}/request-access`, {
        userId: user._id,
        userName: user.name
      });
      setNotification({ type: 'success', message: "Access request sent to the creator!" });
      fetchDocuments(); // Refresh to update button state
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || "Failed to request access." });
    }
  };

  const openDeleteModal = (id) => {
    setDocToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/documents/${docToDelete}`);
      setDocuments(prev => prev.filter(d => d._id !== docToDelete));
      setIsModalOpen(false);
      setNotification({ type: 'success', message: "Delete Successful! Document removed." });
    } catch (err) {
      setIsModalOpen(false);
      setNotification({ type: 'error', message: err.response?.data?.message || "Error deleting document." });
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(d => 
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredDocs.slice(firstIndex, lastIndex);
  }, [filteredDocs, currentPage, itemsPerPage]);

  if (!user || !activeProjectId) return null;

  if (loading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-primary-600 dark:text-primary-400" size={40} /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen transition-colors">
      {notification && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}

      <div className="flex justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <FileText className="text-primary-600 dark:text-primary-400" /> Project Documents
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Upload and manage project-related files and resources.</p>
        </div>
        {can('documents_create') && <CreateButton onClick={() => navigate("/documents/create")} label="Upload Document" />}
      </div>

      <div className="mb-8 w-full md:max-w-md">
        <SearchBar value={searchTerm} onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} placeholder="Search documents..." />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              <th className="px-6 py-5">Document Details</th>
              <th className="px-6 py-5">Access</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {currentTableData.length > 0 ? currentTableData.map((doc) => {
              // ⭐ Verify Access Logic
              const hasAccess = 
                isAdmin || 
                doc.accessType === 'public' || 
                doc.uploadedBy?._id === user._id || 
                doc.allowedUsers?.some(u => u._id === user._id);
                
              const hasRequested = doc.accessRequests?.includes(user._id);

              return (
              <tr key={doc._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800 dark:text-gray-200">{doc.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 max-w-sm">
                    {doc.description || "No description provided."}
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${doc.accessType === 'public' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'}`}>
                      {doc.accessType === 'public' ? 'Public' : <><Lock size={10}/> Restricted</>}
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3 items-center">
                    
                    {/* ⭐ 1. View Details Button (Enabled/Disabled based on access) */}
                    <button 
                      onClick={() => hasAccess && navigate(`/documents/view/${doc._id}`)}
                      disabled={!hasAccess}
                      className={`p-2 transition-colors ${
                        hasAccess 
                          ? 'text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer' 
                          : 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50'
                      }`}
                      title={hasAccess ? "View Details" : "Access Restricted"}
                    >
                      {hasAccess ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>

                    {/* ⭐ 2. Download / Request Access Button */}
                    {hasAccess ? (
                      <a href={`http://localhost:5000/${doc.fileUrl?.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" download className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title="Download Document">
                        <Download size={18} />
                      </a>
                    ) : hasRequested ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase">
                        <MailCheck size={14}/> Request Pending
                      </span>
                    ) : (
                      <button onClick={() => handleRequestAccess(doc._id)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors">
                        <Lock size={12}/> Ask for Access
                      </button>
                    )}

                    {/* ⭐ 3. Edit & Delete Buttons */}
                    {can('documents_update') && hasAccess && <EditButton onClick={() => navigate(`/documents/edit/${doc._id}`)} />}
                    {can('documents_delete') && hasAccess && <DeleteButton onClick={() => openDeleteModal(doc._id)} />}
                  </div>
                </td>
              </tr>
            )}) : (
              <tr>
                <td colSpan="3" className="px-6 py-20 text-center text-gray-400 dark:text-gray-500 italic">
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <TableControls 
          currentPage={currentPage} 
          totalItems={filteredDocs.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
          onLimitChange={(newLimit) => {
            setItemsPerPage(newLimit);
            setCurrentPage(1);
          }}
        />
      </div>

      <ConfirmModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleDelete} title="Delete Document" message="Permanently delete this document? The file will be removed from the server." />
    </div>
  );
}