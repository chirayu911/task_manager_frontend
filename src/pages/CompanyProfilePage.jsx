import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Building2, Mail, MapPin, Loader2, Edit3, Trash2, CreditCard, } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Notification from '../components/Notification';

export default function CompanyProfilePage({ setActiveCompanyId }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const navigate = useNavigate();

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/company/all');
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching all companies:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openDeleteModal = (id) => {
    setCompanyToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/company/${companyToDelete}`);
      setCompanies(prev => prev.filter(c => c._id !== companyToDelete));
      setNotification({ type: 'success', message: 'Organization deleted successfully' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete organization' });
    } finally {
      setIsDeleteModalOpen(false);
      setCompanyToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Accessing Database...</p>
      </div>
    );
  }

  return (
    <div className="p-8 transition-colors">
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Registered Companies</h1>
        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">
          System-wide organization overview & subscription management
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <th className="p-5">Company Name</th>
                  <th className="p-5">Subscription</th>
                  <th className="p-5">Contact</th>
                  <th className="p-5">Address</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((comp) => (
                  <tr key={comp._id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                          <Building2 size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-gray-100">{comp.companyName}</span>
                          <span className="text-[10px] text-gray-400 font-medium italic">ID: {comp._id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* ⭐ NEW: Subscription Column */}
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          <CreditCard size={14} className="text-primary-500" />
                          {comp.subscriptionPlan?.name || 'No Plan'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded w-fit border ${
                          comp.subscriptionStatus === 'active' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400' 
                            : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {comp.subscriptionStatus || 'Inactive'}
                        </span>
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex flex-col gap-1 text-gray-600 dark:text-gray-400 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          {comp.companyEmail}
                        </div>
                        <span className="text-xs text-gray-400 ml-5">{comp.industry || 'General'}</span>
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex items-start gap-2 max-w-[200px]">
                        <MapPin size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                        <span className="text-xs text-gray-500 font-medium leading-tight">
                          {comp.fullAddress || 'Address not set'}
                        </span>
                      </div>
                    </td>

                    {/* ⭐ NEW: Action Buttons */}
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openDeleteModal(comp._id)}
                          className="p-2.5 bg-gray-50 dark:bg-gray-700 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Delete Organization"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {companies.length === 0 && (
            <div className="p-24 text-center">
              <Building2 className="text-gray-200 dark:text-gray-700 mx-auto mb-4" size={64} />
              <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No organizations found</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Organization"
        message="Are you sure? This will remove all data associated with this company. This action cannot be undone."
      />
    </div>
  );
}