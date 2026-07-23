import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * True when the internet is unreachable (no connection, or connected to a network
 * that can't actually reach the internet — common in packed venues). `isInternetReachable`
 * is null while unknown, which we treat as online so we don't flash the offline view on boot.
 */
export function useIsOffline(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => {
      setOffline(s.isConnected === false || s.isInternetReachable === false);
    });
    return () => unsub();
  }, []);

  return offline;
}
