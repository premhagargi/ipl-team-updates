import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role?: string) => Promise<void>;
  logout: (reason?: string) => void;
  isAdmin: boolean;
  sessionAlert: string | null;
  clearSessionAlert: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ipl_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionAlert, setSessionAlert] = useState<string | null>(() => {
    return sessionStorage.getItem('ipl_session_alert') || null;
  });

  const clearSessionAlert = useCallback(() => {
    setSessionAlert(null);
    sessionStorage.removeItem('ipl_session_alert');
  }, []);

  const logout = useCallback((reason?: string) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ipl_token');
    localStorage.removeItem('ipl_user');
    if (reason) {
      setSessionAlert(reason);
      sessionStorage.setItem('ipl_session_alert', reason);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('ipl_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('ipl_user');
      }
    }
    setIsLoading(false);
  }, [token]);

  // Global listener for 401 unauthorized events
  useEffect(() => {
    const handleUnauthorizedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      const reason = customEvent.detail?.message || 'Session expired or unauthorized (401). Please sign in again.';
      logout(reason);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorizedEvent);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent);
    };
  }, [logout]);

  const login = async (username: string, password: string) => {
    clearSessionAlert();
    const data = await api.login(username, password);
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('ipl_token', data.accessToken);
    localStorage.setItem('ipl_user', JSON.stringify(data.user));
  };

  const register = async (username: string, password: string, role = 'user') => {
    clearSessionAlert();
    const data = await api.register(username, password, role);
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('ipl_token', data.accessToken);
    localStorage.setItem('ipl_user', JSON.stringify(data.user));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAdmin,
        sessionAlert,
        clearSessionAlert,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
