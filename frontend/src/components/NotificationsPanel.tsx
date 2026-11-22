import React from 'react';
import { useSocket } from '../context/SocketContext';
import { X, CheckCheck, Bell } from 'lucide-react';

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
        return 'Titles';
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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full z-10 font-sans">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-display font-black text-slate-900 uppercase tracking-tight">
              Real-time Alerts
            </h2>
            <p className="text-[11px] text-slate-500 font-sans">
              {unreadCount > 0 ? `${unreadCount} unread update(s)` : 'All updates caught up'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-200/80 hover:bg-slate-300 text-xs font-bold text-slate-800 transition"
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Mark Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Bell className="w-7 h-7 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-600 font-display">No alerts yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs font-sans">
                Subscribe to franchises to receive instant real-time change stream updates.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item._id}
                className={`p-3.5 rounded-xl border transition ${
                  !item.read
                    ? 'bg-blue-50/40 border-blue-300/80 shadow-sm'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-display font-black bg-blue-100 text-blue-800 border border-blue-200">
                      {item.teamId?.short || 'TEAM'}
                    </span>
                    <span className="text-xs font-display font-bold text-slate-900 truncate max-w-[190px]">
                      {item.teamId?.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatTime(item.createdAt)}
                  </span>
                </div>

                {/* Changes List */}
                <div className="space-y-1 bg-slate-50 rounded-lg p-2.5 text-xs border border-slate-100 font-mono">
                  {item.changes.map((change, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-slate-700"
                    >
                      <span className="text-slate-500 text-[11px] font-sans font-medium">
                        {getFieldLabel(change.field)}:
                      </span>
                      <span className="font-bold text-slate-900">
                        {String(change.newValue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
