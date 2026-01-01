
import { useEffect, useRef } from 'react';

export const useWakeLock = () => {
  const wakeLock = useRef<any>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          // Attempting to request the wake lock
          wakeLock.current = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock active');
          
          wakeLock.current.addEventListener('release', () => {
            console.log('Wake Lock was released');
          });
        } catch (err: any) {
          // Gracefully handling the Permission Policy error reported by user
          if (err.name === 'NotAllowedError') {
            console.warn('Wake Lock is disallowed by permissions policy or user preference.');
          } else {
            console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
          }
        }
      }
    };

    // Request on mount
    requestWakeLock();

    const handleVisibilityChange = async () => {
      if (wakeLock.current !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock.current) {
        wakeLock.current.release().catch(() => {});
        wakeLock.current = null;
      }
    };
  }, []);
};
