import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader, AlertTriangle, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal';
import Declaration from '../components/Declaration';

export default function IssuePage({ user, activeProjectId }) {
  const navigate = useNavigate();

  // State Management
  const [issues, setIssues] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal & Feedback States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Pre-defined Enums based on your backend Issue Model
  const STATUS_OPTIONS = ['Open', 'In Progress', 'Under Review', 'Resolved', 'Closed'];
  const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

  // Role & Permission Helpers
  const roleName = useMemo(() => typeof user?.role === 'object' ? user.role?.name : user?.role, [user]);
  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === 'admin' || perms.includes('*'), [roleName, perms]);
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  // Fetch Issues and Staff
  const fetchIssuesAndStaff = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      setPageLoading(true);
      const [issuesRes, staffRes] = await Promise.all([
        API.get(`/issues?project=${activeProjectId}`),
        API.get('/users') // Used to populate the assignment dropdown
      ]);
      
      setIssues(issuesRes.data);
      setStaffList(staffRes.data.filter(u => (u.role?.name || u.role) !== 'customer'));
    } catch (err) {
      setFeedback({ type: 'error', message: "Failed to load project issues" });
    } finally {
      setPageLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (user && activeProjectId) fetchIssuesAndStaff();
  }, [user, activeProjectId, fetchIssuesAndStaff]);

  // Inline Update Logic (For Status, Severity, and Assignee)
  const handleInlineUpdate = async (issueId, field, value) => {
    try {
      // Optimistic UI Update
      setIssues(prev => prev.map(i => i._id === issueId ? { ...i, [field]: value } : i));
      
      await API.put(`/issues/${issueId}`, { [field]: value });
      setFeedback({ type: 'success', message: "Issue updated successfully" });
      setTimeout(() => setFeedback({ type: '', message: '' }), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Update failed";
      setFeedback({ type: 'error', message: errorMsg });
      fetchIssuesAndStaff(); // Revert changes if API fails
    }
  };

  // Delete Handlers
  const openDeleteModal = (id) => {
    setIssueToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/issues/${issueToDelete}`);
      setIssues(prev => prev.filter(i => i._id !== issueToDelete));
      setFeedback({ type: 'success', message: "Issue deleted successfully" });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: "Delete failed" });
    }
    setIsModalOpen(false);
  };

  // Search & Pagination Logic
  const filteredIssues = useMemo(() => {
    return issues.filter(issue =>
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.description && issue.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [issues, searchTerm]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredIssues.slice(firstIndex, lastIndex);
  }, [filteredIssues, currentPage, itemsPerPage]);

  // Conditional Rendering
  if (!user) return null;

  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Project Selected</h2>
        <p className="text-gray-500">Please select a project from the top navigation bar to manage issues.</p>
      </div>
    );
  }

  if (pageLoading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-red-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Declaration type={feedback.type} message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />

      {/* Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <AlertTriangle className="text-red-500" /> Project Issues
          </h2>
          <p className="text-gray-500 text-sm">Track, assign, and resolve project bugs and blockers.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <SearchBar 
            value={searchTerm} 
            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} 
            placeholder="Search issues..." 
          />
          {/* Change permission string as needed based on your DB */}
          {can('tasks_create') && (
            <CreateButton onClick={() => navigate("/issues/create")} label="Report Issue" />
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Issue Details</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentTableData.length > 0 ? currentTableData.map(issue => (
              <tr key={issue._id} className="hover:bg-gray-50/50 transition-colors">
                
                {/* Title & Description */}
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-800 text-sm">{issue.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 max-w-xs">{issue.description}</p>
                </td>

                {/* Inline Severity Update */}
                <td className="px-6 py-4">
                  <select
                    value={issue.severity || 'Medium'}
                    onChange={(e) => handleInlineUpdate(issue._id, 'severity', e.target.value)}
                    disabled={!can('tasks_update')}
                    className={`border border-gray-200 p-2 rounded-lg text-xs font-bold outline-none cursor-pointer ${
                      issue.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                      issue.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      issue.severity === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-green-50 text-green-700 border-green-200'
                    }`}
                  >
                    {SEVERITY_OPTIONS.map(sev => <option key={sev} value={sev}>{sev}</option>)}
                  </select>
                </td>

                {/* Inline Status Update */}
                <td className="px-6 py-4">
                  <select
                    value={issue.status || 'Open'}
                    onChange={(e) => handleInlineUpdate(issue._id, 'status', e.target.value)}
                    disabled={!can('tasks_update')}
                    className="border border-gray-200 p-2 rounded-lg text-sm bg-white outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>

                {/* Inline Assignee Update */}
                <td className="px-6 py-4">
                  {isAdmin || can('tasks_update') ? (
                    <select
                      value={issue.assignedTo?._id || issue.assignedTo || ''}
                      onChange={(e) => handleInlineUpdate(issue._id, 'assignedTo', e.target.value)}
                      className="border border-gray-200 p-2 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20 w-full"
                    >
                      <option value="">Unassigned</option>
                      {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserIcon size={14} className="text-gray-400" /> {issue.assignedTo?.name || "Unassigned"}
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {/* Assuming reusing Task Form/Permissions for now, or you can build IssueFormPage */}
                    {can('tasks_update') && <EditButton onClick={() => navigate(`/issues/edit/${issue._id}`)} />}
                    {can('tasks_delete') && <DeleteButton onClick={() => openDeleteModal(issue._id)} />}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">
                  No issues found for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <TableControls
          currentPage={currentPage}
          totalItems={filteredIssues.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onLimitChange={(newLimit) => {
            setItemsPerPage(newLimit);
            setCurrentPage(1);
          }}
        />
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Issue"
        message="Are you sure you want to delete this issue? This action cannot be undone."
      />
    </div>
  );
}