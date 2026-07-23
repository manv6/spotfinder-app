import { useCallback, useRef, useState } from 'react';

import { LatLng } from '../geo';

export interface PinpointState {
  /** True while a settle-and-sample pass is running. */
  pinpointing: boolean;
  /** Best (lowest) accuracy seen so far during the current pass, in meters. */
  bestAccuracy: number | null;
}

/**
 * "Pinpoint" a spot: instead of trusting one instantaneous GPS reading, watch the
 * live stream for a few seconds and keep the fix with the smallest accuracy radius.
 * Standing still, this measurably tightens the saved point vs a single sample.
 * Resolves early if a very good fix (≤5 m) arrives.
 */
export function usePinpoint(coords: LatLng | null, accuracy: number | null) {
  const [state, setState] = useState<PinpointState>({ pinpointing: false, bestAccuracy: null });
  const latest = useRef<{ coords: LatLng | null; accuracy: number | null }>({ coords, accuracy });
  latest.current = { coords, accuracy };

  const pinpoint = useCallback((durationMs = 4000, goodEnough = 5): Promise<LatLng | null> => {
    return new Promise((resolve) => {
      const start = latest.current;
      let best = start.coords ? { coords: start.coords, accuracy: start.accuracy ?? 9999 } : null;
      setState({ pinpointing: true, bestAccuracy: best?.accuracy ?? null });
      const startedAt = Date.now();

      const timer = setInterval(() => {
        const cur = latest.current;
        if (cur.coords && (cur.accuracy ?? 9999) < (best?.accuracy ?? 9999)) {
          best = { coords: cur.coords, accuracy: cur.accuracy ?? 9999 };
          setState({ pinpointing: true, bestAccuracy: best.accuracy });
        }
        const done = Date.now() - startedAt >= durationMs || (best != null && best.accuracy <= goodEnough);
        if (done) {
          clearInterval(timer);
          setState({ pinpointing: false, bestAccuracy: best?.accuracy ?? null });
          resolve(best?.coords ?? null);
        }
      }, 400);
    });
  }, []);

  return { ...state, pinpoint };
}
