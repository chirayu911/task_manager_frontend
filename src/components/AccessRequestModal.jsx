import React, { useState } from 'react';
import { UserCheck, X, MessageSquare, Loader2, UserX } from 'lucide-react';

export default function AccessRequestModal({ 
  isOpen, 
  onClose, 
  requestData, 
  onAccept, 
  onDecline // New prop for the decline logic
}) {
  const [loadingAction, setLoadingAction] = useState(null); // 'accept' or 'decline'

  if (!isOpen || !requestData) return null;

  const handleAction = async (type) => {
    setLoadingAction(type);
    try {
      if (type === 'accept') {
        await onAccept(requestData.id);
      } else {
        await onDecline(requestData.id);
      }
      onClose(); // Close modal on success
    } catch (error) {
      console.error(`Error during ${type}:`, error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transform animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <UserCheck size={20} />
            <h3 className="font-bold text-gray-900 dark:text-white">Access Request</h3>
          </div>
          <button 
            onClick={onClose}
            disabled={!!loadingAction}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg border border-blue-200 dark:border-blue-800">
              {requestData.userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Requester</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{requestData.userName || "Unknown User"}</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <MessageSquare size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Purpose</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
              "{requestData.message || "I need access to contribute to this document."}"
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            onClick={() => handleAction('decline')}
            disabled={!!loadingAction}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-50"
          >
            {loadingAction === 'decline' ? <Loader2 className="animate-spin" size={18} /> : <UserX size={18} />}
            Decline
          </button>
          
          <button
            onClick={() => handleAction('accept')}
            disabled={!!loadingAction}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loadingAction === 'accept' ? <Loader2 className="animate-spin" size={18} /> : <UserCheck size={18} />}
            Grant Access
          </button>
        </div>
      </div>
    </div>
  );
}