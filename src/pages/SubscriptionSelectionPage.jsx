import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Loader, ShieldCheck, ArrowRight, Building2, X, RefreshCw } from 'lucide-react';
import API from '../api';

export default function SubscriptionSelectionPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [currentPlanId, setCurrentPlanId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // ⭐ Determine if we are in "Upgrade" mode or "Initial Registration"
  const isUpgradeMode = location.pathname.includes('upgrade') || location.pathname.includes('subscriptions');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Active Plans
        const { data: plansData } = await API.get('/subscriptions/active');
        setPlans(plansData);

        // 2. If in upgrade mode, fetch current company plan to highlight it
        if (isUpgradeMode) {
          const { data: companyData } = await API.get('/company/mine');
          setCurrentPlanId(companyData?.subscriptionPlan?._id);
        }
      } catch (err) {
        console.error("Initialization failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isUpgradeMode]);

  // ⭐ Filter plans based on the toggle slide
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => plan.cycle.toLowerCase() === billingCycle);
  }, [plans, billingCycle]);

  const handleSelectPlan = async (planId) => {
    setSelecting(planId);
    try {
      await API.post('/subscriptions/select', { planId });
      // If upgrading, go to settings, if registering, go to dashboard
      navigate(isUpgradeMode ? '/admin/company-settings' : '/dashboard');
    } catch (err) {
      console.error("Plan selection failed", err);
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader className="animate-spin text-primary-600" size={50} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4 transition-colors">
      <div className="max-w-7xl mx-auto">

        {/* ⭐ Header: Conditional Content */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {isUpgradeMode ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold text-sm mb-6 border border-amber-100 dark:border-amber-800">
              <RefreshCw size={16} /> Subscription Management
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-sm mb-6 border border-primary-100 dark:border-primary-800">
              <Building2 size={16} /> Company Registered Successfully!
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            {isUpgradeMode ? 'Scale your organization' : 'Choose the right plan'}
          </h1>

          {/* ⭐ Slide Toggle for Billing Cycle */}
          <div className="mt-8 inline-flex items-center p-1 bg-gray-200 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
            >
              Yearly <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {filteredPlans.map((plan) => {
            const isCurrent = plan._id === currentPlanId;
            const isPopular = plan.name.toLowerCase().includes('pro');

            return (
              <div
                key={plan._id}
                className={`relative flex flex-col bg-white dark:bg-gray-800 rounded-[32px] p-8 transition-all duration-300 border-2 ${isCurrent
                    ? 'border-primary-500 ring-4 ring-primary-500/10'
                    : isPopular ? 'border-gray-200 dark:border-gray-700 scale-105 shadow-2xl z-10' : 'border-transparent shadow-lg'
                  }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Current Active Plan
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-gray-900 dark:text-white">${plan.price}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">/{plan.cycle === 'yearly' ? 'yr' : 'mo'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan._id)}
                  disabled={selecting === plan._id || isCurrent}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isCurrent
                      ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                      : isPopular
                        ? 'bg-gray-900 hover:bg-gray-700 text-white shadow-lg shadow-gray-500/20 active:scale-95'
                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 active:scale-95'
                    }`}
                >
                  {selecting === plan._id ? <Loader className="animate-spin" size={18} /> : isCurrent ? 'Active Plan' : isUpgradeMode ? 'Switch to this Plan' : 'Select Plan'}
                  {!selecting && !isCurrent && <ArrowRight size={16} />}
                </button>

                <div className="mt-8 space-y-6 flex-1">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-primary-500" /> Plan Features
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                        <Check size={16} className="text-green-500" />
                        <span>{plan.maxProjects === -1 ? 'Unlimited' : plan.maxProjects} Projects</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                        <Check size={16} className="text-green-500" />
                        <span>{plan.maxTasks === -1 ? 'Unlimited' : plan.maxTasks} Tasks/Issues</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                        <Check size={16} className="text-green-500" />
                        <span>{plan.maxstaff === -1 ? 'Unlimited' : plan.maxstaff} Staff Members</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                        <Check size={16} className="text-green-500" />
                        <span>{plan.maxTeamMembersPerProject === -1 ? 'Unlimited' : plan.maxTeamMembersPerProject} Team Members per Project</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                        <Check size={16} className="text-green-500" />
                        <span>{plan.maxDocuments === -1 ? 'Unlimited' : plan.maxDocuments} Documents</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                        {plan.hasBulkUpload ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <X size={16} className="text-red-500" />
                        )}
                        <span>
                          {plan.hasBulkUpload ? "Bulk Upload Available" : "Bulk Upload Not Available"}
                        </span>
                      </li>


                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}