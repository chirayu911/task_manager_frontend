import React, { useState, useEffect } from 'react';
import { Users, Loader } from 'lucide-react';
import API from '../api';

export default function TeamPage({ activeProjectId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!activeProjectId) return;
      try {
        setLoading(true);
        const { data } = await API.get(`/projects/${activeProjectId}/team`);
        setMembers(data);
      } catch (err) {
        console.error("Failed to load project team");
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [activeProjectId]);

  // Guard against missing project selection
  if (!activeProjectId) {
    return (
      <div className="p-20 max-w-4xl mx-auto text-center mt-10 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Project Selected</h2>
        <p className="text-gray-500">Please select a project from the top navigation bar to view its team.</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <Users className="text-blue-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Project Team</h2>
      </div>
      
      {/* Team Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {members.map(member => (
          <div 
            key={member._id} 
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow"
          >
            {/* Avatar Circle */}
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl font-black mb-4 border border-blue-100 shadow-inner">
              {member.name ? member.name.charAt(0).toUpperCase() : '?'}
            </div>
            
            {/* Member Details */}
            <h3 className="font-bold text-gray-800">{member.name}</h3>
            <p className="text-xs text-gray-500 mb-4">{member.email}</p>
            
            {/* Role Badge */}
            <span className="bg-gray-50 text-gray-600 border border-gray-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
              {member.role?.name || 'Staff'}
            </span>
          </div>
        ))}
        
        {/* Empty State if no members are assigned */}
        {members.length === 0 && (
          <div className="col-span-full text-center p-12 text-gray-400 italic bg-white rounded-2xl border border-gray-100 shadow-sm">
            No team members have been assigned to this project yet.
          </div>
        )}
      </div>
    </div>
  );
}