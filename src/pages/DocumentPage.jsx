import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FileText, Loader, Download, Lock, MailCheck, Eye, EyeOff, Plus, Upload, ShieldAlert } from 'lucide-react';
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal';
import Notification from '../components/Notification';
import AccessRequestModal from '../components/AccessRequestModal';

export default function DocumentPage({ user, activeProjectId }) {
  const { requestId: urlRequestId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [accessModal, setAccessModal] = useState({ isOpen: false, data: null });

  // ⭐ NEW: Usage state for subscription limits
  const [usage, setUsage] = useState(null);

  // 1. Path-based modal loader (Deep Linking)
  useEffect(() => {
    if (urlRequestId) {
      const fetchRequestDetails = async () => {
        try {
          const { data } = await API.get(`/documents/requests/${urlRequestId}`);
          setAccessModal({
            isOpen: true,
            data: { id: urlRequestId, userName: data.userName, message: data.message }
          });
        } catch (err) {
          setNotification({ type: 'error', message: "Access link invalid or expired." });
          navigate('/documents');
        }
      };
      fetchRequestDetails();
    } else {
      setAccessModal({ isOpen: false, data: null });
    }
  }, [urlRequestId, navigate]);

  // ⭐ NEW: Fetch Company Usage for Limits
  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await API.get('/company/usage');
      if (data?.documents) setUsage(data.documents);
    } catch (err) {
      console.error("Failed to fetch usage limits", err);
    }
  }, [user]);

  // Intercept success messages passed from the Form page
  useEffect(() => {
    if (location.state?.feedback) {
      setNotification(location.state.feedback);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(location.pathname, { replace: true, state: {} });
      fetchUsage(); // Refresh usage after creation
    }
  }, [location, navigate, fetchUsage]);

  // 2. Data Fetching
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
    if (user) fetchUsage(); // Fetch usage independently so badge shows even without active project
  }, [user, activeProjectId, fetchDocuments, fetchUsage]);

  // 3. Handlers
  const handleGrantAccess = async (requestId) => {
    try {
      await API.post(`/documents/grant-access/${requestId}`);
      setNotification({ type: 'success', message: "Access granted successfully!" });
      setAccessModal({ isOpen: false, data: null });
      navigate('/documents');
      fetchDocuments();
    } catch (err) {
      setNotification({ type: 'error', message: "Failed to grant access." });
    }
  };

  const handleDeclineAccess = async (requestId) => {
    try {
      await API.delete(`/documents/requests/${requestId}`);
      setNotification({ type: 'success', message: "Request discarded successfully." });
      setAccessModal({ isOpen: false, data: null });
      navigate('/documents');
      fetchDocuments();
    } catch (err) {
      setNotification({ type: 'error', message: "Failed to decline request." });
    }
  };

  const closeAccessModal = () => {
    setAccessModal({ isOpen: false, data: null });
    navigate('/documents');
  };

  const handleRequestAccess = async (docId) => {
    try {
      await API.post(`/documents/${docId}/request-access`, { userId: user._id, userName: user.name });
      setNotification({ type: 'success', message: "Access request sent!" });
      fetchDocuments();
    } catch (err) {
      setNotification({ type: 'error', message: "Failed to request access." });
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/documents/${docToDelete}`);
      setDocuments(prev => prev.filter(d => d._id !== docToDelete));
      setIsModalOpen(false);
      setNotification({ type: 'success', message: "Document removed." });
      fetchUsage(); // Refresh usage after deletion
    } catch (err) {
      setIsModalOpen(false);
      setNotification({ type: 'error', message: "Error deleting." });
    }
  };

  // Handle PDF Preview & Download
  const handlePreviewPDF = async (docId) => {
    try {
      setNotification({ type: 'info', message: "Generating PDF..." });

      const response = await API.get(`/documents/${docId}/pdf`, { responseType: 'blob' });
      const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(fileURL, "_blank");

      setNotification(null);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: "Failed to generate PDF. Make sure it's a .DOC file." });
    }
  };

  // ⭐ NEW: Subscription Limit Handlers
  const isLimitReached = usage && usage.max !== -1 && usage.current >= usage.max;

  const handleCreateTextClick = () => {
    if (isLimitReached) {
      setNotification({
        type: 'error',
        message: `Subscription Limit Reached: You have used ${usage.current} of ${usage.max} documents. Please upgrade your plan.`
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate("/documents/create/text");
  };

  const handleUploadClick = () => {
    if (isLimitReached) {
      setNotification({
        type: 'error',
        message: `Subscription Limit Reached: You have used ${usage.current} of ${usage.max} documents. Please upgrade your plan.`
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate("/documents/create");
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const roleName = useMemo(() => typeof user?.role === 'object' ? user.role?.name : user?.role, [user]);
  const perms = user?.permissions || [];
  const isAdmin = roleName === 'admin' || perms.includes('*');
  const can = (perm) => isAdmin || perms.includes(perm);

  if (!user) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen transition-colors">
      {notification && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <FileText className="text-primary-600" /> Project Documents
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage project files and rich-text resources.</p>

          {/* ⭐ NEW: Usage Indicator Badge */}
          {usage && usage.max !== -1 && (
            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isLimitReached ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'}`}>
              <ShieldAlert size={12} />
              Plan Usage: {usage.current} / {usage.max} Documents
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {can('documents_create') && (
            <CreateButton
              onClick={handleCreateTextClick}
              label="Create document"
              icon={Plus}
              size="lg"
              isDisabled={isLimitReached}
            />
          )}

          {can('documents_create') && (
            <CreateButton
              onClick={handleUploadClick}
              label="Upload document"
              icon={Upload}
              variant="outline"
              borderWidth="2px"
              size="lg"
              isDisabled={isLimitReached}
            />
          )}
        </div>
      </div>

      <div className="mb-6 max-w-md">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search documents..." />
      </div>

      {!activeProjectId && !accessModal.isOpen ? (
        <div className="bg-white dark:bg-gray-800 p-20 text-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-400 dark:text-gray-500 italic">Please select a project to view specific documents.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
          {loading && activeProjectId ? (
            <div className="flex justify-center p-20"><Loader className="animate-spin text-primary-600" size={40} /></div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <tr className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  <th className="px-6 py-5">Document Details</th>
                  <th className="px-6 py-5">Access</th>
                  <th className="px-6 py-5">View Content</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {currentTableData.map((doc) => {
                  const hasAccess = isAdmin || doc.accessType === 'public' || doc.uploadedBy?._id === user._id || doc.allowedUsers?.some(u => (u.userId?._id === user._id || u.userId === user._id));
                  const hasRequested = doc.accessRequests?.some(req => (req.userId === user._id || req._id === user._id));

                  return (
                    <tr key={doc._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800 dark:text-gray-200">{doc.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{doc.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                          {doc.accessType === 'public' ? 'Public' : <><Lock size={10} /> Restricted</>}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            if (doc.type === 'text') {
                              navigate(`/documents/edit/text/${doc._id}`, { state: { viewOnly: true } });
                            } else {
                              navigate(`/documents/view/${doc._id}`);
                            }
                          }}
                          disabled={!hasAccess}
                          className="flex items-center gap-2 text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors"
                        >
                          {hasAccess ? <><Eye size={16} /> Open Content</> : <><EyeOff size={16} /> Restricted</>}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3 items-center">
                          {!hasAccess ? (
                            hasRequested ? (
                              <span className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><MailCheck size={14} /> Pending</span>
                            ) : (
                              <button onClick={() => handleRequestAccess(doc._id)} className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-xs font-bold hover:bg-primary-600 dark:hover:bg-primary-500 transition-all flex items-center gap-1"><Lock size={12} /> Access</button>
                            )
                          ) : (
                            <div className="flex items-center gap-2">

                              {/* Standard File Download */}
                              {doc.type === 'file' && doc.fileUrl && (
                                <a
                                  href={`https://fm8bp5cj-5000.inc1.devtunnels.ms/${doc.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="p-2 bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                                  title="Download Document"
                                >
                                  <Download size={20} />
                                </a>
                              )}

                              {/* PDF Preview/Download Button (Only for .DOC files) */}
                              {doc.type === 'text' && doc.fileType?.toUpperCase() === 'DOC' && (
                                <button
                                  onClick={() => handlePreviewPDF(doc._id)}
                                  title="Preview & Download PDF"
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors"
                                >
                                  <FileText size={14} /> PDF
                                </button>
                              )}

                              {can('documents_update') && (
                                <EditButton onClick={() => {
                                  const path = doc.type === 'text' ? `/documents/edit/text/${doc._id}` : `/documents/edit/${doc._id}`;
                                  navigate(path);
                                }} />
                              )}

                              {can('documents_delete') && (
                                <DeleteButton onClick={() => { setDocToDelete(doc._id); setIsModalOpen(true); }} />
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <TableControls currentPage={currentPage} totalItems={filteredDocs.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onLimitChange={(newLimit) => { setItemsPerPage(newLimit); setCurrentPage(1); }} />
        </div>
      )}

      <AccessRequestModal
        isOpen={accessModal.isOpen}
        onClose={closeAccessModal}
        requestData={accessModal.data}
        onAccept={handleGrantAccess}
        onDecline={handleDeclineAccess}
      />

      <ConfirmModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleDelete} title="Delete Document" message="Permanently delete this document?" />
    </div>
  );
}