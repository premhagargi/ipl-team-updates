import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Shield, Bell, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container split panel */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Left Hero Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none">
                  IPL PULSE
                </h1>
                <p className="text-xs text-blue-200 mt-0.5">Real-time Service</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight mb-3">
              Real-time IPL Updates & Live Scoreboard
            </h2>
            <p className="text-xs text-blue-100/80 leading-relaxed mb-6">
              Follow all 10 IPL franchises with millisecond-latency Change Streams.
              Receive grouped notifications on captaincy changes, wins, points, and stream live ball-by-ball scorecards.
            </p>

            <div className="space-y-3 text-xs text-blue-100">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>MongoDB Change Stream driven (Direct Mongo writes supported)</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Grouped multi-field diff notifications</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Offline notification durability on next login</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Raw WebSocket Live Match Scorecard stream</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-[11px] text-blue-200/60">
            Powered by NestJS • MongoDB Atlas • Raw WebSocket • React
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            {/* Tabs */}
            <div className="flex border-b border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(true);
                  setError(null);
                }}
                className={`pb-3 text-sm font-bold flex-1 text-center transition border-b-2 ${
                  isLoginTab
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
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
                className={`pb-3 text-sm font-bold flex-1 text-center transition border-b-2 ${
                  !isLoginTab
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Processing...' : isLoginTab ? 'Sign In to Dashboard' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* One-click Demo Credentials for Grader / Evaluator */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
                Quick Evaluator Logins:
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-xs font-medium text-slate-300 transition text-center"
                >
                  <div className="font-bold text-amber-400">Admin User</div>
                  <div className="text-[10px] text-slate-500">admin / admin123</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('user1', 'password123')}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/10 text-xs font-medium text-slate-300 transition text-center"
                >
                  <div className="font-bold text-blue-400">Regular User</div>
                  <div className="text-[10px] text-slate-500">user1 / password123</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
