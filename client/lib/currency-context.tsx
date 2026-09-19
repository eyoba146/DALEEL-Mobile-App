import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { currencyApi } from './api';

export type CurrencyCode = 'ETB' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  name: string;
  ratePerETB: number; // Multiply ETB amount by this to get target currency amount
}

export const BASE_CURRENCIES: Record<CurrencyCode, Omit<CurrencyMeta, 'ratePerETB'>> = {
  ETB: {
    code: 'ETB',
    symbol: 'ETB',
    name: 'Ethiopian Birr',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
  },
};

// Fallback rates if offline before first live fetch
export const DEFAULT_RATES: Record<CurrencyCode, number> = {
  ETB: 1.0,
  USD: 0.006165, // ~162.2 ETB
  EUR: 0.005307, // ~188.4 ETB
  GBP: 0.004611, // ~216.9 ETB
  AED: 0.022724, // ~44.0 ETB
};

interface CurrencyContextType {
  currency: CurrencyCode;
  currencyMeta: CurrencyMeta;
  currencies: CurrencyMeta[];
  rates: Record<CurrencyCode, number>;
  lastUpdated: string | null;
  isLoadingRates: boolean;
  refreshRates: () => Promise<void>;
  setCurrency: (code: CurrencyCode) => Promise<void>;
  convertFromETB: (amountInETB: number, targetCurrency?: CurrencyCode) => number;
  formatPrice: (amountInETB: number, showDual?: boolean) => string;
  formatDualPrice: (amountInETB: number) => { primary: string; secondary?: string };
}

const STORAGE_PREF_KEY = '@daleel_currency_pref_v2';
const STORAGE_RATES_KEY = '@daleel_live_rates_v2';

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>('ETB');
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(DEFAULT_RATES);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Live Exchange Rate Fetcher
  const fetchLiveRates = useCallback(async () => {
    setIsLoadingRates(true);
    try {
      let rawRates: Record<string, number> | null = null;
      let updateTime: string | null = null;

      // 1. Try local backend first
      try {
        const backendRes = await currencyApi.getRates();
        if (backendRes?.rates) {
          rawRates = backendRes.rates;
          updateTime = backendRes.lastUpdated || new Date().toISOString();
        }
      } catch {
        // Backend not reachable, fall back to direct public endpoint
      }

      // 2. Direct public endpoint fallback if backend was unavailable
      if (!rawRates) {
        const directRes = await fetch('https://open.er-api.com/v6/latest/ETB');
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData?.rates) {
            rawRates = directData.rates;
            updateTime = directData.time_last_update_utc || new Date().toISOString();
          }
        }
      }

      if (rawRates) {
        const updatedRates: Record<CurrencyCode, number> = {
          ETB: 1.0,
          USD: Number(rawRates.USD) || DEFAULT_RATES.USD,
          EUR: Number(rawRates.EUR) || DEFAULT_RATES.EUR,
          GBP: Number(rawRates.GBP) || DEFAULT_RATES.GBP,
          AED: Number(rawRates.AED) || DEFAULT_RATES.AED,
        };

        setRates(updatedRates);
        setLastUpdated(updateTime || new Date().toISOString());

        // Cache live rates locally for instant cold starts
        await AsyncStorage.setItem(
          STORAGE_RATES_KEY,
          JSON.stringify({ rates: updatedRates, lastUpdated: updateTime })
        );
      }
    } catch (err) {
      console.warn('Unable to refresh live currency rates, using cached:', err);
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  // Restore user currency preference and cached rates on mount, then trigger live refresh
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedPref, storedRates] = await Promise.all([
          AsyncStorage.getItem(STORAGE_PREF_KEY),
          AsyncStorage.getItem(STORAGE_RATES_KEY),
        ]);

        if (mounted) {
          if (storedPref && storedPref in BASE_CURRENCIES) {
            setCurrencyState(storedPref as CurrencyCode);
          }
          if (storedRates) {
            const parsed = JSON.parse(storedRates);
            if (parsed?.rates) {
              setRates(parsed.rates);
              if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to restore currency data:', err);
      }

      // Always fetch live rates immediately on launch to keep it 100% up to date
      if (mounted) {
        fetchLiveRates();
      }
    })();

    // Refresh live rates every 15 minutes while app is active
    const interval = setInterval(() => {
      fetchLiveRates();
    }, 15 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchLiveRates]);

  const setCurrency = useCallback(async (code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      await AsyncStorage.setItem(STORAGE_PREF_KEY, code);
    } catch (err) {
      console.warn('Failed to save currency preference:', err);
    }
  }, []);

  const currencies: CurrencyMeta[] = useMemo(() => {
    return (Object.keys(BASE_CURRENCIES) as CurrencyCode[]).map((code) => ({
      ...BASE_CURRENCIES[code],
      ratePerETB: rates[code] || DEFAULT_RATES[code],
    }));
  }, [rates]);

  const currencyMeta: CurrencyMeta = useMemo(() => {
    const base = BASE_CURRENCIES[currency] || BASE_CURRENCIES.ETB;
    return {
      ...base,
      ratePerETB: rates[currency] || DEFAULT_RATES[currency],
    };
  }, [currency, rates]);

  const convertFromETB = useCallback(
    (amountInETB: number, targetCurrency?: CurrencyCode): number => {
      const targetRate = targetCurrency ? (rates[targetCurrency] || DEFAULT_RATES[targetCurrency]) : currencyMeta.ratePerETB;
      return amountInETB * targetRate;
    },
    [currencyMeta, rates]
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
      currencies,
      rates,
      lastUpdated,
      isLoadingRates,
      refreshRates: fetchLiveRates,
      setCurrency,
      convertFromETB,
      formatPrice,
      formatDualPrice,
    }),
    [
      currency,
      currencyMeta,
      currencies,
      rates,
      lastUpdated,
      isLoadingRates,
      fetchLiveRates,
      setCurrency,
      convertFromETB,
      formatPrice,
      formatDualPrice,
    ]
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
