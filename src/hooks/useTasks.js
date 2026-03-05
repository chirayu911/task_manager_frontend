import { useState, useEffect, useCallback } from 'react';
import API from '../api';

/**
 * Custom hook to manage Tasks/Issues data and real-time updates.
 * @param {Object} user - Current logged-in user
 * @param {Object} socket - Socket.io instance
 * @param {Boolean} isAdmin - Admin status for permissions
 * @param {Function} can - Permission checker function
 * @param {Function} setFeedback - State setter for notifications/alerts
 * @param {String} activeProjectId - The currently selected project ID
 * @param {String} itemType - 'Task' or 'Issue' based on the current page
 */
export function useTasks(user, socket, isAdmin, can, setFeedback, activeProjectId, itemType = 'Task') {
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // 1. Fetch project-specific data filtered by Type (Goal 3 Architecture)
  const fetchTasks = useCallback(async () => {
    // Guard: We need a user and a selected project to fetch anything
    if (!user || !activeProjectId) return;

    try {
      setPageLoading(true);
      
      // We pass BOTH the project ID and the itemType to the backend
      const [tasksRes, statusesRes, teamRes] = await Promise.all([
        API.get(`/tasks?project=${activeProjectId}&itemType=${itemType}`),
        API.get(`/task-statuses?project=${activeProjectId}`),
        API.get(`/projects/${activeProjectId}/team`)
      ]);

      // Only show active statuses in the table dropdowns
      setStatusList(statusesRes.data.filter(s => s.status === 'active'));
      
      // The backend now returns ONLY the requested type (Task or Issue)
      setTasks(tasksRes.data);

      // Extract team members for the assignment dropdown
      const teamMembers = teamRes.data.team || teamRes.data;
      setStaffList(teamMembers.filter(u => (u.role?.name || u.role) !== 'customer'));

    } catch (err) {
      console.error(`Error loading ${itemType}s:`, err);
      setFeedback({ type: 'error', message: `Failed to load ${itemType}s` });
    } finally {
      setPageLoading(false);
    }
  }, [user, activeProjectId, itemType, setFeedback]);

  // Initial fetch on mount or when project/type changes
  useEffect(() => { 
    fetchTasks(); 
  }, [fetchTasks]);

  // 2. Real-Time WebSocket Synchronization (Goal 1)
  useEffect(() => {
    if (socket) {
      const handleTaskCreated = (newItem) => {
        // Only add if it belongs to the current project and current type
        const itemProject = newItem.project?._id || newItem.project;
        if (itemProject === activeProjectId && newItem.itemType === itemType) {
          setTasks((prev) => [newItem, ...prev]);
        }
      };

      const handleTaskUpdated = (updatedItem) => {
        // If the item changed type or project, remove it from current list
        // Otherwise, update the content
        const itemProject = updatedItem.project?._id || updatedItem.project;
        if (itemProject !== activeProjectId || updatedItem.itemType !== itemType) {
          setTasks((prev) => prev.filter((t) => t._id !== updatedItem._id));
        } else {
          setTasks((prev) => 
            prev.map((t) => (t._id === updatedItem._id ? updatedItem : t))
          );
        }
      };

      const handleTaskDeleted = (deletedId) => {
        setTasks((prev) => prev.filter((t) => t._id !== deletedId));
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

  // 3. Optimistic Inline Updates (Goal 2)
  const handleInlineUpdate = async (taskId, field, value) => {
    try {
      // Update UI immediately for responsiveness
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, [field]: value } : t));
      
      // Persist change to database
      await API.put(`/tasks/${taskId}`, { [field]: value });
      
      setFeedback({ type: 'success', message: "Updated successfully" });
      setTimeout(() => setFeedback({ type: '', message: '' }), 2000);
    } catch (err) {
      setFeedback({ type: 'error', message: "Update failed" });
      fetchTasks(); // Revert to database state on failure
    }
  };

  return { 
    tasks, 
    setTasks, 
    staffList, 
    statusList, 
    pageLoading, 
    handleInlineUpdate 
  };
}