import React, { createContext, useContext, useEffect, useState } from 'react';
import { adminApi, getAdminToken, setAdminToken, type AdminUser, type AdminRole } from './api';

interface AuthContextType {
  adminUser: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: AdminRole[]) => boolean;
  isSuperAdmin: boolean;
  canManageServices: boolean;
  canManageDestinations: boolean;
  canManageEvents: boolean;
  canManageMarketplace: boolean;
  canManageInvestments: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    try {
      const storedToken = await getAdminToken();
      if (storedToken) {
        setToken(storedToken);
        const me = await adminApi.getMe();
        setAdminUser(me);
      }
    } catch (err) {
      console.warn('Initial admin auth check failed or expired session:', err);
      await setAdminToken(null);
      setToken(null);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<AdminUser> => {
    const res = await adminApi.login(email, pass);
    setToken(res.token);
    setAdminUser(res.admin);
    return res.admin;
  };

  const logout = async () => {
    await setAdminToken(null);
    setToken(null);
    setAdminUser(null);
  };

  const refreshUser = async () => {
    try {
      const me = await adminApi.getMe();
      setAdminUser(me);
    } catch (err) {
      console.warn('Failed to refresh admin user:', err);
    }
  };

  const hasRole = (...roles: AdminRole[]): boolean => {
    if (!adminUser) return false;
    if (adminUser.adminRole === 'SUPER_ADMIN') return true;
    return roles.includes(adminUser.adminRole);
  };

  const isSuperAdmin = adminUser?.adminRole === 'SUPER_ADMIN';
  const canManageServices = isSuperAdmin || adminUser?.adminRole === 'SERVICE_MANAGER';
  const canManageDestinations = isSuperAdmin || adminUser?.adminRole === 'DESTINATION_MANAGER';
  const canManageEvents = isSuperAdmin || adminUser?.adminRole === 'EVENT_MANAGER';
  const canManageMarketplace = isSuperAdmin || adminUser?.adminRole === 'MARKETPLACE_MANAGER';
  const canManageInvestments = isSuperAdmin || adminUser?.adminRole === 'INVESTMENT_OFFICER';

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        token,
        loading,
        login,
        logout,
        refreshUser,
        hasRole,
        isSuperAdmin,
        canManageServices,
        canManageDestinations,
        canManageEvents,
        canManageMarketplace,
        canManageInvestments,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAdminAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AuthProvider');
  }
  return context;
}
