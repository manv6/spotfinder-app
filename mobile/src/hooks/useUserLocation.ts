import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

import { LatLng } from '../geo';

export interface UserLocation {
  /** Current coordinate, or null until the first fix. */
  coords: LatLng | null;
  /** Reported horizontal accuracy in meters (null until known). */
  accuracy: number | null;
  /** Device heading in degrees (0 = north), or null if the compass is unavailable. */
  heading: number | null;
  /** Foreground-location permission status. */
  status: Location.PermissionStatus | 'pending';
  /** False when the user granted only "Approximate" (reduced) location on iOS 14+. */
  precise: boolean;
}

/**
 * Watches the device's real GPS position and compass heading. Safe on the
 * simulator: if permission is denied or no fix arrives, `coords` stays null;
 * with no magnetometer, `heading` stays null.
 */
export function useUserLocation(): UserLocation {
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [status, setStatus] = useState<Location.PermissionStatus | 'pending'>('pending');
  const [precise, setPrecise] = useState(true);

  useEffect(() => {
    let posSub: Location.LocationSubscription | undefined;
    let headSub: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      setStatus(perm.status);
      // iOS 14+: user may grant only "Approximate" location — that caps accuracy hard.
      setPrecise(perm.ios?.accuracy !== 'reduced');
      if (perm.status !== 'granted') return;

      posSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
        (loc) => {
          setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          setAccuracy(loc.coords.accuracy ?? null);
        },
      );

      // The heading/magnetometer stream isn't available on web — skip it there.
      if (Platform.OS !== 'web') {
        try {
          headSub = await Location.watchHeadingAsync((h) => {
            const value = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
            if (value != null && value >= 0) setHeading(value);
          });
        } catch {
          // no compass on this device — nav falls back to heading-of-travel
        }
      }
    })();

    return () => {
      cancelled = true;
      posSub?.remove();
      headSub?.remove();
    };
  }, []);

  return { coords, accuracy, heading, status, precise };
}
