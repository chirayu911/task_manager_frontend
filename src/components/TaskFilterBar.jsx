import React from 'react';
import { SearchBar } from './PageHeader';

export default function TaskFilterBar({ 
  searchTerm, 
  setSearchTerm, 
  filterMode, 
  setFilterMode, 
  setCurrentPage,
  staffList // ⭐ Added staffList prop
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 w-full">
      {/* Left Side: Search */}
      <div className="w-full sm:max-w-md">
        <SearchBar
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Search tasks by title..."
        />
      </div>

      {/* Right Side: Filter */}
      <select
        value={filterMode}
        onChange={(e) => {
          setFilterMode(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full sm:w-56 h-[42px] border border-gray-200 rounded-xl px-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer shadow-sm"
      >
        <option value="all_tasks">All Tasks</option>
        <option value="my_tasks">My Tasks</option>
        
        {/* ⭐ Dynamically map the project's team members */}
        {staffList && staffList.length > 0 && (
          <optgroup label="Filter by Assignee">
            <option value="unassigned">Unassigned</option>
            {staffList.map(staff => (
              <option key={staff._id} value={staff._id}>
                {staff.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}