import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collectDeviceSignals,
  evaluateDeviceAccess,
  type DeviceAccessEvaluation,
  type DeviceSignals,
} from '../utils/devicePolicy';

interface DeviceAccessContextType {
  evaluation: DeviceAccessEvaluation;
  reevaluate: () => void;
  signals: DeviceSignals;
}

const DeviceAccessContext = createContext<DeviceAccessContextType | null>(null);

export const DeviceAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous initial evaluation on mount to prevent any brief flash of protected UI
  const [signals, setSignals] = useState<DeviceSignals>(() => collectDeviceSignals());
  const [evaluation, setEvaluation] = useState<DeviceAccessEvaluation>(() =>
    evaluateDeviceAccess(collectDeviceSignals())
  );

  const reevaluate = useCallback(() => {
    const currentSignals = collectDeviceSignals();
    const currentEvaluation = evaluateDeviceAccess(currentSignals);
    setSignals(currentSignals);
    setEvaluation(currentEvaluation);
  }, []);

  useEffect(() => {
    // Initial verification on mount
    reevaluate();

    // 1. Viewport resize listener (debounced with requestAnimationFrame)
    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        reevaluate();
        rafId = null;
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // 2. Orientation change listeners (both orientationchange and screen.orientation API)
    const handleOrientation = () => {
      // Small timeout to allow screen dimensions to settle across mobile OSes
      setTimeout(reevaluate, 50);
    };

    window.addEventListener('orientationchange', handleOrientation, { passive: true });

    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientation);
    }

    // Media query listener for orientation changes
    let landscapeMql: MediaQueryList | null = null;
    if (window.matchMedia) {
      landscapeMql = window.matchMedia('(orientation: landscape)');
      if (landscapeMql.addEventListener) {
        landscapeMql.addEventListener('change', handleOrientation);
      } else if ((landscapeMql as any).addListener) {
        (landscapeMql as any).addListener(handleOrientation);
      }
    }

    // 3. Back-Forward Cache (bfcache) restoration listener (Rule 6)
    const handlePageShow = (event: PageTransitionEvent) => {
      // If restored from bfcache or standard page transition, re-evaluate device suitability
      if (event.persisted) {
        reevaluate();
      } else {
        reevaluate();
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    // 4. Tab visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        reevaluate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientation);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientation);
      }
      if (landscapeMql) {
        if (landscapeMql.removeEventListener) {
          landscapeMql.removeEventListener('change', handleOrientation);
        } else if ((landscapeMql as any).removeListener) {
          (landscapeMql as any).removeListener(handleOrientation);
        }
      }
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [reevaluate]);

  const value = useMemo(
    () => ({
      evaluation,
      reevaluate,
      signals,
    }),
    [evaluation, reevaluate, signals]
  );

  return <DeviceAccessContext.Provider value={value}>{children}</DeviceAccessContext.Provider>;
};

export const useDeviceAccess = (): DeviceAccessContextType => {
  const context = useContext(DeviceAccessContext);
  if (!context) {
    throw new Error('useDeviceAccess must be used within a DeviceAccessProvider');
  }
  return context;
};
