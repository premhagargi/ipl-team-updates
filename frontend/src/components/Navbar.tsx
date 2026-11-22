import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bell, LogOut, Shield } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3.5">
          <div className="flex items-center space-x-2">
            <span className="bg-[#e11d48] text-white text-xs font-black px-2 py-0.5 rounded tracking-wider uppercase font-display">
              IPL
            </span>
            <span className="font-display font-black text-lg tracking-tight text-slate-900 uppercase">
              Match Centre
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-slate-200 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-semibold text-slate-600 font-sans">
              {isConnected ? 'Live Telemetry Connected' : 'Connecting to Stream...'}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition flex items-center space-x-1"
            >
              <Shield className="w-3.5 h-3.5 text-slate-600" />
              <span>Admin Controls</span>
            </button>
          )}

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            aria-label="Alerts"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#e11d48] text-white text-[10px] font-bold font-mono shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* User & Logout */}
          <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-xs font-bold text-slate-900 font-sans">{user?.username}</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">{user?.role}</div>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
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
