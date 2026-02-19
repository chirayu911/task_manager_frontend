import React from 'react';
import { Plus, Search } from 'lucide-react';

export const CreateButton = ({ onClick, label, icon: Icon = Plus, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-100",
    purple: "bg-purple-600 hover:bg-purple-700 shadow-purple-100"
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${colors[color]} text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg font-bold transition-all active:scale-95`}
    >
      <Icon size={18} /> {label}
    </button>
  );
};

export const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative max-w-sm w-full">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={0} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
    />
  </div>
);