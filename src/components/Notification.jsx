import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X} from 'lucide-react';

export default function Notification({ type, message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-close after 4 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800 icon-green-500",
    error: "bg-red-50 border-red-200 text-red-800 icon-red-500",
    info: "bg-blue-50 border-blue-200 text-blue-800 icon-blue-500",
  };

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    info: <AlertCircle className="text-blue-500" size={20} />,
  };

  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 p-4 rounded-2xl border shadow-xl transition-all animate-in fade-in slide-in-from-right-4 duration-300 ${styles[type] || styles.info}`}>
      {icons[type] || icons.info}
      <p className="text-sm font-bold pr-4">{message}</p>
      <button 
        onClick={onClose}
        className="hover:bg-black/5 p-1 rounded-full transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}