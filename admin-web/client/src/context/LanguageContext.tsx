import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { adminTranslations, ADMIN_LANGUAGES, type Language, type LanguageMeta } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  languages: LanguageMeta[];
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const STORAGE_KEY = 'daleel.admin.lang';

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'am' || saved === 'om' || saved === 'ar')) {
        return saved as Language;
      }
    } catch {
      // Ignore localStorage error
    }
    return 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore
    }
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = adminTranslations[language];
      if (dict && dict[key]) {
        return dict[key];
      }
      // Fallback to English
      const enDict = adminTranslations.en;
      if (enDict && enDict[key]) {
        return enDict[key];
      }
      return fallback !== undefined ? fallback : key;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      languages: ADMIN_LANGUAGES,
      isRTL,
      setLanguage,
      t,
    }),
    [language, isRTL, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
