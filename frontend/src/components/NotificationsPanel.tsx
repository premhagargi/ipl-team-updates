import React from 'react';
import { useSocket } from '../context/SocketContext';
import { X, CheckCheck, Bell, Clock } from 'lucide-react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications, unreadCount, markAllAsRead } = useSocket();

  if (!isOpen) return null;

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'captain':
        return 'Captain';
      case 'headCoach':
        return 'Head Coach';
      case 'homeGround':
        return 'Home Ground';
      case 'titles':
        return 'IPL Titles';
      case 'wins':
        return 'Wins';
      case 'losses':
        return 'Losses';
      case 'points':
        return 'Points';
      default:
        return field;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#0f172a] border-l border-slate-800 shadow-2xl flex flex-col h-full z-10">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Notifications
              </h2>
              <p className="text-xs text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-300">No notifications yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Subscribe to your favorite teams below to receive instant real-time updates!
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item._id}
                className={`p-4 rounded-xl border transition ${
                  !item.read
                    ? 'bg-blue-950/20 border-blue-500/40 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded font-black text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {item.teamId?.short || 'TEAM'}
                    </span>
                    <span className="text-sm font-bold text-white truncate max-w-[190px]">
                      {item.teamId?.name || 'IPL Team'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{formatTime(item.createdAt)}</span>
                  </div>
                </div>

                {/* Grouped Changes List */}
                <div className="mt-2.5 space-y-1.5 bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/60 text-xs">
                  {item.changes.map((change, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-slate-300"
                    >
                      <span className="text-slate-400 font-medium">
                        {getFieldLabel(change.field)}:
                      </span>
                      <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded">
                        {String(change.newValue)}
                      </span>
                    </div>
                  ))}
                </div>

                {!item.read && (
                  <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    <span>New Update</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
