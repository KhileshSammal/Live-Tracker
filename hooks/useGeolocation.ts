
import { useState, useEffect, useCallback } from 'react';
import { Coordinate } from '../types';

export const useGeolocation = (onUpdate: (data: { location: Coordinate; heading: number; speed: number }) => void) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        onUpdate({
          location: { lat: latitude, lng: longitude },
          heading: heading || 0,
          speed: speed || 0,
        });
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [onUpdate]);

  return { error };
};
