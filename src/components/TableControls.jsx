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
    onPageChange(page); 
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const showMax = 3; // Window size around current page

    // Always show Page 1
    pageNumbers.push(renderButton(1));

    // Calculate start and end of the middle window
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis after Page 1 if there's a gap
    if (start > 2) {
      pageNumbers.push(<span key="dots-start" className="px-1 text-gray-400">...</span>);
    }

    // Render the window (Previous, Current, Next)
    for (let i = start; i <= end; i++) {
      pageNumbers.push(renderButton(i));
    }

    // Add ellipsis before Last Page if there's a gap
    if (end < totalPages - 1) {
      pageNumbers.push(<span key="dots-end" className="px-1 text-gray-400">...</span>);
    }

    // Always show Last Page (if it's not Page 1)
    if (totalPages > 1) {
      pageNumbers.push(renderButton(totalPages));
    }

    return pageNumbers;
  };

  const renderButton = (num) => (
    <button
      key={num}
      type="button"
      onClick={() => handlePageClick(num)}
      className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
        currentPage === num 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {num}
    </button>
  );

  return (
    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
        <span>Show</span>
        <select 
          value={itemsPerPage}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {[5, 10, 20, 50].map(num => <option key={num} value={num}>{num}</option>)}
        </select>
        <span>entries</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="flex items-center gap-1">
          {renderPageNumbers()}
        </div>

        <button
          type="button"
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