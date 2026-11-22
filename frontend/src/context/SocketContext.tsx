import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { LiveMatch, NotificationItem } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface SocketContextType {
  isConnected: boolean;
  liveMatch: LiveMatch | null;
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  lastTeamUpdateNotification: NotificationItem | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [liveMatch, setLiveMatch] = useState<LiveMatch | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [lastTeamUpdateNotification, setLastTeamUpdateNotification] = useState<NotificationItem | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Fetch initial match immediately on mount (NO ENDLESS LOADING)
  useEffect(() => {
    api.getLiveMatch().then((match) => {
      if (match) setLiveMatch(match);
    });
  }, []);

  // Fetch initial notifications on login/mount
  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch initial notifications:', err);
    }
  }, [token]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Connect native WebSocket (raw `ws`)
  useEffect(() => {
    let isCancelled = false;

    const connectWebSocket = () => {
      if (isCancelled) return;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In dev, backend runs on port 3000
      const wsHost =
        import.meta.env.VITE_WS_URL ||
        `${wsProtocol}//${window.location.hostname}:3000/ws`;

      const wsUrl = token ? `${wsHost}?token=${encodeURIComponent(token)}` : wsHost;

      console.log('Connecting raw WebSocket to:', wsUrl.replace(/token=([^&]+)/, 'token=***'));
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isCancelled) return;
        console.log('✅ WebSocket connected successfully!');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (isCancelled) return;
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'connected') {
            console.log('WS Connection Acknowledged:', message.payload);
          } else if (message.type === 'match_update') {
            setLiveMatch(message.payload);
          } else if (message.type === 'notification') {
            const newNotification: NotificationItem = message.payload;
            console.log('🔔 New Real-time Grouped Notification Received:', newNotification);

            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            setLastTeamUpdateNotification(newNotification);

            // Trigger notification sound / visual cue if supported
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`IPL Update: ${newNotification.teamId?.name || 'Team'}`, {
                body: newNotification.changes
                  .map((c) => `${c.field}: ${c.newValue}`)
                  .join(' | '),
              });
            }
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        if (isCancelled) return;
        console.warn(`WebSocket closed (code: ${event.code}). Reconnecting in 3s...`);
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error encountered:', err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      isCancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [token, user]);

  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await api.markAllRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      // Revert if error
      refreshNotifications();
    }
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        liveMatch,
        notifications,
        unreadCount,
        markAllAsRead,
        refreshNotifications,
        lastTeamUpdateNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
