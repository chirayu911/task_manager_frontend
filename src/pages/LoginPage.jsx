import React, { useState } from 'react';
import { Lock, Mail, Loader } from 'lucide-react';
import API from '../api';

export default function LoginPage() {
  const [username, setUsername] = useState(''); // ⭐ Use email instead of username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ⭐ Send 'email' to match backend controller
      await API.post('/auth/login', { username, password });
      window.location.href = "/";
    } catch (err) {
      // Display specific error message from backend
      setError(err.response?.data?.message || "Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Task Manager</h1>
          <p className="text-gray-500 mt-2 text-sm uppercase tracking-wider">Please Sign In</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm border border-red-200 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1 ml-1 text-sm">Username</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input 
                type="text" 
                className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 ml-1 text-sm">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input 
                type="password" 
                className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader className="animate-spin" size={20}/> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}