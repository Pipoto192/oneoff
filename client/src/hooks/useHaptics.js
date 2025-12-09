'use client';
import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook for haptic feedback on mobile devices
 * Falls back gracefully on web/unsupported devices
 */
export function useHaptics() {
  const vibrate = useCallback((pattern = [50]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightImpact = useCallback(() => {
    vibrate([10]);
  }, [vibrate]);

  const mediumImpact = useCallback(() => {
    vibrate([25]);
  }, [vibrate]);

  const heavyImpact = useCallback(() => {
    vibrate([50]);
  }, [vibrate]);

  const success = useCallback(() => {
    vibrate([30, 50, 30]);
  }, [vibrate]);

  const error = useCallback(() => {
    vibrate([100, 50, 100]);
  }, [vibrate]);

  const warning = useCallback(() => {
    vibrate([50, 30, 50]);
  }, [vibrate]);

  const selection = useCallback(() => {
    vibrate([5]);
  }, [vibrate]);

  return {
    lightImpact,
    mediumImpact,
    heavyImpact,
    success,
    error,
    warning,
    selection,
    vibrate
  };
}

export default useHaptics;
