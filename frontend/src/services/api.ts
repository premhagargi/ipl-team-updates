import { Team, NotificationItem } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('ipl_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function notifyUnauthorized(message = 'Session expired or unauthorized (401). Please sign in again.') {
  localStorage.removeItem('ipl_token');
  localStorage.removeItem('ipl_user');
  sessionStorage.setItem('ipl_session_alert', message);
  window.dispatchEvent(
    new CustomEvent('auth:unauthorized', {
      detail: { message },
    })
  );
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    notifyUnauthorized();
  }
  return res;
}

export const api = {
  // Auth
  async register(username: string, password: string, role = 'user') {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Registration failed');
    }
    return res.json();
  },

  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    const res = await authFetch(`${API_BASE}/teams`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },

  async getTeam(id: string): Promise<Team> {
    const res = await authFetch(`${API_BASE}/teams/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch team');
    return res.json();
  },

  async subscribeTeam(teamId: string, fields: 'ALL' | string[] = 'ALL') {
    const res = await authFetch(`${API_BASE}/teams/${teamId}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) throw new Error('Failed to subscribe to team');
    return res.json();
  },

  async unsubscribeTeam(teamId: string) {
    const res = await authFetch(`${API_BASE}/teams/${teamId}/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to unsubscribe from team');
    return res.json();
  },

  async updateSubscription(teamId: string, fields: 'ALL' | string[]) {
    const res = await authFetch(`${API_BASE}/teams/${teamId}/subscription`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) throw new Error('Failed to update subscription fields');
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const res = await authFetch(`${API_BASE}/notifications`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  // Live Match
  async getLiveMatch() {
    try {
      const res = await fetch(`${API_BASE}/live-match`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async markAllRead() {
    const res = await authFetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to mark all as read');
    return res.json();
  },

  // Admin update (triggers Mongo Change Stream)
  async adminUpdateTeam(teamId: string, data: Partial<Team>) {
    const res = await authFetch(`${API_BASE}/admin/teams/${teamId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Admin update failed' }));
      throw new Error(err.message || 'Admin update failed');
    }
    return res.json();
  },
};
