import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');

    setLoading(true);
    try {
      await API.post('/auth/forgotpassword', { email });
      setIsSent(true);
      toast.success('Reset link sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Recover Password</h2>
          <p className="text-sm text-gray-500 mt-2">Enter your email and we'll send you a reset link.</p>
        </div>

        {isSent ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
              Check your inbox! If an account exists with <strong>{email}</strong>, a reset link has been sent.
            </div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">
              <ArrowLeft size={16} /> Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex justify-center items-center"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : "Send Reset Link"}
            </button>

            <div className="text-center mt-6">
              <Link to="/" className="text-sm font-bold text-gray-500 hover:text-blue-600 inline-flex items-center gap-2 transition-colors">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}