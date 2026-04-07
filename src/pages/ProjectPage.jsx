import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FolderKanban, Users, ShieldAlert, MessageSquare } from 'lucide-react';
import { Box, SimpleGrid } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeaderSkeleton, CardSkeleton } from '../components/SkeletonLoaders';
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal';
import Declaration from '../components/Declaration';

export default function ProjectPage({ user }) {
  const [projects, setProjects] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ⭐ NEW: Usage state for subscription limits
  const [usage, setUsage] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const navigate = useNavigate();
  const location = useLocation();

  // Intercept success messages passed from the Form page
  useEffect(() => {
    if (location.state?.feedback) {
      setFeedback(location.state.feedback);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Clear the state so it doesn't reappear on page refresh
      navigate(location.pathname, { replace: true, state: {} });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    }
  }, [location, navigate]);

  const roleName = useMemo(() =>
    typeof user?.role === 'object' ? user.role?.name : user?.role,
    [user]);

  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === 'admin' || perms.includes('*'), [roleName, perms]);
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    try {
      setPageLoading(true);

      // ⭐ Fetch both projects AND usage stats concurrently
      const [projectsRes, usageRes] = await Promise.all([
        API.get('/projects'),
        API.get('/company/usage').catch(() => ({ data: null }))
      ]);

      const data = projectsRes.data;

      let filtered = data;
      if (!isAdmin) {
        filtered = data.filter(p =>
          p.assignedUsers?.some(member => (member?._id || member) === user._id)
        );
      }
      setProjects(filtered);

      // ⭐ Set usage data if available
      if (usageRes?.data?.projects) {
        setUsage(usageRes.data.projects);
      }

    } catch (err) {
      setFeedback({ type: 'error', message: "Failed to load projects network data" });
    } finally {
      setPageLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const openDeleteModal = (id) => {
    setProjectToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/projects/${projectToDelete}`);
      setProjects(prev => prev.filter(p => p._id !== projectToDelete));
      setIsModalOpen(false);

      // Make sure delete message displays properly
      setFeedback({ type: 'success', message: "Delete Successful! Project removed." });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);

      // Refresh usage stats after deletion
      fetchProjects();
    } catch (err) {
      setIsModalOpen(false);
      setFeedback({ type: 'error', message: "Project deletion failed. Check permissions." });
    }
  };

  // ⭐ NEW: Handler for the Create button with limit enforcement
  const isLimitReached = usage && usage.max !== -1 && usage.current >= usage.max;

  const handleCreateClick = () => {
    if (isLimitReached) {
      setFeedback({
        type: 'error',
        message: `Subscription Limit Reached: You have used ${usage.current} of ${usage.max} projects. Please upgrade your plan.`
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate("/projects/create");
  };

  const openProjectChat = async (projectId) => {
    // Navigate to global chat with a special state or param.
    // Or we can just ensure the project conversation exists by hitting api, then go to chat
    try {
      await API.post('/chat/conversations', { projectId });
      navigate('/chat'); // User can then select the project chat from the recent conversations list
    } catch (err) {
      setFeedback({ type: 'error', message: "Failed to open project chat" });
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredProjects.slice(firstIndex, lastIndex);
  }, [filteredProjects, currentPage, itemsPerPage]);

  if (!user) return null;
  if (pageLoading) return (
    <Box p={8} maxW="7xl" mx="auto">
      <PageHeaderSkeleton />
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </SimpleGrid>
    </Box>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto transition-colors">
      <Declaration
        type={feedback.type}
        message={feedback.message}
        onClose={() => setFeedback({ type: '', message: '' })}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <FolderKanban className="text-primary-600 dark:text-primary-400" /> Project Portfolio
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage high-level project containers and team assignments</p>

          {/* ⭐ NEW: Usage Indicator Badge */}
          {usage && usage.max !== -1 && (
            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isLimitReached ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'}`}>
              <ShieldAlert size={12} />
              Plan Usage: {usage.current} / {usage.max} Projects
            </div>
          )}
        </div>

        {can('projects_create') && (
          <div className={isLimitReached ? "opacity-70 cursor-not-allowed" : ""}>
            {/* ⭐ Updated onClick to use our new handler */}
            <CreateButton onClick={handleCreateClick} label="New Project" />
          </div>
        )}
      </div>

      <div className="mb-8 w-full md:max-w-md">
        <SearchBar
          value={searchTerm}
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          placeholder="Search projects..."
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              <th className="px-6 py-4">Project Details</th>
              <th className="px-6 py-4">Assigned Team</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {currentTableData.length > 0 ? currentTableData.map(project => (
              <tr key={project._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800 dark:text-gray-200 text-base">{project.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1 max-w-md">
                    {project.description || "No description provided."}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {project.assignedUsers && project.assignedUsers.length > 0 ? (
                      project.assignedUsers.map(member => (
                        <span
                          key={member._id}
                          className="inline-flex items-center gap-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-[10px] font-bold px-2 py-1 rounded-full border border-primary-100 dark:border-primary-800 uppercase"
                          title={member.email}
                        >
                          <Users size={10} />
                          {member.name.split(' ')[0]}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">No team assigned</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 items-center">
                    <button
                      onClick={() => openProjectChat(project._id)}
                      title="Project Chat"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                    >
                      <MessageSquare size={16} />
                    </button>
                    {can('projects_update') && <EditButton onClick={() => navigate(`/projects/edit/${project._id}`)} />}
                    {can('projects_delete') && <DeleteButton onClick={() => openDeleteModal(project._id)} />}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="3" className="px-6 py-20 text-center text-gray-400 dark:text-gray-500 italic font-medium">
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <TableControls
          currentPage={currentPage}
          totalItems={filteredProjects.length}
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
        title="Delete Project"
        message="Are you sure you want to delete this project? Tasks associated with it may be affected. This action cannot be undone."
      />
    </div>
  );
}