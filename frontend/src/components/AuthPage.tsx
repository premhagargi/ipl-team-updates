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
    <div className="min-h-screen bg-[#08090c] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#10131a] rounded-xl border border-[#1f2430] p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-1.5 bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded tracking-wide uppercase mb-3">
            IPL MATCH CENTRE
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Franchise Updates & Live Scores
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time notifications driven by MongoDB Change Streams
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1c212c] mb-5">
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(true);
              setError(null);
            }}
            className={`pb-2 text-xs font-bold flex-1 text-center transition border-b-2 ${
              isLoginTab
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-400'
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
            className={`pb-2 text-xs font-bold flex-1 text-center transition border-b-2 ${
              !isLoginTab
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-400'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded bg-red-950/50 border border-red-800 text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full bg-[#0b0d13] border border-[#1f2430] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0b0d13] border border-[#1f2430] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition disabled:opacity-50 mt-1"
          >
            {loading ? 'Please wait...' : isLoginTab ? 'Continue to Match Centre' : 'Register Account'}
          </button>
        </form>

        {/* Demo Logins */}
        <div className="mt-6 pt-5 border-t border-[#1c212c]">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-center mb-2.5">
            1-Click Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="p-2 rounded bg-[#0b0d13] border border-[#1f2430] hover:border-zinc-700 text-left transition"
            >
              <div className="text-xs font-bold text-zinc-200">Admin</div>
              <div className="text-[10px] text-zinc-500">admin / admin123</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('user1', 'password123')}
              className="p-2 rounded bg-[#0b0d13] border border-[#1f2430] hover:border-zinc-700 text-left transition"
            >
              <div className="text-xs font-bold text-zinc-200">User</div>
              <div className="text-[10px] text-zinc-500">user1 / password123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
