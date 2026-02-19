import React, { useState } from 'react';
import { Lock, User, Loader } from 'lucide-react';
import API from '../api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await API.post('/auth/login', { username, password });

      // 🔴 IMPORTANT:
      // Reload so App.js fetches /auth/me and connects socket
      window.location.href = "/";

    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Task Manager</h1>
          <p className="text-gray-500">Sign in with Username</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">

          <div>
            <label className="block text-gray-700 font-medium mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                className="w-full pl-10 p-2.5 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="password" 
                className="w-full pl-10 p-2.5 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
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
            className="w-full bg-blue-600 text-white py-2.5 rounded hover:bg-blue-700 font-bold transition flex justify-center items-center gap-2"
          >
            {loading 
              ? <Loader className="animate-spin" size={20}/> 
              : "Sign In"}
          </button>

        </form>
      </div>
    </div>
  );
}
