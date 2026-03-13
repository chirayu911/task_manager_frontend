import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Save, ArrowLeft, Loader, Search, X,
  Edit3, Users, Trash2, Scissors, Zap, ZapOff, Lock, Unlock
} from 'lucide-react';
import TextEditor from '../components/TextEditor';
import API from '../api';

export default function CreateDocument({ user, activeProjectId, notify, refreshUser }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [currentDocId, setCurrentDocId] = useState(id);

  const [title, setTitle] = useState('Untitled');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [content, setContent] = useState('');
  const [pages, setPages] = useState(['']);
  
  const [hasPermission, setHasPermission] = useState(false); 
  const [isEditMode, setIsEditMode] = useState(false); 
  const [canEdit, setCanEdit] = useState(false); 

  const [loading, setLoading] = useState(false);
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  
  // ⭐ Initialize strictly from the global database object
  const [isAutoSave, setIsAutoSave] = useState(user?.preferences?.autoSaveEnabled || false);
  
  const [lastSyncedContent, setLastSyncedContent] = useState('');

  const [showAccessModal, setShowAccessModal] = useState(false);
  const [projectUsers, setProjectUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // ⭐ FIX: We only sync from the database when the component first loads or the user logs in.
  // By tracking user?._id instead of user?.preferences, we stop stale data from flickering the switch.
  useEffect(() => {
    if (user?.preferences?.autoSaveEnabled !== undefined) {
      setIsAutoSave(user.preferences.autoSaveEnabled);
    }
  }, [user?._id]); 

  useEffect(() => {
    const lines = content.split('\n');
    const linesPerPage = 45; 
    const newPages = [];
    for (let i = 0; i < lines.length; i += linesPerPage) {
      newPages.push(lines.slice(i, i + linesPerPage).join('\n'));
    }
    setPages(newPages.length > 0 ? newPages : ['']);
  }, [content]);

  useEffect(() => {
    const init = async () => {
      if (!activeProjectId) return;
      try {
        const [uRes, dRes] = await Promise.all([
          API.get(`/projects/${activeProjectId}/users`),
          id ? API.get(`/documents/${id}`) : Promise.resolve({ data: null })
        ]);
        
        setProjectUsers(uRes.data || []);
        
        if (!id) {
          setHasPermission(true);
          setIsEditMode(true);
          return;
        }

        if (dRes?.data) {
          const doc = dRes.data;
          setTitle(doc.title || 'Untitled');
          setContent(doc.content || '');
          setLastSyncedContent(doc.content || '');
          
          const isOwner = doc.uploadedBy?._id === user?._id || doc.uploadedBy === user?._id;
          const userEntry = doc.allowedUsers?.find(u => (u.userId?._id === user?._id || u.userId === user?._id));
          const userHasRights = isOwner || (userEntry && userEntry.canEdit === true);
          const isViewPath = window.location.pathname.includes('/view/text/');
          
          setHasPermission(userHasRights && !isViewPath);
          setIsEditMode(false); 
          setSelectedUsers(doc.allowedUsers?.map(u => ({ ...u.userId, canEdit: u.canEdit })) || []);
        }
      } catch (err) { 
        console.error(err); 
      }
    };
    init();
  }, [activeProjectId, id, user?._id, location.pathname]); 

  useEffect(() => {
    setCanEdit(hasPermission && isEditMode);
  }, [hasPermission, isEditMode]);

  // ⭐ DATABASE ONLY TOGGLE: Updates the UI instantly, then tells the database
  const handleToggleAutoSave = async () => {
    const newValue = !isAutoSave;
    setIsAutoSave(newValue); // Instant UI update
    
    try {
      // 1. Save directly to the User database
      await API.put('/auth/preferences', { autoSaveEnabled: newValue });
      
      // 2. Trigger global App.js refresh silently in the background
      if (typeof refreshUser === 'function') {
       
      }
    } catch (err) {
      console.error("AutoSave DB Error:", err);
      setIsAutoSave(!newValue); // Only rolls back if the backend actually crashes
    }
  };

  const handleSave = useCallback(async (isSilent = false) => {
    if (!canEdit || !title.trim() || !activeProjectId) return;
    const isContentEmpty = !content || content.trim() === '' || content === '<p>&nbsp;</p>';
    if (isContentEmpty) return;

    try {
      if (!isSilent) setLoading(true);
      const payload = {
        title, content, project: activeProjectId, type: 'text',
        documentId: currentDocId, 
        accessType: 'restricted',
        allowedUsers: selectedUsers.map(u => ({ userId: u._id, canEdit: u.canEdit }))
      };
      
      const { data } = currentDocId 
        ? await API.put(`/documents/${currentDocId}`, payload) 
        : await API.post('/documents/text-doc', payload);
            
      if (!currentDocId && data._id) {
        setCurrentDocId(data._id); 
        window.history.replaceState(null, '', `/documents/edit/text/${data._id}`);
      }

      setLastSyncedContent(content);

      if (!isSilent) {
        if (notify) notify('success', 'Document saved successfully!');
        navigate('/documents');
      }

    } catch (err) {
      console.error(err);
      if (!isSilent && notify) notify('error', 'Failed to save document.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [title, content, activeProjectId, currentDocId, selectedUsers, canEdit, navigate, notify]);

  useEffect(() => {
    let timer;
    if (canEdit && isAutoSave && content !== lastSyncedContent && !loading) {
      timer = setTimeout(() => handleSave(true), 3000);
    }
    return () => clearTimeout(timer);
  }, [content, isAutoSave, lastSyncedContent, handleSave, loading, canEdit]);

  const handleSelectUser = (user) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, { ...user, canEdit: false }]);
    }
    setUserSearch('');
    setShowDropdown(false);
  };

  const toggleEditPermission = (userId) => {
    setSelectedUsers(selectedUsers.map(u => 
      u._id === userId ? { ...u, canEdit: !u.canEdit } : u
    ));
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isPrintPreview ? 'bg-white' : 'bg-gray-100 dark:bg-gray-950'}`}>
      
      {hasPermission && !isEditMode && !!currentDocId && (
        <div className="sticky top-0 z-40 px-6 py-2 border-b flex items-center justify-between transition-all bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500 text-white">
              <Lock size={16} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-tight text-amber-700 dark:text-amber-300">
                Editor Locked
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-gray-400">Enable Editing</span>
            <button 
              onClick={() => setIsEditMode(true)} 
              className="w-12 h-6 rounded-full relative transition-all shadow-inner bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              <div className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm left-1" />
            </button>
          </div>
        </div>
      )}

      <header className="relative z-30 bg-[#f3f2f1] dark:bg-gray-900 border-b border-gray-300 print:hidden">
        <div className="flex items-center justify-between px-4 py-1 text-[11px] text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/documents')} className="p-1 hover:bg-gray-200 dark:bg-gray-800 rounded-full transition-colors"><ArrowLeft size={16} /></button>
            <div className="flex items-center gap-2 border-x px-3 border-gray-300 dark:border-gray-700">
              {isEditingTitle && canEdit ? (
                <input type="text" value={title} onBlur={() => setIsEditingTitle(false)} autoFocus className="bg-white dark:bg-gray-800 px-2 rounded outline-none border border-blue-500" onChange={(e) => setTitle(e.target.value)} />
              ) : (
                <span className={`font-semibold ${canEdit ? 'cursor-text' : 'cursor-default'}`} onClick={() => canEdit && setIsEditingTitle(true)}>{title || 'Untitled'}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {canEdit && (
               <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {isAutoSave ? <Zap size={14} className="text-blue-600 animate-pulse" /> : <ZapOff size={14} className="text-gray-400" />}
                  <span className={`text-[10px] font-black uppercase ${isAutoSave ? 'text-blue-600' : 'text-gray-400'}`}>AutoSave</span>
                </div>
                <button onClick={handleToggleAutoSave} className={`w-10 h-5 rounded-full relative transition-all ${isAutoSave ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoSave ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            )}
            <button onClick={() => setShowAccessModal(true)} className="flex items-center gap-1 hover:text-blue-600 text-gray-700 dark:text-gray-300 font-black uppercase tracking-tighter transition-colors"><Users size={14} /><span className="text-[10px]">Share</span></button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 px-6 py-2 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div id="toolbar-container" className="relative z-10 min-w-[500px]"></div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit ? (
              !isAutoSave && (
                <button onClick={() => handleSave(false)} disabled={loading} className="px-7 py-2 bg-blue-600 text-white rounded-md font-bold text-sm shadow-md hover:bg-blue-700 transition-all">{loading ? <Loader className="animate-spin" size={16} /> : <Save size={16} className="inline mr-2" />} Save</button>
              )
            ) : (
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">Viewing Only</div>
            )}
            <button onClick={() => navigate('/documents')} className="px-4 py-2 text-gray-500 font-bold hover:text-red-500 transition-colors text-sm uppercase tracking-widest">{hasPermission ? 'Cancel' : 'Back'}</button>
          </div>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto flex flex-col items-center custom-scrollbar transition-all duration-500 py-12 gap-12 ${isPrintPreview ? 'bg-white' : 'bg-[#f0f2f5] dark:bg-gray-950'}`}>
        {pages.map((pageContent, index) => (
          <div key={index} className="relative bg-white page-sheet shadow-md border border-gray-200 dark:border-gray-800" style={{ width: '794px', height: '1123px', padding: '12mm', boxSizing: 'border-box', flexShrink: 0, overflow: 'hidden' }}>
            <div className="h-full w-full max-h-full overflow-hidden flex flex-col">
              {index === pages.length - 1 ? (
                <div className="writing-zone w-full overflow-hidden" style={{ maxHeight: 'calc(1123px - 12mm)', display: 'block', position: 'relative' }}>
                  <TextEditor value={content} onChange={setContent} readOnly={!canEdit} />
                </div>
              ) : (
                <div className="prose max-w-none whitespace-pre-wrap text-gray-900 font-serif leading-relaxed h-full overflow-hidden bg-white p-2" style={{ maxHeight: 'calc(1123px - 12mm)', backgroundColor: 'white', color: '#111827' }}>{pageContent}</div>
              )}
            </div>
          </div>
        ))}
      </main>

      {showAccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center"><h3 className="text-lg font-bold">Permissions Table</h3><button onClick={() => setShowAccessModal(false)}><X size={20} /></button></div>
            <div className="p-8 space-y-6">
              <div className="relative" ref={dropdownRef}>
                <label className="text-[10px] font-black uppercase text-gray-400">Search Members</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input type="text" placeholder="Search..." className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none" value={userSearch} onFocus={() => setShowDropdown(true)} onChange={(e) => setUserSearch(e.target.value)} disabled={!hasPermission} />
                </div>
                {showDropdown && hasPermission && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 border shadow-2xl rounded-xl z-[210] max-h-48 overflow-y-auto">
                    {projectUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(user => (
                      <div key={user._id} onClick={() => handleSelectUser(user)} className="p-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3"><div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">{user.name[0]}</div><span className="text-sm font-bold">{user.name}</span></div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border dark:border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/50"><tr className="text-[10px] font-black uppercase text-gray-400"><th className="px-6 py-4">User</th><th className="px-6 py-4 text-center">Edit Access</th><th className="px-6 py-4 text-right">Remove</th></tr></thead>
                  <tbody className="divide-y dark:divide-gray-800">
                    {selectedUsers.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4"><span className="text-sm font-bold">{u.name}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button disabled={!hasPermission} onClick={() => toggleEditPermission(u._id)} className={`w-10 h-5 rounded-full relative transition-all ${u.canEdit ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${u.canEdit ? 'left-6' : 'left-1'}`} /></button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button disabled={!hasPermission} onClick={() => setSelectedUsers(selectedUsers.filter(usr => usr._id !== u._id))} className="text-gray-300 hover:text-red-500 disabled:opacity-30"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 flex justify-end bg-gray-50 dark:bg-gray-800/50"><button onClick={() => setShowAccessModal(false)} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold">Done</button></div>
          </div>
        </div>
      )}
    </div>
  );
}