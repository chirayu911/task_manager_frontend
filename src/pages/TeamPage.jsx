import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { Box, SimpleGrid } from '@chakra-ui/react';
import API from '../api';
import { CardSkeleton, PageHeaderSkeleton } from '../components/SkeletonLoaders';

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
      <Box p={8} maxW="7xl" mx="auto">
        <PageHeaderSkeleton />
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          {[...Array(8)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </SimpleGrid>
      </Box>
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
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black mb-4 shadow-inner border ${member.isCompanyOwner
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : 'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
              {member.name ? member.name.charAt(0).toUpperCase() : '?'}
            </div>

            {/* Member Details */}
            <h3 className="font-bold text-gray-800 dark:text-white">{member.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{member.email}</p>

            {/* Role Badge */}
            {member.isCompanyOwner ? (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                Owner
              </span>
            ) : (
              <span className="bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                {member.role?.name || 'Staff'}
              </span>
            )}
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