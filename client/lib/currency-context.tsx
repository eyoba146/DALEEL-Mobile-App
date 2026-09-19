import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CurrencyCode = 'ETB' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  ratePerETB: number; // Multiply ETB amount by this to get target currency amount
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  ETB: {
    code: 'ETB',
    symbol: 'ETB',
    name: 'Ethiopian Birr',
    flag: '🇪🇹',
    ratePerETB: 1.0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    ratePerETB: 1 / 125, // ~$1 = 125 ETB
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    ratePerETB: 1 / 136, // ~€1 = 136 ETB
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    ratePerETB: 1 / 158, // ~£1 = 158 ETB
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    flag: '🇦🇪',
    ratePerETB: 1 / 34, // ~1 AED = 34 ETB
  },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  currencyMeta: CurrencyMeta;
  currencies: CurrencyMeta[];
  setCurrency: (code: CurrencyCode) => Promise<void>;
  convertFromETB: (amountInETB: number, targetCurrency?: CurrencyCode) => number;
  formatPrice: (amountInETB: number, showDual?: boolean) => string;
  formatDualPrice: (amountInETB: number) => { primary: string; secondary?: string };
}

const STORAGE_KEY = '@daleel_currency_pref_v1';

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>('ETB');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && stored && (stored in CURRENCIES)) {
          setCurrencyState(stored as CurrencyCode);
        }
      } catch (err) {
        console.warn('Failed to restore currency preference:', err);
      } finally {
        if (mounted) setIsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setCurrency = useCallback(async (code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, code);
    } catch (err) {
      console.warn('Failed to save currency preference:', err);
    }
  }, []);

  const currencyMeta = useMemo(() => CURRENCIES[currency] || CURRENCIES.ETB, [currency]);

  const convertFromETB = useCallback(
    (amountInETB: number, targetCurrency?: CurrencyCode): number => {
      const target = targetCurrency ? CURRENCIES[targetCurrency] : currencyMeta;
      return amountInETB * target.ratePerETB;
    },
    [currencyMeta]
  );

  const formatPrice = useCallback(
    (amountInETB: number, showDual: boolean = false): string => {
      if (currency === 'ETB') {
        return `${amountInETB.toLocaleString('en-US')} ETB`;
      }

      const converted = amountInETB * currencyMeta.ratePerETB;
      const primary = `${currencyMeta.symbol}${converted.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${currencyMeta.code}`;

      if (showDual) {
        return `${primary} (${amountInETB.toLocaleString('en-US')} ETB)`;
      }

      return primary;
    },
    [currency, currencyMeta]
  );

  const formatDualPrice = useCallback(
    (amountInETB: number): { primary: string; secondary?: string } => {
      if (currency === 'ETB') {
        return {
          primary: `${amountInETB.toLocaleString('en-US')} ETB`,
        };
      }

      const converted = amountInETB * currencyMeta.ratePerETB;
      const primary = `${currencyMeta.symbol}${converted.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${currencyMeta.code}`;

      const secondary = `${amountInETB.toLocaleString('en-US')} ETB`;

      return { primary, secondary };
    },
    [currency, currencyMeta]
  );

  const value = useMemo(
    () => ({
      currency,
      currencyMeta,
      currencies: Object.values(CURRENCIES),
      setCurrency,
      convertFromETB,
      formatPrice,
      formatDualPrice,
    }),
    [currency, currencyMeta, setCurrency, convertFromETB, formatPrice, formatDualPrice]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}
