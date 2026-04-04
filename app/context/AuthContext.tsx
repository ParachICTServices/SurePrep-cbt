"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '@/app/lib/api/services/authService';
import { apiClient } from '@/app/lib/api/apiClient';
import { User } from '@/app/type';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  clearLocalSession: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          apiClient.setToken(token);
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Session expired or invalid:', error);
          localStorage.removeItem('auth_token');
          apiClient.clearToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      if (response.accessToken) {
        localStorage.setItem('auth_token', response.accessToken);
        apiClient.setToken(response.accessToken);
      }
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authService.register(data);
      if (response.accessToken) {
        localStorage.setItem('auth_token', response.accessToken);
        apiClient.setToken(response.accessToken);
      }
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const clearLocalSession = () => {
    localStorage.removeItem('auth_token');
    apiClient.clearToken();
    setUser(null);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      clearLocalSession();
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Could not refresh user stats:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, clearLocalSession, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};