import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TableControls({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  onLimitChange 
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalItems === 0) return null;

  const handlePageClick = (page) => {
    // Prevent page refresh by using state-only navigation
    onPageChange(page); 
  };

  return (
    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
        <span>Show</span>
        <select 
          value={itemsPerPage}
          onChange={(e) => {
            onLimitChange(Number(e.target.value));
          }}
          className="border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {[5, 10, 20, 50].map(num => <option key={num} value={num}>{num}</option>)}
        </select>
        <span>entries</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button" // ⭐ Critical: Prevents form submission refresh
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="flex items-center gap-1">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              type="button" // ⭐ Critical: Prevents form submission refresh
              onClick={() => handlePageClick(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                currentPage === i + 1 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-500 hover:bg-white hover:text-gray-800'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          type="button" // ⭐ Critical: Prevents form submission refresh
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}