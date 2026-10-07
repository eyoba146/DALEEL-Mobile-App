import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AdminLanguage = 'en' | 'am';

interface LanguageContextType {
  language: AdminLanguage;
  setLanguage: (lang: AdminLanguage) => Promise<void>;
  t: (key: string) => string;
}

const translations: Record<AdminLanguage, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    triage: 'Triage Desk',
    catalog: 'Directory',
    members: 'Members',
    more: 'Executive Desk',
    overview: 'Executive Overview',
    pendingInquiries: 'Pending Inquiries',
    activeRSVPs: 'Active RSVPs',
    marketplaceOrders: 'Artisan Orders',
    investorLeads: 'Investor Leads',
    registeredUsers: 'Mobile Members',
    coordinators: 'Staff Coordinators',
    urgentAction: 'Urgent Action Required',
    allGood: 'All queues are up to date',
    searchPlaceholder: 'Search by keyword, client, or title...',
    filterAll: 'All',
    filterActive: 'Active',
    filterConfirmed: 'Confirmed',
    filterCancelled: 'Cancelled',
    save: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    status: 'Status',
    actions: 'Actions',
    logout: 'Sign Out',
    signIn: 'Sign In to DALEEL Admin',
    welcomeBack: 'Welcome back, Coordinator',
    emailPlaceholder: 'Official Email (e.g. coordinator@daleel.et)',
    passwordPlaceholder: 'Administrative Passkey',
    languageToggle: 'ቋንቋ ቀይር (Amharic)',
    english: 'English',
    amharic: 'አማርኛ',
    securityNotice: 'Protected institutional platform. All administrative actions are cryptographically logged.',
  },
  am: {
    dashboard: 'ዳሽቦርድ',
    triage: 'ጥያቄዎችና ትዕዛዞች',
    catalog: 'ማውጫ እና ካታሎግ',
    members: 'አባላት',
    more: 'ተጨማሪ ዝርዝር',
    overview: 'አጠቃላይ እይታ',
    pendingInquiries: 'በሂደት ላይ ያሉ ጥያቄዎች',
    activeRSVPs: 'የተመዘገቡ ተሳታፊዎች',
    marketplaceOrders: 'የእደ-ጥበብ ትዕዛዞች',
    investorLeads: 'የኢንቨስትመንት ጥያቄዎች',
    registeredUsers: 'የዳያስፖራ አባላት',
    coordinators: 'የስራ ባልደረቦች',
    urgentAction: 'አፋጣኝ ምላሽ የሚሹ',
    allGood: 'ሁሉም ጥያቄዎች ተስተናግደዋል',
    searchPlaceholder: 'በስም ወይም በቁልፍ ቃል ይፈልጉ...',
    filterAll: 'ሁሉም',
    filterActive: 'በሂደት ላይ',
    filterConfirmed: 'የተረጋገጠ',
    filterCancelled: 'የተሰረዘ',
    save: 'አስቀምጥ',
    cancel: 'ሰርዝ',
    delete: 'አስወግድ',
    edit: 'አስተካክል',
    status: 'ሁኔታ',
    actions: 'ተግባራት',
    logout: 'ውጣ',
    signIn: 'ወደ ዳሊል አስተዳዳሪ ይግቡ',
    welcomeBack: 'እንኳን ደህና መጡ አስተባባሪ',
    emailPlaceholder: 'ይፋዊ የኢሜይል አድራሻ',
    passwordPlaceholder: 'የይለፍ ቃል',
    languageToggle: 'Switch to English',
    english: 'English',
    amharic: 'አማርኛ',
    securityNotice: 'የተጠበቀ የመንግስታዊና ተቋማዊ ስርዓት። ሁሉም ተግባራት ይመዘገባሉ።',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<AdminLanguage>('en');

  useEffect(() => {
    AsyncStorage.getItem('daleel_admin_lang').then((saved) => {
      if (saved === 'en' || saved === 'am') {
        setLangState(saved);
      }
    });
  }, []);

  const setLanguage = async (lang: AdminLanguage) => {
    setLangState(lang);
    await AsyncStorage.setItem('daleel_admin_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useAdminLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useAdminLanguage must be used within a LanguageProvider');
  }
  return context;
}
