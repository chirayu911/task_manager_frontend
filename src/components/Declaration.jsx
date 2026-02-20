import React from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export default function Declaration({ type = 'success', message, onClose }) {
  if (!message) return null;

  const configs = {
    success: {
      bg: 'bg-green-50 border-green-100',
      icon: <CheckCircle2 className="text-green-600" size={20} />,
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50 border-red-100',
      icon: <XCircle className="text-red-600" size={20} />,
      text: 'text-red-800'
    },
    info: {
      bg: 'bg-blue-50 border-blue-100',
      icon: <Info className="text-blue-600" size={20} />,
      text: 'text-blue-800'
    }
  };

  const config = configs[type];

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${config.bg} ${config.text} animate-in slide-in-from-top duration-300 mb-6`}>
      {config.icon}
      <span className="text-sm font-bold flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
          <X size={16} />
        </button>
      )}
    </div>
  );
}