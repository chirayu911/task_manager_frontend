import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Save, ArrowLeft, Loader, Search, X,
  Users, Trash2, Zap, Lock, Plus
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
  const [fileExtension, setFileExtension] = useState('doc');
  
  // ⭐ Core Content States
  const [pages, setPages] = useState(['']); 
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [document, setDocument] = useState(null); // Added to fix ESLint

  const [hasPermission, setHasPermission] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const isViewOnlyState = location.state?.viewOnly || false;
  const [loading, setLoading] = useState(false);
  
  const [isAutoSave, setIsAutoSave] = useState(user?.preferences?.autoSaveEnabled ?? false); 
  const [lastSyncedContent, setLastSyncedContent] = useState('');

  const [showAccessModal, setShowAccessModal] = useState(false);
  const [projectUsers, setProjectUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // --- UTILS FOR DB ---
  // Using a specific delimiter for page breaks to ensure split/join works reliably
  const PAGE_BREAK = '';
  const joinPages = (arr) => arr.join(PAGE_BREAK);
  const splitPages = (str) => {
    if (!str) return [''];
    return str.includes(PAGE_BREAK) ? str.split(PAGE_BREAK) : [str];
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key === 'Enter' && fileExtension === 'doc' && canEdit) {
        e.preventDefault();
        setPages(prev => [...prev, '']);
        setTimeout(() => {
            const main = document.getElementById('document-scroller');
            if(main) main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileExtension, canEdit]);

  // --- INITIALIZATION & FETCHING ---
  const fetchDocumentData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await API.get(`/documents/${id}`);
      
      // ⭐ Syncing States
      setDocument(data);
      setTitle(data.title || 'Untitled');
      const loadedContent = data.content || '';
      
      // If backend provides a 'pages' array, use it, otherwise split the content string
      if (data.pages && data.pages.length > 0) {
        setPages(data.pages.map(p => p.content || ''));
      } else {
        setPages(splitPages(loadedContent));
      }

      setLastSyncedContent(loadedContent);
      if (data.fileType) setFileExtension(data.fileType.toLowerCase());

      const isOwner = data.uploadedBy?._id === user?._id || data.uploadedBy === user?._id;
      const userEntry = data.allowedUsers?.find(u => (u.userId?._id === user?._id || u.userId === user?._id));
      
      setHasPermission(isOwner || (userEntry && userEntry.canEdit === true));
      setIsEditMode(false);
      setSelectedUsers(data.allowedUsers?.map(u => ({ ...u.userId, canEdit: u.canEdit })) || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (notify) notify('error', 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [id, user?._id, notify]);

  useEffect(() => {
    const initProjectData = async () => {
      if (!activeProjectId) return;
      try {
        const uRes = await API.get(`/projects/${activeProjectId}/users`);
        setProjectUsers(uRes.data || []);
      } catch (err) { console.error("Project Users Load Error:", err); }
    };

    initProjectData();
    if (id) {
        fetchDocumentData();
    } else {
        setHasPermission(true);
        setIsEditMode(true);
        setLoading(false);
    }
  }, [activeProjectId, id, fetchDocumentData]);

  useEffect(() => {
    setCanEdit(hasPermission && isEditMode && !isViewOnlyState);
  }, [hasPermission, isEditMode, isViewOnlyState]);

  const handleToggleAutoSave = async () => {
    const newValue = !isAutoSave;
    setIsAutoSave(newValue);
    try {
      await API.put('/auth/preferences', { autoSaveEnabled: newValue });
    } catch (err) { setIsAutoSave(!newValue); }
  };

  const handleSave = useCallback(async (isSilent = false) => {
    if (!canEdit || !title.trim() || !activeProjectId) return;
    const combinedContent = joinPages(pages);
    
    try {
      if (!isSilent) setLoading(true);
      const payload = {
        title, 
        content: combinedContent, 
        project: activeProjectId, 
        type: 'text',
        documentId: currentDocId, 
        fileExtension,
        allowedUsers: selectedUsers.map(u => ({ userId: u._id, canEdit: u.canEdit }))
      };

      // Depending on your API, this handles both create and update
      const { data } = currentDocId
        ? await API.put(`/documents/${currentDocId}`, payload)
        : await API.post('/documents/text-doc', payload);

      if (!currentDocId && data._id) {
        setCurrentDocId(data._id);
        window.history.replaceState(null, '', `/documents/edit/text/${data._id}`);
      }

      setLastSyncedContent(combinedContent);
      if (!isSilent && notify) {
        notify('success', 'Document saved!');
        navigate('/documents');
      }
    } catch (err) { 
      if (!isSilent && notify) notify('error', 'Save failed'); 
    } finally { 
      if (!isSilent) setLoading(false); 
    }
  }, [pages, title, activeProjectId, currentDocId, selectedUsers, canEdit, fileExtension, notify, navigate]);

  // --- AUTO-SAVE EFFECT ---
  useEffect(() => {
    let timer;
    const currentJoined = joinPages(pages);
    if (canEdit && isAutoSave && currentJoined !== lastSyncedContent && !loading) {
      timer = setTimeout(() => handleSave(true), 3000);
    }
    return () => clearTimeout(timer);
  }, [pages, isAutoSave, lastSyncedContent, handleSave, loading, canEdit]);

  const updatePageContent = (index, newVal) => {
    const updated = [...pages];
    updated[index] = newVal;
    setPages(updated);
  };

  const handleSelectUser = (u) => {
    if (!selectedUsers.find(sel => sel._id === u._id)) {
      setSelectedUsers([...selectedUsers, { ...u, canEdit: false }]);
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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
      
      {hasPermission && !isEditMode && !isViewOnlyState && !!currentDocId && (
        <div className="sticky top-0 z-50 px-6 py-2 border-b flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 transition-all border-amber-200">
          <div className="flex items-center gap-3">
            <Lock size={16} className="text-amber-500" />
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">Editor Locked</p>
          </div>
          <button onClick={() => setIsEditMode(true)} className="px-4 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full uppercase">Unlock</button>
        </div>
      )}

      <header className="relative z-30 bg-[#f3f2f1] dark:bg-gray-900 border-b border-gray-300">
        <div className="flex items-center justify-between px-4 py-1">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/documents')} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={16} /></button>
            <div className="flex items-center gap-2 border-x px-3 border-gray-300 dark:border-gray-700">
              {isEditingTitle ? (
                <input 
                  value={title} 
                  onBlur={() => setIsEditingTitle(false)} 
                  onChange={(e) => setTitle(e.target.value)} 
                  autoFocus 
                  className="bg-white px-2 rounded outline-none border border-blue-500 text-xs text-black" 
                />
              ) : (
                <span className="text-xs font-semibold cursor-pointer dark:text-white" onClick={() => canEdit && setIsEditingTitle(true)}>{title}</span>
              )}
              <select value={fileExtension} onChange={(e) => setFileExtension(e.target.value)} disabled={!canEdit} className="text-[10px] font-bold uppercase bg-transparent outline-none dark:text-gray-300">
                <option value="doc">.DOC (A4)</option>
                <option value="txt">.TXT (Plain)</option>
              </select>
               <div className="flex items-center gap-2">
                <Zap size={14} className={isAutoSave ? 'text-blue-600 animate-pulse' : 'text-gray-400'} />
                <button onClick={handleToggleAutoSave} className={`w-10 h-5 rounded-full relative transition-all ${isAutoSave ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoSave ? 'left-6' : 'left-1'}`} />
                </button>
                <button onClick={() => setShowAccessModal(true)} className="flex items-center gap-1 text-[10px] font-bold uppercase dark:text-white hover:text-blue-500 transition-colors"><Users size={14} /> Share</button>
            </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {canEdit && !isAutoSave && (
                <button onClick={() => handleSave()} disabled={loading} className="px-6 py-1.5 bg-blue-600 text-white rounded font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50">
                    {loading ? <Loader className="animate-spin" size={14} /> : <Save size={14} />} Save
                </button>
            )}
            {!canEdit && <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">Viewing Only</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 px-6 py-1 border-t border-gray-200 dark:border-gray-800 flex justify-center min-h-[40px]">
            <div id="toolbar-container" className="ck-reset_all"></div>
        </div>
      </header>

      <main id="document-scroller" className="flex-1 overflow-y-auto flex flex-col items-center bg-[#f0f2f5] dark:bg-gray-950 py-12 gap-10 scroll-smooth custom-scrollbar">
        {fileExtension === 'doc' ? (
          pages.map((pageContent, idx) => (
            <div 
              key={idx} 
              onMouseDown={() => setActivePageIndex(idx)}
              className={`relative bg-white shadow-2xl transition-all duration-300 ${
                activePageIndex === idx 
                  ? 'ring-2 ring-blue-500 z-10 scale-[1.01]' 
                  : 'opacity-90 border border-gray-200'
              }`}
              style={{ width: '210mm', minHeight: '297mm', flexShrink: 0 }}
            >
              <div className="absolute -left-12 top-0 flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white shadow-md border flex items-center justify-center text-[10px] font-bold text-gray-400">
                  {idx + 1}
                </div>
                {pages.length > 1 && canEdit && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = pages.filter((_, i) => i !== idx);
                      setPages(updated);
                      if (activePageIndex >= updated.length) setActivePageIndex(updated.length - 1);
                    }} 
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="w-full h-full ck-page-container overflow-hidden">
                <TextEditor 
                  value={pageContent} 
                  onChange={(val) => updatePageContent(idx, val)} 
                  readOnly={!canEdit} 
                />
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white shadow-lg border border-gray-200 dark:border-gray-800 w-full max-w-5xl min-h-[900px] p-8">
            <TextEditor 
              value={pages[0] || ''} 
              onChange={(val) => setPages([val])} 
              readOnly={!canEdit} 
            />
          </div>
        )}

        {fileExtension === 'doc' && canEdit && (
            <button 
                onClick={() => {
                  setPages(prev => [...prev, '']);
                  setActivePageIndex(pages.length);
                }}
                className="group flex flex-col items-center gap-2 mb-20 transition-all opacity-40 hover:opacity-100"
            >
                <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Plus size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Add Page (Shift+Enter)</span>
            </button>
        )}
      </main>

      {showAccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center dark:text-white">
              <h3 className="text-lg font-bold">Permissions</h3>
              <button onClick={() => setShowAccessModal(false)}><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="relative" ref={dropdownRef}>
                <label className="text-[10px] font-black uppercase text-gray-400">Search Members</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input type="text" placeholder="Search..." className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl outline-none" value={userSearch} onFocus={() => setShowDropdown(true)} onChange={(e) => setUserSearch(e.target.value)} disabled={!hasPermission} />
                </div>
                {showDropdown && hasPermission && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 border shadow-2xl rounded-xl z-[210] max-h-48 overflow-y-auto">
                    {projectUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                      <div key={u._id} onClick={() => handleSelectUser(u)} className="p-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3 dark:text-white">
                        <span className="text-sm font-bold">{u.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border dark:border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr className="text-[10px] font-black uppercase text-gray-400">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4 text-center">Edit Access</th>
                      <th className="px-6 py-4 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-800 dark:text-white">
                    {selectedUsers.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4 font-bold">{u.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button onClick={() => toggleEditPermission(u._id)} className={`w-10 h-5 rounded-full relative transition-all ${u.canEdit ? 'bg-green-500' : 'bg-gray-300'}`}>
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${u.canEdit ? 'left-6' : 'left-1'}`} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setSelectedUsers(selectedUsers.filter(usr => usr._id !== u._id))} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 flex justify-end bg-gray-50 dark:bg-gray-800/50">
              <button onClick={() => setShowAccessModal(false)} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">Done</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ck-page-container .ck-editor__editable_inline {
            height: calc(297mm - 2px) !important;
            min-height: calc(297mm - 2px) !important;
            max-height: calc(297mm - 2px) !important;
            padding: 20mm !important;
            border: none !important;
            overflow-y: hidden;
        }
        .ck.ck-editor__main > .ck-editor__editable:not(.ck-focused) {
            border-color: transparent !important;
        }
        .ck-toolbar {
            border: none !important;
            background: transparent !important;
        }
        .ck-dropdown__panel {
            z-index: 9999 !important;
        }
        #toolbar-container {
            width: 100%;
            max-width: 800px;
        }
      `}</style>
    </div>
  );
}