import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, FolderKanban, Sun, Moon } from 'lucide-react';
import API from '../api';
import { ThemeContext } from '../context/ThemeContext'; // ⭐ Fixed import to match the context file

export default function Navbar({ user, activeProjectId, setActiveProjectId }) {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [projectList, setProjectList] = useState([]);
  const projectsRef = useRef(null);
  
  // ⭐ Extract theme state and toggle function using standard useContext
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await API.get('/projects');
      setProjectList(data || []);
      
      if (!activeProjectId && data && data.length > 0) {
        setActiveProjectId(data[0]._id);
      }
    } catch (err) {
      console.error("Navbar: Failed to load projects", err);
    }
  }, [activeProjectId, setActiveProjectId]);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user, fetchProjects]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectsRef.current && !projectsRef.current.contains(event.target)) {
        setIsProjectsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeProject = projectList.find(p => p._id === activeProjectId);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 left-64 w-[calc(100%-16rem)] z-[100] h-16 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-end gap-4">
        
        {/* ⭐ Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          data-btn-id="4"
          className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Project Selector */}
        <div className="relative" ref={projectsRef}>
          <button 
            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
            data-btn-id="4"
            className={`flex items-center gap-3 p-2 rounded-xl transition-all border border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 ${
              isProjectsOpen ? 'text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center shadow-sm transition-colors">
              <FolderKanban size={18} />
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-sm font-bold block leading-none">{activeProject ? activeProject.title : 'Select Project'}</span>
              {activeProject && <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Active Project</span>}
            </div>
            <ChevronDown size={16} className={`transition-transform duration-200 ${isProjectsOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProjectsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl dark:shadow-none py-2 animate-in fade-in zoom-in duration-150 z-[110] transition-colors">
              <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 mb-1 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Projects</span>
                <Link 
                  to="/projects" 
                  onClick={() => setIsProjectsOpen(false)} 
                  data-btn-id="7"
                  className="text-[10px] text-primary-600 dark:text-primary-400 font-bold hover:underline"
                >
                  Manage All
                </Link>
              </div>
              
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {projectList.length > 0 ? (
                  projectList.map((project) => (
                    <button
                      key={project._id}
                      data-btn-id="7"
                      className={`w-full text-left block px-4 py-3 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors group border-l-4 ${
                        activeProjectId === project._id ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400' : 'border-transparent hover:border-primary-600 dark:hover:border-primary-400'
                      }`}
                      onClick={() => {
                        setActiveProjectId(project._id);
                        setIsProjectsOpen(false);
                      }}
                    >
                      <p className={`text-sm font-bold truncate transition-colors ${activeProjectId === project._id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200 group-hover:text-primary-700 dark:group-hover:text-primary-400'}`}>
                        {project.title}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {project.description || 'No description available'}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-gray-400 italic">No active projects</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}