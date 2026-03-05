import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CreditCard, Loader, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { EditButton, DeleteButton } from '../components/TableButtons';
import { CreateButton, SearchBar } from '../components/PageHeader';
import TableControls from '../components/TableControls';
import ConfirmModal from '../components/ConfirmModal';
import Notification from '../components/Notification'; 

export default function SubscriptionPage({ user }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subToDelete, setSubToDelete] = useState(null);
  const [notification, setNotification] = useState(null); 

  // Catch success messages from the Form Page
  useEffect(() => {
    if (location.state?.feedback) {
      setNotification(location.state.feedback);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const roleName = useMemo(() => typeof user?.role === 'object' ? user.role?.name : user?.role, [user]);
  const perms = useMemo(() => user?.permissions || [], [user]);
  const isAdmin = useMemo(() => roleName === 'admin' || perms.includes('*'), [roleName, perms]);
  const can = useCallback((perm) => isAdmin || perms.includes(perm), [isAdmin, perms]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/subscriptions');
      setSubscriptions(data);
    } catch (err) {
      setNotification({ type: 'error', message: "Failed to load subscription plans." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchSubscriptions();
  }, [user, fetchSubscriptions]);

  const openDeleteModal = (id) => {
    setSubToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/subscriptions/${subToDelete}`);
      setSubscriptions(prev => prev.filter(s => s._id !== subToDelete));
      setIsModalOpen(false);
      setNotification({ type: 'success', message: "Delete Successful! Subscription plan removed." });
    } catch (err) {
      setIsModalOpen(false);
      setNotification({ type: 'error', message: err.response?.data?.message || "Error deleting subscription plan." });
    }
  };

  const filteredSubs = useMemo(() => {
    return subscriptions.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subscriptions, searchTerm]);

  const currentTableData = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredSubs.slice(firstIndex, lastIndex);
  }, [filteredSubs, currentPage, itemsPerPage]);

  if (!user) return null;
  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader className="animate-spin text-primary-600 dark:text-primary-400" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen transition-colors">
      
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="flex justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <CreditCard className="text-primary-600 dark:text-primary-400" /> Subscription Plans
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage pricing tiers and their included features.</p>
        </div>
        {/* Only admins or users with create perm can add new plans */}
        {can('subscriptions_create') && (
          <CreateButton 
            onClick={() => navigate("/admin/subscriptions/create")} 
            label="New Plan" 
          />
        )}
      </div>

      <div className="mb-8 w-full md:max-w-md">
        <SearchBar 
          value={searchTerm} 
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} 
          placeholder="Search plans..." 
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              <th className="px-6 py-5">Plan Details</th>
              <th className="px-6 py-5">Pricing</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {currentTableData.length > 0 ? currentTableData.map((sub) => (
              <tr key={sub._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800 dark:text-gray-200">{sub.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {sub.features?.length || 0} features included
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-gray-900 dark:text-white">${sub.price}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400"> / {sub.cycle || 'month'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                    sub.status === 1 || sub.status === 'Active'
                      ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                      : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                  }`}>
                    {sub.status === 1 || sub.status === 'Active' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                    {sub.status === 1 || sub.status === 'Active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {can('subscriptions_update') && (
                      <EditButton onClick={() => navigate(`/admin/subscriptions/edit/${sub._id}`)} />
                    )}
                    {can('subscriptions_delete') && (
                      <DeleteButton onClick={() => openDeleteModal(sub._id)} />
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center text-gray-400 dark:text-gray-500 italic">
                  No subscription plans found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <TableControls 
          currentPage={currentPage} 
          totalItems={filteredSubs.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
          onLimitChange={(newLimit) => {
            setItemsPerPage(newLimit);
            setCurrentPage(1);
          }}
        />
      </div>

      <ConfirmModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleDelete}
        title="Delete Subscription Plan"
        message="Permanently delete this plan? Existing customers on this plan may be affected."
      />
    </div>
  );
}