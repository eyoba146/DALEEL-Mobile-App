export type SupportedLanguage = 'en' | 'am' | 'om' | 'ar';

export type LanguageMeta = {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  badge: string;
  isRTL?: boolean;
};

export const LANGUAGES: LanguageMeta[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    badge: 'EN',
    isRTL: false,
  },
  {
    code: 'am',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    badge: 'AM',
    isRTL: false,
  },
  {
    code: 'om',
    name: 'Oromiffa',
    nativeName: 'Afaan Oromoo',
    badge: 'OM',
    isRTL: false,
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    badge: 'AR',
    isRTL: true,
  },
];
