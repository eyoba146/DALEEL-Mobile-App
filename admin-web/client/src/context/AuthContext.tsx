import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi, setStoredToken } from '../api';
import type { AdminUser } from '../api';

export type AppModule =
  | 'dashboard'
  | 'inquiries'
  | 'reviews'
  | 'destinations'
  | 'services'
  | 'events'
  | 'marketplace'
  | 'investments'
  | 'users'
  | 'team'
  | 'profile';

interface AuthContextType {
  adminUser: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  canAccess: (module: AppModule) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('daleel_admin_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const user = await adminApi.getMe();
      setAdminUser(user);
    } catch (error) {
      console.warn('Failed to refresh admin session:', error);
    }
  };

  useEffect(() => {
    async function verifySession() {
      const stored = localStorage.getItem('daleel_admin_token');
      if (!stored) {
        setIsLoading(false);
        return;
      }
      try {
        const user = await adminApi.getMe();
        setAdminUser(user);
        setToken(stored);
      } catch (error) {
        console.warn('Admin session expired or invalid:', error);
        setStoredToken(null);
        setAdminUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await adminApi.login(email, password);
    setStoredToken(res.token);
    setToken(res.token);
    setAdminUser(res.admin);
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setAdminUser(null);
  };

  const canAccess = (module: AppModule): boolean => {
    if (!adminUser) return false;
    // Every authenticated administrator can access their own profile
    if (module === 'profile') return true;
    if (adminUser.adminRole === 'SUPER_ADMIN') return true;

    switch (module) {
      case 'dashboard':
        return true;
      case 'inquiries':
        return true; // All authorized roles access the role-scoped triage desk
      case 'reviews':
        return (
          adminUser.adminRole === 'MARKETPLACE_MANAGER' ||
          adminUser.adminRole === 'SERVICE_MANAGER' ||
          adminUser.adminRole === 'DESTINATION_MANAGER'
        );
      case 'destinations':
        return adminUser.adminRole === 'DESTINATION_MANAGER';
      case 'services':
        return adminUser.adminRole === 'SERVICE_MANAGER';
      case 'events':
        return adminUser.adminRole === 'EVENT_MANAGER';
      case 'marketplace':
        return adminUser.adminRole === 'MARKETPLACE_MANAGER';
      case 'investments':
        return adminUser.adminRole === 'INVESTMENT_OFFICER';
      case 'users':
        return false; // Only SUPER_ADMIN (handled above by if (adminUser.adminRole === 'SUPER_ADMIN') return true)
      case 'team':
        return false; // Only SUPER_ADMIN
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider value={{ adminUser, token, isLoading, login, logout, canAccess, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AuthProvider');
  }
  return context;
};
