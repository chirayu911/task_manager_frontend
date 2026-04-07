import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Zap, ArrowRight,
  Terminal, Layers, Share2, 
  FileText, RefreshCw, Check, X, Mail, Phone, MapPin, User,
  MousePointer2, GitBranch, ChevronDown, ShieldCheck
} from 'lucide-react';
import API from '../api';

// ─── Scroll-reveal hook ────────────────────────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold: 0.12, ...options });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, inView];
}

// ─── Individual Feature Section ───────────────────────────────────────────────
function FeatureSection({ feature, index, formatUrl }) {
  const [ref, inView] = useInView();
  const isEven = index % 2 === 0;

  const accentColors = [
    { from: 'from-blue-500', to: 'to-cyan-400',   glow: 'shadow-blue-500/30',   text: 'text-blue-400',   border: 'border-blue-500/30'   },
    { from: 'from-purple-500', to: 'to-indigo-400', glow: 'shadow-purple-500/30', text: 'text-purple-400', border: 'border-purple-500/30' },
    { from: 'from-emerald-500', to: 'to-teal-400',  glow: 'shadow-emerald-500/30',text: 'text-emerald-400',border: 'border-emerald-500/30' },
    { from: 'from-amber-500', to: 'to-orange-400',  glow: 'shadow-amber-500/30',  text: 'text-amber-400',  border: 'border-amber-500/30'  },
    { from: 'from-rose-500', to: 'to-pink-400',     glow: 'shadow-rose-500/30',   text: 'text-rose-400',   border: 'border-rose-500/30'   },
  ];
  const accent = accentColors[index % accentColors.length];

  return (
    <div
      ref={ref}
      className={`relative flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-20 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      {/* Screenshot */}
      <div className="flex-1 w-full">
        <div className={`relative rounded-[28px] overflow-hidden shadow-2xl ${accent.glow} border ${accent.border} group`}>
          {/* Floating number badge */}
          <div className={`absolute top-4 left-4 z-10 w-10 h-10 rounded-2xl bg-gradient-to-br ${accent.from} ${accent.to} flex items-center justify-center font-black text-sm shadow-lg`}>
            {String(index + 1).padStart(2, '0')}
          </div>
          {feature.screenshot ? (
            <img
              src={formatUrl(feature.screenshot)}
              alt={feature.title}
              className="w-full object-cover aspect-[16/10] group-hover:scale-[1.02] transition-transform duration-700"
            />
          ) : (
            <div className="w-full aspect-[16/10] bg-white/[0.03] flex items-center justify-center">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${accent.from} ${accent.to} flex items-center justify-center opacity-50`}>
                <FileText size={36} />
              </div>
            </div>
          )}
          {/* Gloss overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 pointer-events-none" />
        </div>
      </div>

      {/* Text */}
      <div className="flex-1">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border ${accent.border} ${accent.text} text-[10px] font-black uppercase tracking-[0.2em] mb-6`}>
          Feature {String(index + 1).padStart(2, '0')}
        </div>
        <h3 className="text-3xl lg:text-4xl font-black mb-6 leading-tight">{feature.title || 'Untitled Feature'}</h3>
        <p className="text-gray-400 leading-loose text-lg">{feature.description}</p>

        {/* Decorative dots */}
        <div className="flex items-center gap-2 mt-10">
          {[0,1,2].map(d => (
            <div key={d} className={`h-1.5 rounded-full bg-gradient-to-r ${accent.from} ${accent.to} transition-all duration-500 ${d === 0 ? 'w-8' : 'w-3 opacity-40'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [settings, setSettings] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const featuresRef = useRef(null);

  const formatUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    let baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    baseUrl = baseUrl.replace(/\/api\/?$/, '');
    const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
    return `${baseUrl}/${cleanPath}`;
  };

  useEffect(() => {
    setIsVisible(true);
    const fetchSettings = async () => {
      try {
        const { data } = await API.get('/website-settings');
        setSettings(data);
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    };

    const fetchSubscriptions = async () => {
      try {
        setLoadingSubscriptions(true);
        const { data } = await API.get('/subscriptions');
        // Filter for active plans (status === 1) and sort by price
        const activePlans = data.filter(plan => plan.status === 1).sort((a, b) => a.price - b.price);
        setSubscriptions(activePlans);
      } catch (err) {
        console.error("Failed to load subscriptions", err);
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    fetchSettings();
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = React.useMemo(() => {
    return subscriptions.filter(plan => plan.cycle.toLowerCase() === billingCycle);
  }, [subscriptions, billingCycle]);

  const workflowSteps = [
    { label: "Initialize",  icon: <Terminal size={18} />,  text: "Register your company and invite your engineering team." },
    { label: "Collaborate", icon: <Share2 size={18} />,    text: "Work simultaneously on modular project documentation." },
    { label: "Review",      icon: <Shield size={18} />,    text: "Admins approve changes and manage role-based permissions." },
    { label: "Deploy",      icon: <Layers size={18} />,    text: "Export finalized document modules as enterprise-ready PDFs." }
  ];

  const dynamicFeatures = settings?.features?.filter(f => f.title) || [];

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      
      {/* ─── CSS Animations ──────────────────────────────────────────────────── */}
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .animate-spin { animation: spin 1s linear infinite; }
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ─── Background ──────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 bg-grid-pattern opacity-100 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[140px] pointer-events-none" />

      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            {settings?.logo ? (
              <img src={formatUrl(settings.logo)} alt="Logo" className="h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                <span className="font-black italic text-xl">T</span>
              </div>
            )}
            <span className="text-xl font-black tracking-tighter uppercase">Nova</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {dynamicFeatures.length > 0 && (
              <button
                onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
              >
                Features
              </button>
            )}
            <a href="#pricing" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">FAQ</a>
            <a href="#about" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">About Us</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Sign In</button>
            <button onClick={() => navigate('/register')} className="px-5 py-2.5 bg-blue-600 text-sm font-black rounded-xl hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/20">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <header className={`relative pt-44 pb-32 px-6 z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
            <Zap size={12} className="fill-blue-400" /> New: Modular Document Sync
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tight">
            NovaBoard: <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
              Where big ideas find their flow.
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            A next-generation workspace that syncs your team's energy into one beautiful, real-time environment. Instant updates, fluid Kanban boards, and powerful collaboration tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-gray-200 transition-all group">
              Register Company <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-3"
            >
              <ChevronDown size={20} /> See Features
            </button>
          </div>
        </div>
      </header>

      {/* ─── How It Works ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white/5 border-y border-white/5 z-10 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {workflowSteps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  {step.icon}
                </div>
                <h4 className="font-black text-xs uppercase tracking-widest text-blue-400 mb-2">{step.label}</h4>
                <p className="text-sm text-gray-500 max-w-[200px]">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Dynamic Features Showcase ───────────────────────────────────────── */}
      {dynamicFeatures.length > 0 && (
        <section ref={featuresRef} className="py-32 px-6 z-10 relative">
          <div className="max-w-7xl mx-auto">

            {/* Section header */}
            <div className="text-center mb-24">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                <Zap size={12} className="fill-blue-400" /> Platform Features
              </div>
              <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                Everything your team<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">needs to ship faster.</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Explore the powerful tools built into NovaBoard — each designed to supercharge how your team collaborates and delivers.
              </p>
            </div>

            {/* Tab bar (if more than 3 features) */}
            {dynamicFeatures.length > 3 && (
              <div className="flex items-center justify-center gap-3 mb-20 flex-wrap">
                {dynamicFeatures.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveFeatureTab(i);
                      document.getElementById(`feature-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${
                      activeFeatureTab === i
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {f.title}
                  </button>
                ))}
              </div>
            )}

            {/* Feature sections */}
            <div className="space-y-36">
              {dynamicFeatures.map((feature, i) => (
                <div key={i} id={`feature-${i}`} onClick={() => setActiveFeatureTab(i)}>
                  <FeatureSection feature={feature} index={i} formatUrl={formatUrl} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Media Showcase ──────────────────────────────────────────────────── */}
      {settings && (settings.images?.length > 0 || settings.videos?.length > 0) && (
        <section className="py-24 px-6 relative z-10 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-6">See NovaBoard in Action</h2>
              <p className="text-gray-400">Discover our platform through live previews.</p>
            </div>
            
            {settings.videos && settings.videos.length > 0 && (
              <div className="mb-16 max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/10 bg-black">
                <video src={formatUrl(settings.videos[0])} controls autoPlay muted loop className="w-full object-cover aspect-video" />
              </div>
            )}

            {settings.images && settings.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {settings.images.map((img, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all group aspect-video bg-white/5">
                    <img src={formatUrl(img)} alt={`Showcase ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-32 px-6 relative z-10 bg-[#040815]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Scalable for Every Team</h2>
            <p className="text-gray-400">Choose the plan that fits your engineering lifecycle.</p>
          </div>

          <div className="text-center mb-12">
            <div className="inline-flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'}`}
              >
                Yearly <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch min-h-[400px]">
            {loadingSubscriptions ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <RefreshCw size={40} className="animate-spin text-blue-500 mb-4" />
                <p className="text-gray-500 font-bold">Loading plans...</p>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[32px]">
                <p className="text-gray-400 font-bold">No {billingCycle} plans available at the moment.</p>
                <button onClick={() => navigate('/register')} className="mt-4 text-blue-400 hover:underline font-bold text-sm">Contact us for custom pricing</button>
              </div>
            ) : (
              filteredSubscriptions.map((plan, index) => {
                const isPopular = (filteredSubscriptions.length === 3 && index === 1) || 
                                (filteredSubscriptions.length === 2 && index === 1) ||
                                (filteredSubscriptions.length === 1);
                
                return (
                  <div key={plan._id} className={`p-8 rounded-[32px] flex flex-col h-full transition-all duration-300 border-2 ${
                    isPopular 
                      ? 'bg-gradient-to-b from-blue-600/20 to-indigo-600/10 border-blue-500 transform lg:scale-105 shadow-2xl shadow-blue-600/20 relative' 
                      : 'bg-white/5 border-white/10 hover:border-white/20 shadow-lg'
                  }`}>
                    {isPopular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-[10px] font-black uppercase tracking-widest rounded-full whitespace-nowrap z-10">Most Popular</div>
                    )}
                    
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-2 text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className={`font-black tracking-tight ${isPopular ? 'text-5xl' : 'text-4xl'}`}>${plan.price}</span>
                        <span className="text-gray-500 text-sm font-bold">/{plan.cycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                    </div>

                    <button onClick={() => navigate('/register')} className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all mb-10 ${
                      isPopular 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/40 active:scale-95' 
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 active:scale-95'
                    }`}>
                      Get Started <ArrowRight size={16} />
                    </button>

                    <div className="space-y-6 flex-1">
                      <div>
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <ShieldCheck size={14} className="text-blue-500" /> Plan Features
                        </h4>
                        <ul className="space-y-4">
                          <li className="flex items-center gap-3 text-sm font-bold text-gray-400">
                            <Check size={16} className="text-green-500 flex-shrink-0" />
                            <span>{plan.maxProjects === -1 ? 'Unlimited' : plan.maxProjects} Projects</span>
                          </li>
                          <li className="flex items-center gap-3 text-sm font-bold text-gray-400">
                            <Check size={16} className="text-green-500 flex-shrink-0" />
                            <span>{plan.maxTasks === -1 ? 'Unlimited' : plan.maxTasks} Tasks/Issues</span>
                          </li>
                          <li className="flex items-center gap-3 text-sm font-bold text-gray-400">
                            <Check size={16} className="text-green-500 flex-shrink-0" />
                            <span>{plan.maxStaff === -1 ? 'Unlimited' : plan.maxStaff} Staff Members</span>
                          </li>
                          <li className="flex items-center gap-3 text-sm font-bold text-gray-400">
                            <Check size={16} className="text-green-500 flex-shrink-0" />
                            <span>{plan.maxDocuments === -1 ? 'Unlimited' : plan.maxDocuments} Documents</span>
                          </li>
                          <li className="flex items-center gap-3 text-sm font-bold text-gray-400">
                            {plan.hasBulkUpload ? (
                              <Check size={16} className="text-green-500 flex-shrink-0" />
                            ) : (
                              <X size={16} className="text-red-500 flex-shrink-0" />
                            )}
                            <span>Bulk Data Import</span>
                          </li>

                          {/* Custom Features Array */}
                          {plan.features?.map((feat, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-400">
                              <Check size={16} className="text-green-500 flex-shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-32 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black mb-16 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: "How does modular editing work?", a: "Unlike standard editors that save one giant file, NovaBoard splits your document into individual database records. This allows for faster loading, zero data loss on crashes, and precise PDF pagination." },
              { q: "Is my documentation secure?", a: "Yes. We use Role-Based Access Control (RBAC). Only owners can grant 'Edit' permissions, and all data is encrypted at rest in our MongoDB cluster." },
              { q: "What makes the PDF export 'High-Fidelity'?", a: "We use a headless Chromium instance (Puppeteer) to 'print' your document. This means every table, bold tag, and custom font in the editor appears exactly the same in your PDF." },
              { q: "Can I use NovaBoard for non-engineering projects?", a: "Absolutely. NovaBoard is a robust management tool for any company requiring structured documentation and team collaboration." }
            ].map((item, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all">
                <h4 className="text-lg font-bold mb-3 flex items-center gap-3">
                  <span className="text-blue-500 font-mono">0{i+1}.</span> {item.q}
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed pl-10 group-hover:text-gray-400 transition-colors">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About Us ─────────────────────────────────────────────────────────── */}
      <section id="about" className="py-32 px-6 relative z-10 border-t border-white/5 bg-[#040815]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Left: Contact Info */}
            <div>
              <h2 className="text-4xl font-black mb-8">About NovaBoard</h2>
              <p className="text-gray-400 mb-12 leading-relaxed max-w-xl">
                NovaBoard is an enterprise-grade documentation and task management ecosystem designed for high-performance engineering teams. 
                We bridge the gap between complex technical documentation and agile task tracking, ensuring zero data loss and high-fidelity output.
              </p>

              <div className="grid sm:grid-cols-2 gap-8">
                {/* Admin Contact */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-6">Administrator</h4>
                  {settings?.adminName && (
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <User size={18} className="text-blue-500" />
                      <span>{settings.adminName}</span>
                    </div>
                  )}
                  {settings?.adminEmail && (
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Mail size={18} className="text-blue-500" />
                      <a href={`mailto:${settings.adminEmail}`} className="hover:text-white transition-colors">{settings.adminEmail}</a>
                    </div>
                  )}
                  {settings?.adminMobile && (
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Phone size={18} className="text-blue-500" />
                      <span>{settings.adminMobile}</span>
                    </div>
                  )}
                </div>

                {/* Company Contact */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-6">Company Headquarters</h4>
                  {settings?.companyEmail && (
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Mail size={18} className="text-blue-500" />
                      <a href={`mailto:${settings.companyEmail}`} className="hover:text-white transition-colors">{settings.companyEmail}</a>
                    </div>
                  )}
                  {settings?.companyPhone && (
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Phone size={18} className="text-blue-500" />
                      <span>{settings.companyPhone}</span>
                    </div>
                  )}
                  {settings?.companyAddress && (
                    <div className="flex items-start gap-3 text-sm text-gray-300">
                      <MapPin size={18} className="text-blue-500 mt-0.5" />
                      <span className="leading-relaxed">{settings.companyAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Services/Features Summary */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-10 md:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full group-hover:bg-blue-600/20 transition-all" />
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                <Zap size={24} className="text-amber-500" /> Core Services
              </h3>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                {(settings?.features && settings.features.length > 0) ? (
                  settings.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-gray-400 group-hover:text-gray-300 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {feat.title}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-400"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Modular Documentation</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-400"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Real-time Chat Sync</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-400"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Agile Task Tracking</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-400"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> High-Fidelity PDF Export</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-400"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> RBAC Permissions</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-400"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Project Reporting</div>
                  </>
                )}
              </div>
              
              <div className="mt-12 pt-8 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#040815] bg-gray-800" />
                    ))}
                  </div>
                  <div className="text-xs font-bold text-gray-500">Trusted by 200+ engineering teams</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#010309]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
              <span className="font-bold text-sm">T</span>
            </div>
            <span className="font-black text-sm uppercase tracking-widest text-gray-500">NovaBoard 2026</span>
          </div>
          <p className="text-gray-600 text-sm font-medium">Built for Gujarat Power Engineering &amp; Research Institute.</p>
          <div className="flex gap-6 text-gray-500">
            <MousePointer2 size={18} className="hover:text-white cursor-pointer transition-colors" />
            <GitBranch size={18} className="hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}