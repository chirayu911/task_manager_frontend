import { useState, useEffect, useCallback } from 'react';
import API from '../api';

export function useTasks(user, socket, isAdmin, can, setFeedback, activeProjectId) {
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // 1. Fetch Data from the Optimized Backend
  const fetchTasks = useCallback(async () => {
    // ⭐ Guard clause: Don't fetch if no project is selected
    if (!user || !activeProjectId) return; 

    try {
      setPageLoading(true);
      
      // ⭐ Fetch Tasks, Statuses, AND the specific Project Team simultaneously
      const [tasksRes, statusesRes, teamRes] = await Promise.all([
        API.get(`/tasks?project=${activeProjectId}`),
        API.get(`/task-statuses?project=${activeProjectId}`),
        API.get(`/projects/${activeProjectId}/team`) // Only fetch users assigned to this project
      ]);

      setStatusList(statusesRes.data.filter(s => s.status === 'active'));
      setTasks(tasksRes.data);

      // Only set the staff list if they have permissions to assign tasks
      if (isAdmin || can('tasks_update')) {
        setStaffList(teamRes.data || []);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: "Failed to load project tasks" });
    } finally {
      setPageLoading(false);
    }
  }, [user, activeProjectId, isAdmin, can, setFeedback]);

  // Initial fetch on mount or when active project changes
  useEffect(() => { 
    fetchTasks(); 
  }, [fetchTasks]);

  // 2. Real-Time WebSocket Synchronization
  useEffect(() => {
    if (socket) {
      const handleTaskCreated = (newTask) => {
        // ⭐ Check if the real-time task belongs to the currently viewed project
        const taskProjectId = typeof newTask.project === 'object' ? newTask.project._id : newTask.project;
        if (taskProjectId === activeProjectId) {
          setTasks((prevTasks) => [newTask, ...prevTasks]);
        }
      };

      const handleTaskUpdated = (updatedTask) => {
        const taskProjectId = typeof updatedTask.project === 'object' ? updatedTask.project._id : updatedTask.project;
        if (taskProjectId === activeProjectId) {
          setTasks((prevTasks) => 
            prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t))
          );
        }
      };

      const handleTaskDeleted = (deletedId) => {
        setTasks((prevTasks) => prevTasks.filter((t) => t._id !== deletedId));
      };

      // Attach listeners
      socket.on("taskCreated", handleTaskCreated);
      socket.on("taskUpdated", handleTaskUpdated);
      socket.on("taskDeleted", handleTaskDeleted);

      // Cleanup listeners on unmount
      return () => {
        socket.off("taskCreated", handleTaskCreated);
        socket.off("taskUpdated", handleTaskUpdated);
        socket.off("taskDeleted", handleTaskDeleted);
      };
    }
  }, [socket, activeProjectId]); // ⭐ added activeProjectId as a dependency

  // 3. Inline Update Logic
  const handleInlineUpdate = async (taskId, field, value) => {
    try {
      // Optimistic UI Update: Change it on the screen immediately before the DB finishes
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, [field]: value } : t));
      
      // Send the update to the backend
      await API.put(`/tasks/${taskId}`, { [field]: value });
      
      setFeedback({ type: 'success', message: "Updated successfully" });
      setTimeout(() => setFeedback({ type: '', message: '' }), 2000);
    } catch (err) {
      setFeedback({ type: 'error', message: "Update failed" });
      fetchTasks(); // Only refetch from the DB to revert the optimistic update if it failed
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