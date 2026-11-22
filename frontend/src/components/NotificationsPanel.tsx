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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#0f1118] border-l border-[#1f2430] flex flex-col h-full z-10">
        {/* Header */}
        <div className="p-4 border-b border-[#1c212c] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Alerts & Updates
            </h2>
            <p className="text-[11px] text-zinc-500">
              {unreadCount > 0 ? `${unreadCount} unread update(s)` : 'All caught up'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition"
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Mark Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <Bell className="w-6 h-6 text-zinc-600 mb-2" />
              <p className="text-xs font-medium text-zinc-400">No alerts yet</p>
              <p className="text-[11px] text-zinc-600 mt-1 max-w-xs">
                Subscribe to franchises to receive instant real-time change stream updates.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item._id}
                className={`p-3 rounded-lg border transition ${
                  !item.read
                    ? 'bg-[#151922] border-blue-600/50'
                    : 'bg-[#10131a] border-[#1c212c]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-zinc-800 text-zinc-200">
                      {item.teamId?.short || 'TEAM'}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[190px]">
                      {item.teamId?.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {formatTime(item.createdAt)}
                  </span>
                </div>

                {/* Changes List */}
                <div className="space-y-1 bg-[#0b0d13] rounded p-2 text-xs border border-[#1a1e28]">
                  {item.changes.map((change, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-zinc-300"
                    >
                      <span className="text-zinc-500 text-[11px]">
                        {getFieldLabel(change.field)}:
                      </span>
                      <span className="font-semibold text-white">
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
