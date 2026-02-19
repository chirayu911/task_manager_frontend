import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export const EditButton = ({ onClick, title = "Edit" }) => (
  <button 
    onClick={onClick} 
    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
    title={title}
  >
    <Edit2 size={18} />
  </button>
);

export const DeleteButton = ({ onClick, title = "Delete" }) => (
  <button 
    onClick={onClick} 
    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
    title={title}
  >
    <Trash2 size={18} />
  </button>
);