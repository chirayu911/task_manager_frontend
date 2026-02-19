import React from 'react';

export default function DataTable({ headers, data, renderRow, emptyMessage = "No records found." }) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={`p-4 font-semibold ${header.className || ''}`}>
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length > 0 ? (
            data.map((item, index) => renderRow(item, index))
          ) : (
            <tr>
              <td colSpan={headers.length} className="p-8 text-center text-gray-500 italic">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}