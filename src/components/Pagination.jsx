import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-100">
      <span className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-700">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold text-gray-700">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-semibold text-gray-700">{totalItems}</span>
      </span>
      <div className="flex gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 border rounded-lg hover:bg-white disabled:opacity-30 transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 border rounded-lg hover:bg-white disabled:opacity-30 transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}