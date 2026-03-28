import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Zap, Users, ArrowRight, Github, Linkedin, CheckCircle,
  Terminal, Layers, Cpu, Code, FileText, Share2, 
  Lock, MousePointer2, GitBranch, Database
} from 'lucide-react';
import API from '../api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [settings, setSettings] = useState(null);

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
    fetchSettings();
  }, []);

  const coreFeatures = [
    {
      title: "Modular Document Engine",
      desc: "Our unique page-wise editing system allows for lightning-fast loading of massive documents. Save page by page without data loss.",
      icon: <FileText size={24} />,
      color: "from-blue-500 to-cyan-400",
      shadow: "shadow-blue-500/20"
    },
    {
      title: "Multi-User Permissions",
      desc: "Assign granular 'View Only' or 'Edit' access to specific team members. Secure your project modules with ease.",
      icon: <Lock size={24} />,
      color: "from-purple-500 to-indigo-400",
      shadow: "shadow-indigo-500/20"
    },
    {
      title: "High-Fidelity PDF Exports",
      desc: "Generate professional reports using our Puppeteer-backed engine. Tables, fonts, and styles appear exactly as they do in the editor.",
      icon: <Zap size={24} />,
      color: "from-amber-500 to-orange-400",
      shadow: "shadow-orange-500/20"
    }
  ];

  const workflowSteps = [
    { label: "Initialize", icon: <Terminal size={18} />, text: "Register your company and invite your engineering team." },
    { label: "Collaborate", icon: <Share2 size={18} />, text: "Work simultaneously on modular project documentation." },
    { label: "Review", icon: <Shield size={18} />, text: "Admins approve changes and manage role-based permissions." },
    { label: "Deploy", icon: <Layers size={18} />, text: "Export finalized document modules as enterprise-ready PDFs." }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      
      {/* --- CSS Animations --- */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

      {/* --- Background Effects --- */}
      <div className="absolute inset-0 bg-grid-pattern z-0"></div>
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>

      {/* --- Navbar --- */}
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
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Sign In</button>
            <button onClick={() => navigate('/register')} className="px-5 py-2.5 bg-blue-600 text-sm font-black rounded-xl hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/20">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <header className={`relative pt-44 pb-32 px-6 z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
            <Zap size={12} className="fill-blue-400" /> New: Modular Document Sync
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tight">
            "NovaBoard:  <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
              Where big ideas find their flow."
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
           "Nova is a next-generation workspace that syncs your team's energy into one beautiful, real-time environment. With instant updates, fluid drag-and-drop boards, and powerful collaboration tools, it's the brightest way to align your goals."
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-gray-200 transition-all group">
              Register Company <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-3">
              <Terminal size={20} /> Preview Docs
            </button>
          </div>
        </div>
      </header>

      {/* --- The Workflow (How it Works) --- */}
      <section className="py-24 bg-white/5 border-y border-white/5">
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

      {/* --- Technical Features --- */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, i) => (
              <div key={i} className="p-8 rounded-[32px] bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 hover:border-blue-500/50 transition-all group cursor-default">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 shadow-2xl ${feature.shadow} group-hover:scale-110 transition-transform duration-500`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Dynamic Media Showcase --- */}
      {settings && (settings.images?.length > 0 || settings.videos?.length > 0) && (
        <section className="py-24 px-6 relative z-10">
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

    {/* --- Pricing Section --- */}
      <section id="pricing" className="py-32 px-6 relative z-10 bg-[#040815]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Scalable for Every Team</h2>
            <p className="text-gray-400">Choose the plan that fits your engineering lifecycle.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-end">
            {/* Basic Plan */}
            <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all flex flex-col h-full">
              <h3 className="text-xl font-bold mb-2">Individual</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black">$0</span>
                <span className="text-gray-500 text-sm">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle size={16} className="text-blue-500" /> 5 Modular Documents</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle size={16} className="text-blue-500" /> Standard PDF Exports</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle size={16} className="text-blue-500" /> Basic Task Tracking</li>
              </ul>
              <button onClick={() => navigate('/register')} className="w-full py-4 rounded-2xl bg-white/10 font-bold hover:bg-white/20 transition-all">Get Started</button>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="p-10 rounded-[40px] bg-gradient-to-b from-blue-600/20 to-indigo-600/10 border-2 border-blue-500 relative transform lg:scale-110 shadow-2xl shadow-blue-600/20 flex flex-col h-full">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-[10px] font-black uppercase tracking-widest rounded-full">Most Popular</div>
              <h3 className="text-2xl font-black mb-2">Enterprise Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black">$29</span>
                <span className="text-blue-300 text-sm">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-200"><CheckCircle size={18} className="text-cyan-400" /> Unlimited Documents</li>
                <li className="flex items-center gap-3 text-sm text-gray-200"><CheckCircle size={18} className="text-cyan-400" /> Puppeteer High-Fidelity PDFs</li>
                <li className="flex items-center gap-3 text-sm text-gray-200"><CheckCircle size={18} className="text-cyan-400" /> Advanced RBAC Permissions</li>
                <li className="flex items-center gap-3 text-sm text-gray-200"><CheckCircle size={18} className="text-cyan-400" /> Priority DevOps Support</li>
              </ul>
              <button onClick={() => navigate('/register')} className="w-full py-5 rounded-2xl bg-blue-600 font-black text-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/40">Join Pro Now</button>
            </div>

            {/* Custom Plan */}
            <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all flex flex-col h-full">
              <h3 className="text-xl font-bold mb-2">Custom</h3>
              <div className="text-4xl font-black mb-6">Quote</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle size={16} className="text-blue-500" /> White-label Branding</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle size={16} className="text-blue-500" /> On-premise Deployment</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle size={16} className="text-blue-500" /> Dedicated Account Manager</li>
              </ul>
              <button className="w-full py-4 rounded-2xl bg-white/10 font-bold hover:bg-white/20 transition-all">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ Section --- */}
      <section id="faq" className="py-32 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black mb-16 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: "How does modular editing work?", a: "Unlike standard editors that save one giant file, TaskFlow splits your document into individual database records. This allows for faster loading, zero data loss on crashes, and precise PDF pagination." },
              { q: "Is my documentation secure?", a: "Yes. We use Role-Based Access Control (RBAC). Only owners can grant 'Edit' permissions, and all data is encrypted at rest in our MongoDB cluster." },
              { q: "What makes the PDF export 'High-Fidelity'?", a: "We use a headless Chromium instance (Puppeteer) to 'print' your document. This means every table, bold tag, and custom font in the editor appears exactly the same in your PDF." },
              { q: "Can I use TaskFlow for non-engineering projects?", a: "While optimized for technical workflows at GPERI, TaskFlow is a robust management tool for any company requiring structured documentation and team collaboration." }
            ].map((item, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all">
                <h4 className="text-lg font-bold mb-3 flex items-center gap-3">
                  <span className="text-blue-500 font-mono">0{i+1}.</span> {item.q}
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed pl-10 group-hover:text-gray-400 transition-colors">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Bottom CTA --- */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-blue-600/20">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-20"></div>
          <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10">Ready to sync <br/> your team?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-xl">
              Create Enterprise Account
            </button>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#010309]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                <span className="font-bold text-sm">T</span>
             </div>
             <span className="font-black text-sm uppercase tracking-widest text-gray-500">NovaBoard 2026</span>
          </div>
          <p className="text-gray-600 text-sm font-medium">Built for Gujarat Power Engineering & Research Institute.</p>
          <div className="flex gap-6 text-gray-500">
            <MousePointer2 size={18} className="hover:text-white cursor-pointer transition-colors" />
            <GitBranch size={18} className="hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}