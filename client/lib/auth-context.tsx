import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, AuthUser, SupportedLanguage } from './api';

type OnboardingChoice = {
  userType: 'diaspora' | 'foreign_resident';
  country: string;
  language: SupportedLanguage;
};

type AuthState = {
  isReady: boolean;
  user: AuthUser | null;
  token: string | null;
  onboarding: OnboardingChoice | null;
  setOnboarding: (choice: OnboardingChoice) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    userType?: 'diaspora' | 'foreign_resident',
    country?: string,
    language?: SupportedLanguage
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkVerificationStatus: () => Promise<void>;
  updateUser: (updates: {
    name?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string | null;
    userType?: 'diaspora' | 'foreign_resident';
    country?: string;
    language?: SupportedLanguage;
    savedAddress?: string | null;
    savedLatitude?: number | null;
    savedLongitude?: number | null;
  }) => Promise<void>;
  uploadAvatar: (base64: string) => Promise<string>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestEmailChange: (newEmail: string) => Promise<{ message: string; remainingSeconds?: number }>;
  confirmEmailChange: (newEmail: string, code: string) => Promise<{ message: string; user: AuthUser }>;
};

const STORAGE_KEYS = {
  token: 'diaspora.token',
  user: 'diaspora.user',
  onboarding: 'diaspora.onboarding',
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [onboarding, setOnboardingState] = useState<OnboardingChoice | null>(null);

  useEffect(() => {
    (async () => {
      const [storedToken, storedUser, storedOnboarding] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.token),
        AsyncStorage.getItem(STORAGE_KEYS.user),
        AsyncStorage.getItem(STORAGE_KEYS.onboarding),
      ]);
      if (storedToken) setToken(storedToken);
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedOnboarding) setOnboardingState(JSON.parse(storedOnboarding));
      setIsReady(true);
    })();
  }, []);

  const setOnboarding = async (choice: OnboardingChoice) => {
    setOnboardingState(choice);
    await AsyncStorage.setItem(STORAGE_KEYS.onboarding, JSON.stringify(choice));
  };

  const persistSession = async (nextUser: AuthUser, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.token, nextToken),
      AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser)),
    ]);
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    await persistSession(res.user, res.token);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    userType?: 'diaspora' | 'foreign_resident',
    country?: string,
    language?: SupportedLanguage
  ) => {
    const finalUserType = userType || onboarding?.userType || 'diaspora';
    const finalCountry = country || onboarding?.country || 'United States';
    const finalLanguage = language || onboarding?.language || 'en';

    const res = await authApi.register({
      name,
      email,
      password,
      userType: finalUserType,
      country: finalCountry,
      language: finalLanguage,
    });
    await persistSession(res.user, res.token);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.token),
      AsyncStorage.removeItem(STORAGE_KEYS.user),
    ]);
  };

  const checkVerificationStatus = async () => {
    if (!token) return;
    try {
      const refreshedUser = await authApi.me(token);
      await persistSession(refreshedUser, token);
    } catch (e) {
      console.warn('Failed to refresh user status:', e);
    }
  };

  const updateUser = async (updates: {
    name?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string | null;
    userType?: 'diaspora' | 'foreign_resident';
    country?: string;
    language?: SupportedLanguage;
    savedAddress?: string | null;
    savedLatitude?: number | null;
    savedLongitude?: number | null;
  }) => {
    if (!token) throw new Error('Not authenticated');
    const res = await authApi.updateProfile(token, updates);
    setUser(res.user);
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(res.user));
  };

  const uploadAvatar = async (base64: string) => {
    if (!token) throw new Error('Not authenticated');
    const res = await authApi.uploadAvatar(token, base64);
    setUser(res.user);
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(res.user));
    return res.avatarUrl;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) throw new Error('Not authenticated');
    await authApi.changePassword(token, { currentPassword, newPassword });
  };

  const requestEmailChange = async (newEmail: string) => {
    if (!token) throw new Error('Not authenticated');
    return await authApi.requestEmailChange(token, newEmail);
  };

  const confirmEmailChange = async (newEmail: string, code: string) => {
    if (!token) throw new Error('Not authenticated');
    const res = await authApi.confirmEmailChange(token, newEmail, code);
    setUser(res.user);
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(res.user));
    return res;
  };

  const value = useMemo(
    () => ({
      isReady,
      user,
      token,
      onboarding,
      setOnboarding,
      login,
      register,
      logout,
      checkVerificationStatus,
      updateUser,
      uploadAvatar,
      changePassword,
      requestEmailChange,
      confirmEmailChange,
    }),
    [isReady, user, token, onboarding]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
