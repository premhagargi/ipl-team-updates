import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bell, Wifi, WifiOff, Shield, LogOut, Trophy } from 'lucide-react';

interface NavbarProps {
  onOpenNotifications: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNotifications,
  onOpenAdmin,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { isConnected, unreadCount } = useSocket();

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">
                IPL Pulse
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Real-time Team Updates & Match Stream
            </p>
          </div>
        </div>

        {/* Right Action Icons & User Info */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* WebSocket Status Indicator */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
            title={isConnected ? 'WebSocket Connected' : 'Reconnecting WebSocket...'}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">WS Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="hidden md:inline">Connecting...</span>
              </>
            )}
          </div>

          {/* Admin Switcher Modal Trigger */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold transition"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Simulator</span>
            </button>
          )}

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700/60"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[11px] font-bold shadow-lg shadow-rose-500/50 animate-bounce">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* User info & Logout */}
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-slate-200 leading-tight">
                {user?.username}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                {user?.role}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
