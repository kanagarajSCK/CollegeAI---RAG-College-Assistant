import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('collegeai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('collegeai_token');
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('collegeai_token');
      if (savedToken) {
        try {
          const data = await api.getCurrentUser();
          setUser(data.user);
          localStorage.setItem('collegeai_user', JSON.stringify(data.user));
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('collegeai_token');
          localStorage.removeItem('collegeai_user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();

    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('collegeai_token', data.token);
    localStorage.setItem('collegeai_user', JSON.stringify(data.user));
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string) => {
    const data = await api.register(name, email, password, confirmPassword);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('collegeai_token', data.token);
    localStorage.setItem('collegeai_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('collegeai_token');
    localStorage.removeItem('collegeai_user');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      localStorage.setItem('collegeai_user', JSON.stringify(data.user));
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const updateProfile = async (name: string) => {
    const data = await api.updateProfile(name);
    setUser(prev => prev ? { ...prev, name: data.user.name } : data.user);
    localStorage.setItem('collegeai_user', JSON.stringify(data.user));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
