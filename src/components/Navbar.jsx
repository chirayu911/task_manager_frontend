import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, FolderKanban } from 'lucide-react';
import API from '../api';

export default function Navbar({ user, activeProjectId, setActiveProjectId }) {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [projectList, setProjectList] = useState([]);
  const projectsRef = useRef(null);
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await API.get('/projects');
      setProjectList(data || []);
      
      // Auto-select first project if none is active
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
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-64 w-[calc(100%-16rem)] z-[100] h-16 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-end">
        
        <div className="relative" ref={projectsRef}>
          <button 
            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
            className={`flex items-center gap-3 p-2 rounded-xl transition-all border border-transparent hover:bg-gray-50 ${
              isProjectsOpen ? 'text-blue-600 bg-gray-50' : 'text-gray-600'
            }`}
          >
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <FolderKanban size={18} />
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-sm font-bold block leading-none">{activeProject ? activeProject.title : 'Select Project'}</span>
              {activeProject && <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Active Project</span>}
            </div>
            <ChevronDown size={16} className={`transition-transform duration-200 ${isProjectsOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProjectsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in duration-150 z-[110]">
              <div className="px-4 py-3 border-b border-gray-50 mb-1 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Projects</span>
                <Link 
                  to="/projects" 
                  onClick={() => setIsProjectsOpen(false)} 
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  Manage All
                </Link>
              </div>
              
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {projectList.length > 0 ? (
                  projectList.map((project) => (
                    <button
                      key={project._id}
                      className={`w-full text-left block px-4 py-3 hover:bg-blue-50 transition-colors group border-l-4 ${
                        activeProjectId === project._id ? 'border-blue-600 bg-blue-50' : 'border-transparent hover:border-blue-600'
                      }`}
                      onClick={() => {
                        setActiveProjectId(project._id);
                        setIsProjectsOpen(false);
                        navigate('/tasks'); // ⭐ Redirects to tasks when project changes
                      }}
                    >
                      <p className={`text-sm font-bold truncate ${activeProjectId === project._id ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-700'}`}>
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