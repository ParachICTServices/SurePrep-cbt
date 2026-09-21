"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '@/app/lib/api/services/authService';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
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
      return onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          setUser(firebaseUser ? await authService.getCurrentUser() : null);
        } catch (error) {
          console.error('Session expired or invalid:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      });
    };

    const unsubscribe = initAuth();
    return () => { unsubscribe.then((cleanup) => cleanup()); };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authService.register(data);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const clearLocalSession = () => {
    void authService.logout();
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