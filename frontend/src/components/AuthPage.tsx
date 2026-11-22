import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginTab) {
        await login(username, password);
      } else {
        await register(username, password, 'user');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(user, pass);
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-1.5 bg-[#e11d48] text-white text-[11px] font-black px-2.5 py-0.5 rounded tracking-wider uppercase font-display mb-3 shadow-sm">
            IPL MATCH CENTRE
          </div>
          <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight">
            Franchise Pulse & Live Scores
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Real-time notifications driven by MongoDB Change Streams
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-5">
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(true);
              setError(null);
            }}
            className={`pb-2.5 text-xs font-display font-bold flex-1 text-center transition border-b-2 ${
              isLoginTab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(false);
              setError(null);
            }}
            className={`pb-2.5 text-xs font-display font-bold flex-1 text-center transition border-b-2 ${
              !isLoginTab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium font-sans">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-display font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-sans"
            />
          </div>

          <div>
            <label className="block text-[11px] font-display font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs tracking-wide transition shadow-sm disabled:opacity-50 mt-1"
          >
            {loading ? 'Please wait...' : isLoginTab ? 'Continue to Match Centre' : 'Register Account'}
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            1-Click Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-left transition"
            >
              <div className="text-xs font-display font-bold text-slate-900">Admin</div>
              <div className="text-[10px] font-mono text-slate-500">admin / admin123</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('user1', 'password123')}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-left transition"
            >
              <div className="text-xs font-display font-bold text-slate-900">Demo User</div>
              <div className="text-[10px] font-mono text-slate-500">user1 / password123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
