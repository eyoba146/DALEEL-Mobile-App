import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth-context';
import { translations } from './i18n/translations';
import { LANGUAGES, LanguageMeta, SupportedLanguage } from './i18n/types';

const STORAGE_KEY = 'diaspora.language';

type LanguageContextType = {
  language: SupportedLanguage;
  languageMeta: LanguageMeta;
  languages: LanguageMeta[];
  isRTL: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (keyPath: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isReady, setIsReady] = useState(false);

  // Initialize language from local storage or authenticated user
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted) {
          if (stored && ['en', 'am', 'om', 'ar'].includes(stored)) {
            setLanguageState(stored as SupportedLanguage);
          } else if (user?.language && ['en', 'am', 'om', 'ar'].includes(user.language)) {
            setLanguageState(user.language as SupportedLanguage);
          }
        }
      } catch (err) {
        console.warn('Failed to load stored language preference:', err);
      } finally {
        if (isMounted) setIsReady(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [user?.language]);

  const languageMeta = useMemo(() => {
    return LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  }, [language]);

  const isRTL = useMemo(() => languageMeta.isRTL ?? false, [languageMeta]);

  // Set language with persistence & background user profile sync
  const setLanguage = useCallback(
    async (newLang: SupportedLanguage) => {
      setLanguageState(newLang);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, newLang);
        if (user) {
          // Sync with backend profile silently
          updateUser({ language: newLang }).catch((err) => {
            console.warn('Failed to sync language to user profile:', err);
          });
        }
      } catch (err) {
        console.warn('Failed to save language preference:', err);
      }
    },
    [user, updateUser]
  );

  // Translation helper: resolves dot-paths like 'tabs.home' or 'home.greeting'
  const t = useCallback(
    (keyPath: string, fallback?: string): string => {
      const parts = keyPath.split('.');

      // 1. Try active language
      let curr: any = translations[language];
      for (const part of parts) {
        if (curr && typeof curr === 'object' && part in curr) {
          curr = curr[part];
        } else {
          curr = undefined;
          break;
        }
      }
      if (typeof curr === 'string') return curr;

      // 2. Fallback to English
      let fallbackCurr: any = translations.en;
      for (const part of parts) {
        if (fallbackCurr && typeof fallbackCurr === 'object' && part in fallbackCurr) {
          fallbackCurr = fallbackCurr[part];
        } else {
          fallbackCurr = undefined;
          break;
        }
      }
      if (typeof fallbackCurr === 'string') return fallbackCurr;

      // 3. Fallback to passed fallback or keyPath
      return fallback ?? keyPath;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      languageMeta,
      languages: LANGUAGES,
      isRTL,
      setLanguage,
      t,
    }),
    [language, languageMeta, isRTL, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
