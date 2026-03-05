import React, { useState } from 'react';
import { Lock, Mail, Loader, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom'; // ⭐ Added Link
import API from '../api';

export default function LoginPage({ setUser, notify }) { 
  // State for form inputs
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // ⭐ Configuration Constants
  const MAX_USERNAME = 30;
  const MAX_PASSWORD = 50;

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Front-end validation
    if (username.length < 3) return setError("Username is too short");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    setError('');
    setLoading(true);

    try {
      const response = await API.post('/api/auth/login', { username, password });
      
      // ⭐ Trigger Global Success Notification
      if (notify) {
        notify('success', `Welcome back, ${response.data.name || username}!`);
      }

      // Update global user state
      setUser(response.data);
      
      // Redirect to dashboard
      navigate('/'); 
      
    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 transition-all">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4">
             <Lock className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Task Manager</h1>
          <p className="text-gray-400 mt-2 text-xs uppercase font-bold tracking-widest">Identify Yourself</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm border border-red-100 text-center font-medium animate-in fade-in zoom-in duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Username</label>
              <span className={`text-[10px] font-bold ${username.length >= MAX_USERNAME ? 'text-red-500' : 'text-gray-300'}`}>
                {username.length}/{MAX_USERNAME}
              </span>
            </div>
            <div className="relative group">
              <Mail className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                maxLength={MAX_USERNAME}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-700"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Password</label>
              <span className={`text-[10px] font-bold ${password.length >= MAX_PASSWORD ? 'text-red-500' : 'text-gray-300'}`}>
                {password.length}/{MAX_PASSWORD}
              </span>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input 
                type={showPassword ? "text" : "password"} 
                maxLength={MAX_PASSWORD}
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-700"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Visibility Toggle */}
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* ⭐ Added Forgot Password Link */}
            <div className="flex justify-end pt-2">
              <Link 
                to="/forgot-password" 
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl hover:bg-blue-700 font-bold transition-all shadow-xl shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20}/>
                <span>Verifying...</span>
              </>
            ) : (
              "Secure Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em]">
            Protected Environment
          </p>
        </div>
      </div>
    </div>
  );
}