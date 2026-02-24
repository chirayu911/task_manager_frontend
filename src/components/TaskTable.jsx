import React from 'react';
import { FileText, User as UserIcon } from 'lucide-react';
import { EditButton, DeleteButton } from './TableButtons';

export default function TaskTable({ 
  currentTableData, user, isAdmin, can, 
  staffList, statusList, handleInlineUpdate, 
  openDeleteModal, navigate 
}) {
  return (
    <table className="w-full text-left">
      <thead className="bg-gray-50/50 border-b border-gray-100">
        <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          <th className="px-6 py-4">Title</th>
          <th className="px-6 py-4">Details</th> 
          <th className="px-6 py-4">Assigned To</th>
          <th className="px-6 py-4">Status</th>
          <th className="px-6 py-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {currentTableData.length > 0 ? currentTableData.map(task => (
          <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
            <td className="px-6 py-4 font-medium text-gray-800">{task.title}</td>
            
            <td className="px-6 py-4">
              <button
                onClick={() => navigate(`/tasks/view/${task._id}`)}
                className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-all border border-indigo-100 shadow-sm"
              >
                <FileText size={14} /> Read Content
              </button>
            </td>

            <td className="px-6 py-4">
              {isAdmin || can('tasks_update') ? (
                <select
                  value={task.assignedTo?._id || task.assignedTo || ''}
                  onChange={(e) => handleInlineUpdate(task._id, 'assignedTo', e.target.value)}
                  className="border border-gray-200 p-2 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20 w-full"
                >
                  <option value="">Unassigned</option>
                  {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserIcon size={14} className="text-blue-500" /> {task.assignedTo?.name || "Unassigned"}
                </div>
              )}
              {(task.assignedTo?._id || task.assignedTo) !== user._id && task.mentionedUsers?.some(m => (m?._id || m) === user._id) && (
                <span className="ml-2 inline-block bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  Mentioned
                </span>
              )}
            </td>
            <td className="px-6 py-4">
              <select
                value={task.status?._id || task.status || ''}
                onChange={(e) => handleInlineUpdate(task._id, 'status', e.target.value)}
                disabled={!can('tasks_update')}
                className="border border-gray-200 p-2 rounded-lg text-sm bg-white disabled:bg-gray-100 outline-none cursor-pointer"
              >
                {statusList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-1">
                {can('tasks_update') && <EditButton onClick={() => navigate(`/tasks/edit/${task._id}`)} />}
                {can('tasks_delete') && <DeleteButton onClick={() => openDeleteModal(task._id)} />}
              </div>
            </td>
          </tr>
        )) : (
          <tr>
            <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">
              No tasks found. Try adjusting your filters or search.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}