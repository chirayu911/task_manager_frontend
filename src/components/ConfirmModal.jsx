import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-start p-6 pb-0">
          <div className="p-3 bg-red-50 rounded-xl text-red-600">
            <AlertTriangle size={24} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title || "Are you sure?"}</h3>
          <p className="text-gray-500 leading-relaxed">{message || "This action cannot be undone."}</p>
        </div>

        <div className="flex gap-3 p-6 bg-gray-50/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-100 transition-all active:scale-95"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}