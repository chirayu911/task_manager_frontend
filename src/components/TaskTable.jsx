import React from 'react';
import { User as UserIcon, FileText } from 'lucide-react';
import { EditButton, DeleteButton } from './TableButtons';

// Helper: Formats a JS Date to YYYY-MM-DDTHH:mm for datetime-local inputs
const toLocalISO = (date) => {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};export default function TaskTable({ 
  currentTableData, 
  user, 
  isAdmin, 
  can, 
  staffList, 
  statusList, 
  handleInlineUpdate, 
  openDeleteModal, 
  navigate,
  basePath // ⭐ This prop is key (e.g., "/tasks" or "/issues")
}) {
  return (
    <table className="w-full text-left">
      <thead className="bg-gray-50/50 border-b border-gray-100">
        <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          <th className="px-6 py-4">Title</th>
          <th className="px-6 py-4">Details</th>
          <th className="px-6 py-4">Assigned To</th>
          <th className="px-6 py-4">Status</th>
          <th className="px-6 py-4">Schedule</th>
          <th className="px-6 py-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {currentTableData.length > 0 ? (
          currentTableData.map((item) => (
            <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 font-medium text-gray-800">{item.title}</td>

              {/* ⭐ Dynamic "View" Path */}
              <td className="px-6 py-4">
                <button
                  onClick={() => navigate(`${basePath}/view/${item._id}`)}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-all border border-indigo-100 shadow-sm"
                >
                  <FileText size={14} /> Read Content
                </button>
              </td>

              <td className="px-6 py-4">
                {isAdmin || can('tasks_update') ? (
                  <select
                    value={item.assignedTo?._id || item.assignedTo || ''}
                    onChange={(e) => handleInlineUpdate(item._id, 'assignedTo', e.target.value)}
                    className="border border-gray-200 p-2 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20 w-full"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserIcon size={14} className="text-blue-500" /> {item.assignedTo?.name || "Unassigned"}
                  </div>
                )}
              </td>

              <td className="px-6 py-4">
                <select
                  value={item.status?._id || item.status || ''}
                  onChange={(e) => handleInlineUpdate(item._id, 'status', e.target.value)}
                  disabled={!can('tasks_update')}
                  className="border border-gray-100 p-2 rounded-lg text-sm bg-white outline-none cursor-pointer disabled:bg-gray-50"
                >
                  {statusList.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </td>

              <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                {isAdmin || can('tasks_update') ? (
                  <div className="flex flex-col gap-1.5 w-36">
                    <input 
                      type="datetime-local" 
                      value={toLocalISO(item.startDate)}
                      onChange={(e) => handleInlineUpdate(item._id, 'startDate', e.target.value)}
                      className="border border-gray-200 p-1.5 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500/20 w-full"
                      title="Start Date & Time"
                    />
                    <div className="flex items-center gap-2">
                       <input 
                         type="number" 
                         min="0.5" 
                         step="0.5"
                         placeholder="Hrs"
                         value={item.hours || ''}
                         onChange={(e) => handleInlineUpdate(item._id, 'hours', e.target.value)}
                         className="border border-gray-200 p-1.5 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500/20 w-20"
                         title="Estimated Hours"
                       />
                       <span className="text-[10px] uppercase font-bold text-gray-400">hours</span>
                    </div>
                  </div>
                ) : (
                  item.startDate ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-900 font-bold">
                        {new Date(item.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>{item.hours || 0} hrs est.</span>
                    </div>
                  ) : (
                    <span className="italic text-gray-400 border border-dashed border-gray-200 px-2 py-1 rounded-md">Not planned</span>
                  )
                )}
              </td>

              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1">
                  {/* ⭐ Dynamic "Edit" Path */}
                  {can('tasks_update') && (
                    <EditButton onClick={() => navigate(`${basePath}/edit/${item._id}`)} />
                  )}
                  {can('tasks_delete') && (
                    <DeleteButton onClick={() => openDeleteModal(item._id)} />
                  )}
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
              No records found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}