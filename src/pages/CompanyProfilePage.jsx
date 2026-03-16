import React, { useEffect, useState } from 'react';
import API from '../api';
import { Building2, Mail, MapPin, Loader2 } from 'lucide-react';

export default function CompanyProfilePage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Matches app.use('/api/company', companyRoutes) + router.get('/all', ...)
        const { data } = await API.get('/company/all');
        // Ensure we handle cases where data might not be an array
        setCompanies(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching all companies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Accessing Database...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Registered Companies</h1>
        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">
          System-wide organization overview
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Company Name</th>
                  <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Industry</th>
                  <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Contact Email</th>
                  <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Address</th>
                  <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((comp) => (
                  <tr key={comp._id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-all group">
                    <td className="p-5 font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                          <Building2 size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span>{comp.companyName}</span>
                          <span className="text-[10px] text-gray-400 font-medium lowercase italic">ID: {comp._id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="text-sm text-gray-600 font-bold bg-gray-100 px-3 py-1 rounded-lg">
                        {comp.industry || 'General'}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                        <Mail size={14} className="text-gray-400" />
                        {comp.companyEmail}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-start gap-2 max-w-[250px]">
                        <MapPin size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                        <span className="text-sm text-gray-500 font-medium leading-tight">
                          {/* ⭐ Updated to use the single string fullAddress field */}
                          {comp.fullAddress || `${comp.city || 'N/A'}, ${comp.state || ''}`}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {companies.length === 0 && (
            <div className="p-24 text-center">
              <div className="inline-flex p-5 bg-gray-50 rounded-full mb-4">
                <Building2 className="text-gray-300" size={48} />
              </div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
                No organizations found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}