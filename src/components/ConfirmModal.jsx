import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Yes, Delete" // ⭐ Added default prop for custom text
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm dark:bg-black/70">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-transparent dark:border-gray-700">
        <div className="flex justify-between items-start p-6 pb-0">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
            <AlertTriangle size={24} />
          </div>
          <button 
            onClick={onClose} 
            data-btn-id="1"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title || "Are you sure?"}</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{message || "This action cannot be undone."}</p>
        </div>

        <div className="flex gap-3 p-6 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            data-btn-id="1"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            data-btn-id="2"
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-100 dark:shadow-none transition-all active:scale-95"
          >
            {confirmText} {/* ⭐ Replaced hardcoded text */}
          </button>
        </div>
      </div>
    </div>
  );
}