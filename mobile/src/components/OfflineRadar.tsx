import { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { LatLng, bearingDegrees, distanceMeters, formatDistance } from '../geo';
import { colors } from '../theme';

interface Props {
  coords: LatLng | null;
  savedSpot: LatLng | null;
  heading: number | null;
}

const STEPS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
function niceRange(d: number): number {
  const target = Math.max(d * 1.2, 12);
  return STEPS.find((s) => s >= target) ?? STEPS[STEPS.length - 1];
}
const fmt = (m: number) => (m >= 1000 ? `${m / 1000}km` : `${m}m`);

/**
 * A network-free "radar" that plots your saved spot relative to you using the
 * real GPS bearing + distance. Oriented heading-up when a compass reading is
 * available (so the spot appears in the direction you should walk), else north-up.
 */
export default function OfflineRadar({ coords, savedSpot, heading }: Props) {
  const { width, height } = useWindowDimensions();
  const cx = width / 2;
  const cy = height * 0.4;
  const radius = Math.min(width * 0.42, height * 0.26);
  const headingUp = heading != null;

  const info = useMemo(() => {
    if (!coords || !savedSpot) return null;
    const dist = distanceMeters(coords, savedSpot);
    const brng = bearingDegrees(coords, savedSpot);
    const maxR = niceRange(dist);
    const rel = ((headingUp ? brng - (heading as number) : brng) * Math.PI) / 180;
    const r = Math.min(dist / maxR, 1) * radius;
    const sx = cx + Math.sin(rel) * r;
    const sy = cy - Math.cos(rel) * r;
    const lineLen = Math.hypot(sx - cx, sy - cy);
    const lineDeg = (Math.atan2(sy - cy, sx - cx) * 180) / Math.PI;
    const na = ((headingUp ? -(heading as number) : 0) * Math.PI) / 180;
    return {
      dist,
      maxR,
      sx,
      sy,
      lineLen,
      lineDeg,
      nx: cx + Math.sin(na) * radius,
      ny: cy - Math.cos(na) * radius,
    };
  }, [coords, savedSpot, heading, headingUp, cx, cy, radius]);

  const rings = [radius, radius * 0.66, radius * 0.33];

  return (
    <View style={styles.fill} pointerEvents="none">
      {rings.map((rr, i) => (
        <View key={i} style={[styles.ring, { width: rr * 2, height: rr * 2, borderRadius: rr, left: cx - rr, top: cy - rr }]} />
      ))}
      <View style={[styles.axis, { left: cx - radius, top: cy, width: radius * 2, height: 1 }]} />
      <View style={[styles.axis, { left: cx, top: cy - radius, width: 1, height: radius * 2 }]} />

      {info && (
        <>
          {/* range labels */}
          <Text style={[styles.rangeLabel, { left: cx + 6, top: cy - radius - 14 }]}>{fmt(info.maxR)}</Text>
          <Text style={[styles.rangeLabel, { left: cx + 6, top: cy - radius * 0.66 - 14 }]}>{fmt(Math.round(info.maxR * 0.66))}</Text>

          {/* line you → spot */}
          <View
            style={[
              styles.link,
              { left: cx, top: cy - 1, width: info.lineLen, transform: [{ rotate: `${info.lineDeg}deg` }], transformOrigin: 'left center' },
            ]}
          />

          {/* north marker */}
          <View style={[styles.nWrap, { left: info.nx - 9, top: info.ny - 9 }]}>
            <Text style={styles.nMark}>N</Text>
          </View>

          {/* saved spot */}
          <Text style={[styles.spotLabel, { left: info.sx - 50, top: info.sy - 26, width: 100 }]}>YOUR SPOT</Text>
          <View style={[styles.spotGlow, { left: info.sx - 16, top: info.sy - 16 }]} />
          <View style={[styles.spotDot, { left: info.sx - 6, top: info.sy - 6 }]} />
          <Text style={[styles.spotDist, { left: info.sx - 50, top: info.sy + 12, width: 100 }]}>
            {formatDistance(info.dist).value} {formatDistance(info.dist).unit}
          </Text>
        </>
      )}

      {/* YOU at center */}
      <View style={[styles.youOuter, { left: cx - 15, top: cy - 15 }]} />
      <View style={[styles.youDot, { left: cx - 6, top: cy - 6 }]} />
      <Text style={[styles.youLabel, { left: cx - 40, top: cy + 14, width: 80 }]}>YOU</Text>

      {!coords && <Text style={[styles.acquire, { top: cy + radius + 28 }]}>Acquiring GPS…</Text>}
      {!headingUp && info && <Text style={[styles.hint, { top: cy + radius + 28 }]}>north is up · walk to check your heading</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: colors.border },
  axis: { position: 'absolute', backgroundColor: colors.border, opacity: 0.5 },
  link: { position: 'absolute', height: 2, backgroundColor: colors.accent, opacity: 0.5, borderRadius: 1 },

  rangeLabel: { position: 'absolute', fontFamily: 'System', fontSize: 10, color: colors.textDim },

  nWrap: { position: 'absolute', width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  nMark: { fontSize: 11, fontWeight: '700', color: colors.red },

  youOuter: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.accent, opacity: 0.4 },
  youDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent, borderWidth: 2, borderColor: '#fff' },
  youLabel: { position: 'absolute', textAlign: 'center', fontSize: 10, fontWeight: '700', color: colors.accent },

  spotGlow: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: colors.green },
  spotDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.green },
  spotLabel: { position: 'absolute', textAlign: 'center', fontSize: 10, fontWeight: '700', color: colors.green },
  spotDist: { position: 'absolute', textAlign: 'center', fontFamily: 'System', fontSize: 11, color: colors.green },

  acquire: { position: 'absolute', left: 0, right: 0, textAlign: 'center', color: colors.textDim, fontSize: 13 },
  hint: { position: 'absolute', left: 0, right: 0, textAlign: 'center', color: colors.textDim, fontSize: 11 },
});
