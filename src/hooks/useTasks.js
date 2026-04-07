import { useState, useEffect, useCallback } from 'react';
import API from '../api';

/**
 * Custom hook to manage Tasks/Issues data with Server-Side Pagination.
 * @param {Object} user - Current logged-in user
 * @param {Object} socket - Socket.io instance
 * @param {Boolean} isAdmin - Admin status for permissions
 * @param {Function} can - Permission checker function
 * @param {Function} setFeedback - State setter for notifications
 * @param {String} activeProjectId - The currently selected project ID
 * @param {String} itemType - 'Task' or 'Issue' (PascalCase to match DB Enum)
 */
export function useTasks(user, socket, isAdmin, can, setFeedback, activeProjectId, itemType = 'Task') {
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Pagination States
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * 1. Fetch data with Pagination and Type Filtering
   * Wrapped in useCallback to prevent "fetchTasks is not a function" errors in useEffect
   */
  const fetchTasks = useCallback(async (page = 1, limit = 10, filterMode = 'all_tasks') => {
    // Guard: Requirement for project selection
    if (!user || !activeProjectId) return;

    try {
      setPageLoading(true);

      // We pass BOTH the project ID and the itemType (Task/Issue) to the backend
      const [tasksRes, statusesRes, teamRes] = await Promise.all([
        API.get(`/tasks`, {
          params: {
            project: activeProjectId,
            itemType: itemType, // ⭐ Tells backend exactly what to fetch
            page,
            limit,
            filterMode // ⭐ Pass the filter mode to the backend
          }
        }),
        API.get(`/task-statuses?project=${activeProjectId}`),
        API.get(`/projects/${activeProjectId}/team`)
      ]);

      // Map response to state
      setTasks(tasksRes.data.tasks || []);
      setTotalItems(tasksRes.data.totalItems || 0);
      setTotalPages(tasksRes.data.totalPages || 1);

      // Only show active statuses
      setStatusList(statusesRes.data.filter(s => s.status === 'active'));

      // Extract team members
      const teamMembers = teamRes.data.team || teamRes.data;
      setStaffList(teamMembers.filter(u => (u.role?.name || u.role) !== 'customer'));

    } catch (err) {
      console.error(`Error loading ${itemType}s:`, err);
      setFeedback({ type: 'error', message: `Failed to load ${itemType}s` });
    } finally {
      setPageLoading(false);
    }
  }, [user, activeProjectId, itemType, setFeedback]);

  // Initial fetch on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /**
   * 2. Real-Time WebSocket Synchronization
   */
  useEffect(() => {
    if (socket) {
      const handleTaskCreated = (newItem) => {
        const itemProject = newItem.project?._id || newItem.project;
        // Verify project and type before adding to state
        if (itemProject === activeProjectId && newItem.itemType === itemType) {
          setTasks((prev) => [newItem, ...prev]);
          setTotalItems(prev => prev + 1);
        }
      };

      const handleTaskUpdated = (updatedItem) => {
        const itemProject = updatedItem.project?._id || updatedItem.project;
        // If the item changed type or project, remove it from current list
        if (itemProject !== activeProjectId || updatedItem.itemType !== itemType) {
          setTasks((prev) => prev.filter((t) => t._id !== updatedItem._id));
          setTotalItems(prev => prev - 1);
        } else {
          setTasks((prev) =>
            prev.map((t) => (t._id === updatedItem._id ? updatedItem : t))
          );
        }
      };

      const handleTaskDeleted = (deletedId) => {
        setTasks((prev) => prev.filter((t) => t._id !== deletedId));
        setTotalItems(prev => prev - 1);
      };

      socket.on("taskCreated", handleTaskCreated);
      socket.on("taskUpdated", handleTaskUpdated);
      socket.on("taskDeleted", handleTaskDeleted);

      return () => {
        socket.off("taskCreated", handleTaskCreated);
        socket.off("taskUpdated", handleTaskUpdated);
        socket.off("taskDeleted", handleTaskDeleted);
      };
    }
  }, [socket, activeProjectId, itemType]);

  /**
   * 3. Optimistic Inline Updates
   */
  const handleInlineUpdate = async (taskId, field, value) => {
    try {
      // Immediate UI update
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, [field]: value } : t));

      // API call
      await API.put(`/tasks/${taskId}`, { [field]: value });

      setFeedback({ type: 'success', message: "Updated successfully" });
      setTimeout(() => setFeedback({ type: '', message: '' }), 2000);
    } catch (err) {
      setFeedback({ type: 'error', message: "Update failed" });
      fetchTasks(); // Revert on error
    }
  };

  // ⭐ Critical: Return fetchTasks so TaskPage.jsx can call it
  return {
    tasks,
    setTasks,
    staffList,
    statusList,
    pageLoading,
    handleInlineUpdate,
    fetchTasks,      // Fixes the "fetchTasks is not a function" error
    totalItems,
    totalPages
  };
}