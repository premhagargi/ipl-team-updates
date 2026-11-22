import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bell, Shield, LogOut } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-[#0d0f14]/95 backdrop-blur-md border-b border-[#1c202a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded tracking-wide uppercase">
              IPL
            </span>
            <span className="font-extrabold text-base tracking-tight text-white uppercase">
              Match Centre
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-[#1c202a] text-xs text-zinc-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-medium">
              {isConnected ? 'Real-time Feed Active' : 'Connecting to Stream...'}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition"
            >
              Admin Controls
            </button>
          )}

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
            aria-label="Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* User & Logout */}
          <div className="flex items-center space-x-2 pl-2 border-l border-zinc-800">
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-xs font-semibold text-zinc-200">{user?.username}</div>
              <div className="text-[10px] text-zinc-500 uppercase">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
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
