import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Save, ArrowLeft, Loader, Search, X,
  Users, Trash2, Zap, Lock, Plus, ShieldCheck, FileText, ChevronRight
} from 'lucide-react';
import TextEditor from '../components/TextEditor';
import API from '../api';
import { useToken } from '@chakra-ui/react';

export default function CreateDocument({ user, activeProjectId, notify }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // Live brand color tokens — updates automatically when company theme changes
  const [
    brand50, brand100, brand200, brand300,
    brand400, brand500, brand600, brand700, brand800, brand900
  ] = useToken('colors', [
    'brand.50', 'brand.100', 'brand.200', 'brand.300',
    'brand.400', 'brand.500', 'brand.600', 'brand.700', 'brand.800', 'brand.900'
  ]);

  // CSS custom properties injected at root so Tailwind primary-* maps to the live theme
  const brandVars = {
    '--brand-50': brand50,
    '--brand-100': brand100,
    '--brand-200': brand200,
    '--brand-300': brand300,
    '--brand-400': brand400,
    '--brand-500': brand500,
    '--brand-600': brand600,
    '--brand-700': brand700,
    '--brand-800': brand800,
    '--brand-900': brand900,
  };

  const [currentDocId, setCurrentDocId] = useState(id);
  const [title, setTitle] = useState('New Protocol');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [fileExtension, setFileExtension] = useState('doc');

  const [pages, setPages] = useState(['']);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [documentData, setDocumentData] = useState(null);

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

  const [hoveredPageIndex, setHoveredPageIndex] = useState(null);

  const PAGE_BREAK = '';

  // A4 page: 297mm tall, 20mm padding top+bottom = 257mm content area.
  // At 96dpi: 1mm = 3.7795px → 257mm ≈ 971px. This is the hard page overflow limit.
  const A4_CONTENT_HEIGHT_PX = 971;
  // Warn the ring indicator when content is 80%+ of height
  const A4_WARN_HEIGHT_PX = A4_CONTENT_HEIGHT_PX * 0.8; // ~777px

  // Refs to each page's ck-page-container div — used for real height measurement
  const pageContainerRefs = useRef([]);

  const stripHtml = (html) => html ? html.replace(/<[^>]*>/g, '') : '';
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
          if (main) main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileExtension, canEdit]);

  // --- DATA FETCHING ---
  const fetchDocumentData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await API.get(`/documents/${id}`);

      setDocumentData(data);
      setTitle(data.title || 'Untitled Protocol');

      if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
        setPages(data.pages);
      } else if (data.content) {
        setPages(splitPages(data.content));
      } else {
        setPages(['']);
      }

      setLastSyncedContent(data.content || '');
      if (data.fileType) setFileExtension(data.fileType.toLowerCase());

      const currentUserId = user?._id || user?.id;
      const ownerId = data.uploadedBy?._id || data.uploadedBy;
      const isOwner = ownerId === currentUserId;

      const userEntry = data.allowedUsers?.find(u => (u.userId?._id || u.userId) === currentUserId);
      const canUserEdit = isOwner || (userEntry && userEntry.canEdit === true);

      setHasPermission(canUserEdit);
      setIsEditMode(false); // Default to locked for existing docs

      if (data.allowedUsers) {
        setSelectedUsers(data.allowedUsers.map(u => ({
          ...(u.userId || {}),
          _id: u.userId?._id || u.userId,
          canEdit: u.canEdit
        })));
      }
    } catch (err) {
      if (notify) notify('error', 'Authentication Failure: Could not sync document node');
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
      } catch (err) { console.error("Network Topology Error:", err); }
    };

    initProjectData();
    if (id) fetchDocumentData();
    else {
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
        pages: pages,
        content: combinedContent,
        project: activeProjectId,
        type: 'text',
        documentId: currentDocId,
        fileExtension,
        allowedUsers: selectedUsers.map(u => ({ userId: u._id, canEdit: u.canEdit }))
      };

      const { data } = currentDocId
        ? await API.put(`/documents/${currentDocId}`, payload)
        : await API.post('/documents/text-doc', payload);

      if (!currentDocId && data._id) {
        setCurrentDocId(data._id);
        window.history.replaceState(null, '', `/documents/edit/text/${data._id}`);
      }

      setLastSyncedContent(combinedContent);
      if (!isSilent && notify) {
        notify('success', 'Changes Commited to Database');
        navigate('/documents');
      }
    } catch (err) {
      if (!isSilent && notify) notify('error', 'Commit Failed: System Timeout');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [pages, title, activeProjectId, currentDocId, selectedUsers, canEdit, fileExtension, notify, navigate]);

  useEffect(() => {
    let timer;
    const currentJoined = joinPages(pages);
    if (canEdit && isAutoSave && currentJoined !== lastSyncedContent && !loading) {
      timer = setTimeout(() => handleSave(true), 3000);
    }
    return () => clearTimeout(timer);
  }, [pages, isAutoSave, lastSyncedContent, handleSave, loading, canEdit]);

  // Check the rendered page height and overflow to next page if content > A4 limit
  useEffect(() => {
    if (!canEdit || fileExtension !== 'doc') return;

    const containerEl = pageContainerRefs.current[activePageIndex];
    if (!containerEl) return;

    // Query the CKEditor editable div inside this page container
    const editorEl = containerEl.querySelector('.ck-editor__editable');
    if (!editorEl) return;

    const contentHeight = editorEl.scrollHeight;
    if (contentHeight <= A4_CONTENT_HEIGHT_PX) return; // Still within A4 bounds

    // Content overflows — we need to split at the element that caused the overflow
    const pageContent = pages[activePageIndex];
    const allLines = pageContent.split(/(?=<p|<h[1-6]|<li|<br|<div)/i);
    let builtHeight = 0;
    let splitLineIndex = allLines.length - 1;

    // Estimate split point by proportion: ratio of A4 height vs overflow height
    const splitRatio = A4_CONTENT_HEIGHT_PX / contentHeight;
    const splitAt = Math.floor(pageContent.length * splitRatio);

    // Walk backwards to a safe HTML tag boundary
    let splitPoint = splitAt;
    while (splitPoint > 0 && pageContent[splitPoint] !== '>' && pageContent[splitPoint] !== ' ') {
      splitPoint--;
    }

    const currentPageContent = pageContent.slice(0, splitPoint).trimEnd();
    const overflowContent = pageContent.slice(splitPoint).trimStart();

    if (!overflowContent.trim()) return; // Nothing meaningful to overflow

    setPages(prev => {
      const updated = [...prev];
      updated[activePageIndex] = currentPageContent;

      if (activePageIndex + 1 < updated.length) {
        // Prepend overflow to next existing page
        updated[activePageIndex + 1] = overflowContent +
          (updated[activePageIndex + 1] ? '<p></p>' + updated[activePageIndex + 1] : '');
      } else {
        // Create a new page
        updated.push(overflowContent);
      }
      return updated;
    });

    // Scroll and focus the next page
    const nextPage = activePageIndex + 1;
    setActivePageIndex(nextPage);
    setTimeout(() => {
      const scroller = document.getElementById('document-scroller');
      if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
    }, 200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages[activePageIndex], canEdit]);

  // updatePageContent - now just sets state; the useEffect above handles overflow detection
  const updatePageContent = (index, newVal) => {
    setPages(prev => {
      const updated = [...prev];
      updated[index] = newVal;
      return updated;
    });
  };

  const handleSelectUser = (u) => {
    if (!selectedUsers.find(sel => sel._id === u._id)) {
      setSelectedUsers([...selectedUsers, { ...u, canEdit: false }]);
    }
    setUserSearch('');
    setShowDropdown(false);
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-950 transition-colors"
      style={brandVars}
    >

      {/* ⭐ Locked Banner Themed Red */}
      {hasPermission && !isEditMode && !isViewOnlyState && !!currentDocId && (
        <div className="sticky top-0 z-50 px-8 py-3 border-b flex items-center justify-between bg-primary-50 dark:bg-primary-950/40 border-primary-100 dark:border-primary-900/40 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
            <p className="text-[10px] font-black text-primary-900 dark:text-primary-100 uppercase tracking-[0.2em]">
              Security Protocol: Document Buffer Encrypted (Read-Only)
            </p>
          </div>
          <button
            onClick={() => setIsEditMode(true)}
            className="px-8 py-2 bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] shadow-xl shadow-primary-600/20 transition-all active:scale-95"
          >
            Initialize Edit Mode
          </button>
        </div>
      )}

      {/* ⭐ Header Section */}
      <header className="relative z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/documents')} className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-2xl transition-all">
              <ArrowLeft size={20} />
            </button>

            <div className="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-6">
                <div className="flex items-center gap-3">
                  {isEditingTitle ? (
                    <input
                      value={title}
                      onBlur={() => setIsEditingTitle(false)}
                      onChange={(e) => setTitle(e.target.value)}
                      autoFocus
                      className="bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-xl outline-none border-2 border-primary-500 text-sm font-black uppercase text-gray-900 dark:text-white"
                    />
                  ) : (
                    <h1 className="text-lg font-black uppercase tracking-tighter text-gray-900 dark:text-white cursor-pointer hover:text-primary-600 transition-colors" onClick={() => canEdit && setIsEditingTitle(true)}>
                      {title}
                    </h1>
                  )}

                  {/* File type dropdown — .doc enables multi-page, .txt locks to single page */}
                  <div className="relative">
                    <select
                      value={fileExtension}
                      onChange={(e) => {
                        const next = e.target.value;
                        setFileExtension(next);
                        if (next === 'txt') {
                          // Merge all pages into one for txt mode
                          setPages(prev => [prev.join('\n')]);
                          setActivePageIndex(0);
                        }
                      }}
                      disabled={!!currentDocId} // Can't change type of existing docs
                      className={`appearance-none pl-3 pr-7 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border outline-none transition-all cursor-pointer
                        ${ fileExtension === 'doc'
                          ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/40 dark:text-primary-300 dark:border-primary-800'
                          : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                        } ${!!currentDocId ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary-400'}`}
                    >
                      <option value="doc">.doc — Multi-Page</option>
                      <option value="txt">.txt — Single Page</option>
                    </select>
                    {/* Custom chevron */}
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-gray-400">
                        <path d="M0 2l4 4 4-4H0z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em]">
                  {isAutoSave ? 'Protocol: Live-Sync Active' : 'Protocol: Manual Buffer'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
              <button
                onClick={handleToggleAutoSave}
                className={`w-12 h-6 rounded-full relative transition-all ${isAutoSave ? 'bg-primary-600 shadow-inner' : 'bg-gray-200 dark:bg-gray-700'}`}
                title="Toggle Auto-Sync"
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${isAutoSave ? 'left-7' : 'left-1'}`} />
              </button>
              <button
                onClick={() => setShowAccessModal(true)}
                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-900 rounded-xl transition-all"
              >
                <Users size={18} />
              </button>
            </div>

            {/* Right action buttons — always show Cancel, conditional Save */}
            <div className="flex items-center gap-2">

              {/* Cancel — always visible, goes back to documents list */}
              <button
                onClick={() => navigate('/documents')}
                className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 bg-transparent transition-all active:scale-95"
              >
                <X size={14} />
                Cancel
              </button>

              {/* Save button: only when canEdit AND auto-save is OFF */}
              {canEdit && !isAutoSave ? (
                <button
                  onClick={() => handleSave()}
                  disabled={loading}
                  className="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 active:scale-95"
                >
                  {loading ? <Loader className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                  Save
                </button>
              ) : canEdit && isAutoSave ? (
                <div className="flex items-center gap-2 px-5 py-3 bg-primary-50 dark:bg-primary-950/30 rounded-2xl border border-primary-100 dark:border-primary-900/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                  <span className="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em]">Auto-Saving…</span>
                </div>
              ) : (
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border border-gray-100 dark:border-gray-700">
                  View Only
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar Injection Point */}
        <div className="mt-4 flex justify-center border-t border-gray-50 dark:border-gray-800 pt-2 min-h-[44px]">
          <div id="toolbar-container" className="w-full max-w-4xl"></div>
        </div>
      </header>

      {/* ⭐ Document Content Scroller */}
      <main id="document-scroller" className="flex-1 overflow-y-auto flex flex-col items-center bg-[#f8fafc] dark:bg-gray-950 py-16 gap-12 scroll-smooth custom-scrollbar">
        {fileExtension === 'doc' ? (
          pages.map((pageContent, idx) => {
            const isPageActive = activePageIndex === idx || hoveredPageIndex === idx;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredPageIndex(idx)}
                onMouseLeave={() => setHoveredPageIndex(null)}
                onMouseDown={() => setActivePageIndex(idx)}
                className={`relative bg-white dark:bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 ${activePageIndex === idx
                    ? 'ring-4 ring-primary-500/20 z-10 scale-[1.01]'
                    : 'opacity-90 grayscale-[0.3]'
                  }`}
                style={{ width: '210mm', minHeight: '297mm', flexShrink: 0 }}
              >
                {/* Page Meta Indicators */}
                <div className="absolute -left-20 top-0 flex flex-col items-center gap-3">
                  {/* Page number + fill ring using real rendered height */}
                  {(() => {
                    // If this is the active page, try to read actual DOM height from CKEditor
                    let fillPct = 0;
                    const containerEl = pageContainerRefs.current[idx];
                    const editorEl = containerEl?.querySelector('.ck-editor__editable');
                    if (editorEl) {
                      fillPct = Math.min(Math.round((editorEl.scrollHeight / A4_CONTENT_HEIGHT_PX) * 100), 120);
                    } else {
                      // Inactive pages: estimate using stripped HTML char length (avg ~50 chars per line, 40 lines)
                      const estCharsPerPage = 2000;
                      fillPct = Math.min(Math.round((stripHtml(pageContent).length / estCharsPerPage) * 100), 120);
                    }
                    const isNearFull = fillPct >= 80;
                    const isFull = fillPct >= 100;
                    const ringColor = isFull ? '#ef4444' : isNearFull ? '#f97316' : 'var(--chakra-colors-brand-500, #8b63f1)';
                    const circumference = 2 * Math.PI * 16;
                    const dashOffset = circumference - (Math.min(fillPct, 100) / 100) * circumference;
                    const heightMm = editorEl ? Math.round((editorEl.scrollHeight / 3.7795)) : '?';
                    return (
                      <div className="relative w-12 h-12 flex items-center justify-center" title={`Page ${idx + 1} — ${fillPct}% of A4 (${heightMm}mm / 257mm content area)`}>
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                          <circle
                            cx="20" cy="20" r="16" fill="none"
                            stroke={ringColor}
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
                          />
                        </svg>
                        <div className="relative z-10 w-8 h-8 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[10px] font-black"
                          style={{ color: ringColor }}>
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                      </div>
                    );
                  })()}

                  {pages.length > 1 && canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = pages.filter((_, i) => i !== idx);
                        setPages(updated);
                        if (activePageIndex >= updated.length) setActivePageIndex(updated.length - 1);
                      }}
                      className="p-3 bg-white text-gray-300 hover:text-red-500 rounded-2xl shadow-lg transition-all active:scale-90"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div
                  ref={el => pageContainerRefs.current[idx] = el}
                  className="w-full h-full ck-page-container overflow-hidden p-[20mm]"
                >
                  {isPageActive ? (
                    <TextEditor
                      value={pageContent}
                      onChange={(val) => updatePageContent(idx, val)}
                      readOnly={!canEdit}
                    />
                  ) : (
                    <div
                      className="prose prose-sm max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{ __html: pageContent || '<p>&nbsp;</p>' }}
                    />
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white shadow-2xl rounded-[32px] border border-gray-100 w-full max-w-5xl min-h-[900px] p-12">
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
            className="group flex flex-col items-center gap-4 mb-24 transition-all"
          >
            <div className="p-5 bg-white dark:bg-gray-800 rounded-[24px] shadow-2xl border border-gray-50 dark:border-gray-800 group-hover:bg-primary-600 group-hover:text-white transition-all transform group-active:scale-90">
              <Plus size={24} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-primary-600">Initialize Page {pages.length + 1}</span>
          </button>
        )}
      </main>

      {/* ⭐ Permissions Modal Themed Red */}
      {showAccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-gray-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/50">
              <div className="flex items-center gap-4 text-primary-600">
                <ShieldCheck size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">Security Clearances</h3>
              </div>
              <button onClick={() => setShowAccessModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><X size={24} /></button>
            </div>

            <div className="p-10 space-y-8">
              <div className="relative" ref={dropdownRef}>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2 block">Personnel Search</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search engineering staff..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-950 dark:text-white rounded-[20px] outline-none border border-transparent focus:border-primary-500 transition-all font-bold"
                    value={userSearch}
                    onFocus={() => setShowDropdown(true)}
                    onChange={(e) => setUserSearch(e.target.value)}
                    disabled={!hasPermission}
                  />
                </div>
                {showDropdown && hasPermission && (
                  <div className="absolute top-full left-0 w-full mt-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl rounded-[24px] z-[210] max-h-60 overflow-y-auto p-2">
                    {projectUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                      <div key={u._id} onClick={() => handleSelectUser(u)} className="p-4 hover:bg-primary-50 dark:hover:bg-primary-950 rounded-2xl cursor-pointer flex items-center gap-4 transition-all">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-600 rounded-lg flex items-center justify-center font-black text-xs">{u.name.charAt(0)}</div>
                        <span className="text-sm font-black text-gray-800 dark:text-gray-200">{u.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-100 dark:border-gray-800 rounded-[32px] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-950/50">
                    <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      <th className="px-8 py-5">Personnel</th>
                      <th className="px-8 py-5 text-center">Write Access</th>
                      <th className="px-8 py-5 text-right">Revoke</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800 dark:text-white">
                    {selectedUsers.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-primary-950/10 transition-colors">
                        <td className="px-8 py-5 font-black text-sm uppercase tracking-tight">{u.name}</td>
                        <td className="px-8 py-5 text-center">
                          <button
                            onClick={() => {
                              setSelectedUsers(selectedUsers.map(usr => usr._id === u._id ? { ...usr, canEdit: !usr.canEdit } : usr));
                            }}
                            className={`w-12 h-6 mx-auto rounded-full relative transition-all ${u.canEdit ? 'bg-primary-600 shadow-lg shadow-primary-600/20' : 'bg-gray-200 dark:bg-gray-700'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${u.canEdit ? 'left-7' : 'left-1'}`} />
                          </button>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button onClick={() => setSelectedUsers(selectedUsers.filter(usr => usr._id !== u._id))} className="p-2 text-gray-300 hover:text-primary-600 transition-all"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-10 py-8 bg-gray-50 dark:bg-gray-950/50 border-t dark:border-gray-800 flex justify-end">
              <button onClick={() => setShowAccessModal(false)} className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-600/20 transition-all active:scale-95">Complete Audit</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scoped Styles for Red Theme */}
      <style>{`
        .ck-page-container .ck-editor__editable_inline {
            min-height: calc(297mm - 40mm) !important;
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
            outline: none !important;
            box-shadow: none !important;
        }
        .ck-toolbar {
            border: none !important;
            background: transparent !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: var(--brand-300);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--brand-500); }

        /* ====== Dynamic theme overrides: primary-* → brand CSS variables ====== */
        .bg-primary-50  { background-color: var(--brand-50)  !important; }
        .bg-primary-100 { background-color: var(--brand-100) !important; }
        .bg-primary-200 { background-color: var(--brand-200) !important; }
        .bg-primary-500 { background-color: var(--brand-500) !important; }
        .bg-primary-600 { background-color: var(--brand-600) !important; }
        .bg-primary-700 { background-color: var(--brand-700) !important; }

        .text-primary-400 { color: var(--brand-400) !important; }
        .text-primary-500 { color: var(--brand-500) !important; }
        .text-primary-600 { color: var(--brand-600) !important; }
        .text-primary-700 { color: var(--brand-700) !important; }
        .text-primary-900 { color: var(--brand-900) !important; }

        .border-primary-100 { border-color: var(--brand-100) !important; }
        .border-primary-200 { border-color: var(--brand-200) !important; }
        .border-primary-400 { border-color: var(--brand-400) !important; }
        .border-primary-500 { border-color: var(--brand-500) !important; }

        .ring-primary-500\/20 { --tw-ring-color: color-mix(in srgb, var(--brand-500) 20%, transparent) !important; }
        .shadow-primary-600\/20 { --tw-shadow-color: color-mix(in srgb, var(--brand-600) 20%, transparent) !important; }
        .shadow-primary-600\/30 { --tw-shadow-color: color-mix(in srgb, var(--brand-600) 30%, transparent) !important; }

        .hover\:bg-primary-50:hover   { background-color: var(--brand-50)  !important; }
        .hover\:bg-primary-500:hover  { background-color: var(--brand-500) !important; }
        .hover\:text-primary-600:hover { color: var(--brand-600) !important; }
        .hover\:border-primary-400:hover { border-color: var(--brand-400) !important; }
        .focus\:border-primary-500:focus { border-color: var(--brand-500) !important; }

        .dark .dark\:bg-primary-950\/40  { background-color: color-mix(in srgb, var(--brand-900) 40%, transparent) !important; }
        .dark .dark\:text-primary-100    { color: var(--brand-100) !important; }
        .dark .dark\:text-primary-400    { color: var(--brand-400) !important; }
        .dark .dark\:border-primary-900\/40 { border-color: color-mix(in srgb, var(--brand-900) 40%, transparent) !important; }
        .dark .dark\:hover\:bg-primary-900\/20:hover { background-color: color-mix(in srgb, var(--brand-900) 20%, transparent) !important; }
      `}</style>
    </div>
  );
}