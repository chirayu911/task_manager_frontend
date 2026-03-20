import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  FolderKanban,  
  Building2, 
  Bell // ⭐ Added Bell Icon
} from 'lucide-react';
import API from '../api';
// import { ThemeContext } from '../context/ThemeContext';

export default function Navbar({ 
  user, 
  activeProjectId, 
  setActiveProjectId, 
  activeCompanyId, 
  setActiveCompanyId 
}) {
  const navigate = useNavigate();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isCompaniesOpen, setIsCompaniesOpen] = useState(false); 
  const [projectList, setProjectList] = useState([]);
  const [companyList, setCompanyList] = useState([]);
  
  const projectsRef = useRef(null);
  const companiesRef = useRef(null); 
  
  // const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const isSystemAdmin = roleName === 'admin' || roleName === 'superadmin';

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

  const fetchCompanies = useCallback(async () => {
    if (!isSystemAdmin) return; 
    try {
      const { data } = await API.get('/company/all');
      setCompanyList(data || []);
      
      if (!activeCompanyId) {
        setActiveCompanyId('all'); 
      }
    } catch (err) {
      console.error("Navbar: Failed to load companies", err);
    }
  }, [isSystemAdmin, activeCompanyId, setActiveCompanyId]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      if (isSystemAdmin) fetchCompanies();
    }
  }, [user, fetchProjects, fetchCompanies, isSystemAdmin]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectsRef.current && !projectsRef.current.contains(event.target)) {
        setIsProjectsOpen(false);
      }
      if (companiesRef.current && !companiesRef.current.contains(event.target)) {
        setIsCompaniesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeProject = projectList.find(p => p._id === activeProjectId);
  const activeCompany = companyList.find(c => c._id === activeCompanyId);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 left-64 w-[calc(100%-16rem)] z-[100] h-16 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-end gap-3">

        <div className="h-8 w-px bg-gray-100 dark:bg-gray-800 mx-1"></div>

        {/* SYSTEM ADMIN ONLY: Company Selector */}
        {isSystemAdmin && (
          <div className="relative" ref={companiesRef}>
            <button 
              onClick={() => setIsCompaniesOpen(!isCompaniesOpen)}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all border border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 ${
                isCompaniesOpen ? 'text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                <Building2 size={18} />
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-sm font-bold block leading-none">
                  {activeCompanyId === 'all' ? 'All Companies' : (activeCompany ? activeCompany.companyName : 'Select Company')}
                </span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-200 ${isCompaniesOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCompaniesOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in duration-150 z-[110] transition-colors">
                <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Organizations</span>
                </div>
                
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  <button
                    className={`w-full text-left block px-4 py-3 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors group border-l-4 ${
                      activeCompanyId === 'all' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400' : 'border-transparent hover:border-purple-600'
                    }`}
                    onClick={() => {
                      setActiveCompanyId('all');
                      setIsCompaniesOpen(false);
                    }}
                  >
                    <p className={`text-sm font-bold truncate transition-colors ${activeCompanyId === 'all' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-800 dark:text-gray-200'}`}>
                      Global (All Companies)
                    </p>
                  </button>

                  {companyList.map((company) => (
                    <button
                      key={company._id}
                      className={`w-full text-left block px-4 py-3 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors group border-l-4 ${
                        activeCompanyId === company._id ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400' : 'border-transparent hover:border-purple-600'
                      }`}
                      onClick={() => {
                        setActiveCompanyId(company._id);
                        setIsCompaniesOpen(false);
                      }}
                    >
                      <p className={`text-sm font-bold truncate transition-colors ${activeCompanyId === company._id ? 'text-purple-700 dark:text-purple-300' : 'text-gray-800 dark:text-gray-200'}`}>
                        {company.companyName}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Project Selector */}
        <div className="relative" ref={projectsRef}>
          <button 
            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
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
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in duration-150 z-[110] transition-colors">
              <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 mb-1 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Projects</span>
                <Link to="/projects" onClick={() => setIsProjectsOpen(false)} className="text-[10px] text-primary-600 font-bold hover:underline">Manage All</Link>
              </div>
              
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {projectList.length > 0 ? (
                  projectList.map((project) => (
                    <button
                      key={project._id}
                      className={`w-full text-left block px-4 py-3 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors group border-l-4 ${
                        activeProjectId === project._id ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400' : 'border-transparent hover:border-primary-600'
                      }`}
                      onClick={() => {
                        setActiveProjectId(project._id);
                        setIsProjectsOpen(false);
                      }}
                    >
                      <p className={`text-sm font-bold truncate transition-colors ${activeProjectId === project._id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'}`}>
                        {project.title}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-xs text-gray-400 italic">No active projects</div>
                )}
              </div>
            </div>
          )}
        </div>
                <button 
          onClick={() => navigate('/activity')}
          className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-400 transition-all active:scale-95 group"
          title="Activity Log"
        >
          <Bell size={20} className="group-hover:rotate-12 transition-transform" />
          {/* Optional: Status Indicator Dot */}
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
        </button>
      </div>
    </nav>
  );
}