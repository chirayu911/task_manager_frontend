import React from 'react';
import { Save, Loader, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FormActionButtons({ 
  loading, 
  isEditMode, 
  submitText, 
  cancelText = "Cancel", 
  onCancel, 
  cancelPath,
  submitIcon
}) {
  const navigate = useNavigate();

  // Logic: Decide how to handle the cancel action
  const handleCancel = () => {
    if (onCancel) onCancel();           // Custom function provided
    else if (cancelPath) navigate(cancelPath); // Specific path provided
    else navigate(-1);                  // Default: go back to previous page
  };

  // Logic: Set dynamic submit text if not explicitly provided
  const finalSubmitText = submitText || (isEditMode ? "Save Changes" : "Create");

  return (
    <div className="pt-8 border-t border-gray-100 mt-8 flex flex-col sm:flex-row gap-4">
      {/* Save / Submit Button */}
      <button 
        type="submit" 
        disabled={loading} 
        className="flex-1 bg-blue-600 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all active:scale-[0.98]"
      >
        {loading ? (
          <Loader className="animate-spin" size={20} />
        ) : (
          submitIcon || <Save size={20} />
        )}
        {finalSubmitText}
      </button>
      
      {/* Cancel / Back Button */}
      <button 
        type="button" 
        onClick={handleCancel}
        disabled={loading}
        className="px-10 py-4 bg-white border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <X size={18} />
        {cancelText}
      </button>
    </div>
  );
}