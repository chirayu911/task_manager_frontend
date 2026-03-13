import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import pako from 'pako';
import API from '../api';

export default function BulkUploadModal({ isOpen, onClose, activeProjectId, type, onRefresh, notify }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isProcessing = useRef(false);

  // ⭐ NEW: Function to generate and download a sample template
  const downloadSample = () => {
    const headers = [
      { Title: 'Sample Task 1', Description: 'This is a description', Priority: 'High', Assignee: 'staff@example.com' },
      { Title: 'Sample Task 2', Description: 'Another description', Priority: 'Medium', Assignee: '' }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    
    // Generate file and trigger download
    XLSX.writeFile(workbook, `${type}_upload_template.xlsx`);
  };

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    setData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary', dense: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

        const itemType = type === 'issue' ? 'Issue' : 'Task';
        const parsed = jsonData
          .filter(row => row.Title || row.title) 
          .map(row => ({
            title:         (row.Title         || row.title         || '').toString().trim(),
            description:   (row.Description  || row.description  || '').toString().trim(),
            priority:      (row.Priority     || row.priority     || 'Medium').toLowerCase().trim(),
            assigneeEmail: (row.Assignee || row['Assignee Email'] || row.assignee || '').toString().trim(),
            project:       activeProjectId,
            type:          type, // ⭐ Fixed: Send lowercase 'type' to match backend identification
          }));

        setData(parsed);
      } catch {
        setError("Failed to parse file. Ensure it's a valid .xlsx or .csv.");
      }
    };
    reader.readAsBinaryString(file);
  }, [activeProjectId, type]);

  if (!isOpen) return null;

  const submitBulkData = async () => {
    if (!data.length || loading || isProcessing.current) return;
    isProcessing.current = true;
    setLoading(true);
    setError(null);

    try {
      const json = JSON.stringify({ items: data, project: activeProjectId, type: type }); // ⭐ Added type to payload
      const compressed = pako.gzip(json);

      const response = await API.post('/tasks/bulk', compressed, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Encoding': 'gzip',
        },
      });

      if (response.data.success) {
        if (notify) notify('success', response.data.message);
        if (onRefresh) onRefresh();
        onClose();
        setData([]); // Clear after success
      }
    } catch (err) {
      const status = err.response?.status;
      const msg =
        status === 413 ? "Payload too large — add express.json({ limit: '50mb' }) on the server." :
        status === 429 ? "Too many requests. Try again in a moment." :
                         "Upload failed. Check your connection or server logs.";
      setError(msg);
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden border dark:border-gray-700">

        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-black flex items-center gap-2 dark:text-white uppercase">
            <FileSpreadsheet className="text-green-600" /> Bulk {type} Upload
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-8">
          {!data.length ? (
            <div className="space-y-4">
              <div
                onClick={() => !loading && document.getElementById('fileInput').click()}
                className="border-4 border-dashed border-gray-100 dark:border-gray-700 rounded-[32px] p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-all"
              >
                <Upload className="mx-auto text-gray-300 mb-4" size={56} />
                <p className="font-bold dark:text-gray-300">Select File (10k Rows Max)</p>
                <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv</p>
                <input id="fileInput" type="file" hidden onChange={handleFileUpload} accept=".csv, .xlsx, .xls" />
              </div>
              
              {/* ⭐ Download Template Button */}
              <button 
                onClick={downloadSample}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 py-2 border-2 border-blue-50 border-dashed rounded-xl transition-colors"
              >
                <Download size={16} />
                Download Sample Template
              </button>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-[24px] text-center border-2 border-green-100 dark:border-green-900/30">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <p className="font-black text-2xl dark:text-white">{data.length} Items Parsed</p>
              <p className="text-sm text-green-600 font-medium">Ready to import to {type} board</p>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold justify-center bg-red-50 p-3 rounded-xl">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t flex gap-4">
          <button
            onClick={() => { setData([]); setError(null); }}
            disabled={loading}
            className="flex-1 font-bold text-gray-500 disabled:opacity-40 hover:text-gray-700 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={submitBulkData}
            disabled={!data.length || loading}
            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
          >
            {loading
              ? <><Loader className="animate-spin" size={18} /> Importing…</>
              : `Start ${type} Import`
            }
          </button>
        </div>

      </div>
    </div>
  );
}