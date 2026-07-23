import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import NavCompass from './NavCompass';
import { formatDistance } from '../geo';
import { colors } from '../theme';

export type Phase = 'idle' | 'saved' | 'nav';
export type MapStyle = 'simple' | 'satellite' | '3d';

export interface NavInfo {
  dist: number;
  arrowAngle: number;
  hint: string;
  arrived: boolean;
}

const STYLE_OPTIONS: { id: MapStyle; icon: string; label: string }[] = [
  { id: 'simple', icon: '🗺', label: 'Map' },
  { id: 'satellite', icon: '🛰', label: 'Sat' },
  { id: '3d', icon: '🏙', label: '3D' },
];

interface Props {
  ribbon: { color: string; text: string; blink: boolean };
  phase: Phase;
  nav: NavInfo | null;
  hasCoords: boolean;
  offline: boolean;
  precise: boolean;
  pinpointing: boolean;
  pinpointAccuracy: number | null;
  mapStyle: MapStyle;
  onSetStyle: (s: MapStyle) => void;
  onMark: () => void;
  onNavigate: () => void;
  onClear: () => void;
  onStop: () => void;
  onLocate: () => void;
}

/**
 * All the chrome floating over the map: the status ribbon, the locate + map-style
 * controls, and the bottom action panel + navigation HUD. Shared by the native
 * (react-native-maps) and web (MapLibre) map screens.
 */
export default function MapOverlay({
  ribbon,
  phase,
  nav,
  hasCoords,
  offline,
  precise,
  pinpointing,
  pinpointAccuracy,
  mapStyle,
  onSetStyle,
  onMark,
  onNavigate,
  onClear,
  onStop,
  onLocate,
}: Props) {
  const insets = useSafeAreaInsets();
  const dist = nav ? formatDistance(nav.dist) : { value: '—', unit: '' };
  const fmtAcc = (a: number) => (a < 10 ? a.toFixed(1) : Math.round(a).toString());

  return (
    <>
      {/* Top status ribbon + offline banner */}
      <View style={[styles.topbar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.ribbon}>
          <BlinkDot color={ribbon.color} blink={ribbon.blink} />
          <Text style={styles.ribbonText}>{ribbon.text}</Text>
        </View>
        {offline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineIcon}>⚠</Text>
            <Text style={styles.offlineText}>
              No internet — <Text style={styles.offlineStrong}>offline compass mode</Text>. The map can't load, but your
              GPS, saved spot & distance still work.
            </Text>
          </View>
        )}
        {!precise && (
          <View style={styles.preciseBanner}>
            <Text style={styles.preciseIcon}>◎</Text>
            <Text style={styles.offlineText}>
              <Text style={styles.preciseStrong}>Precise Location is off</Text> — accuracy is badly limited. Turn on
              Precise Location in Settings ▸ SpotFinder ▸ Location.
            </Text>
          </View>
        )}
      </View>

      {/* Floating controls: locate + (online) map style */}
      <View style={[styles.controls, { top: insets.top + 64 }]}>
        <Pressable style={styles.ctrlBtn} onPress={onLocate} hitSlop={6}>
          <Text style={styles.ctrlIcon}>◎</Text>
        </Pressable>
        {!offline && (
          <View style={styles.styleGroup}>
            {STYLE_OPTIONS.map((o) => {
              const active = mapStyle === o.id;
              return (
                <Pressable
                  key={o.id}
                  style={[styles.styleBtn, active && styles.styleBtnActive]}
                  onPress={() => onSetStyle(o.id)}
                  hitSlop={4}
                >
                  <Text style={styles.styleIcon}>{o.icon}</Text>
                  <Text style={[styles.styleLabel, active && styles.styleLabelActive]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Bottom panel */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + 20 }]}>
        {phase === 'nav' && nav && (
          <View style={styles.navHud}>
            <NavCompass angle={nav.arrowAngle} />
            <Text style={styles.navDist}>
              {dist.value}
              <Text style={styles.navDistUnit}> {dist.unit}</Text>
            </Text>
            <Text style={styles.navSub}>to your saved spot</Text>
            <Text style={styles.navHint}>{nav.arrived ? "you're here!" : nav.hint}</Text>
            {nav.arrived && (
              <View style={styles.arrived}>
                <Text style={styles.arrivedText}>✓ You've arrived</Text>
              </View>
            )}
          </View>
        )}

        {(phase === 'saved' || phase === 'nav') && (
          <View style={styles.savedBar}>
            <View style={styles.savedDot} />
            <Text style={styles.savedLabel}>Spot saved</Text>
            {nav && <Text style={styles.savedDetail}>{formatDistance(nav.dist).value} {formatDistance(nav.dist).unit} away</Text>}
          </View>
        )}

        {phase === 'idle' && (
          <Pressable
            style={[styles.btn, styles.btnAccent, (!hasCoords || pinpointing) && styles.btnDisabled]}
            onPress={onMark}
            disabled={!hasCoords || pinpointing}
          >
            <Text style={styles.btnAccentText}>
              {pinpointing
                ? `◎  Pinpointing…${pinpointAccuracy != null ? `  ±${fmtAcc(pinpointAccuracy)} m` : ''}`
                : '◎  Mark My Spot'}
            </Text>
          </Pressable>
        )}

        {phase === 'saved' && (
          <View style={styles.btnRow}>
            <Pressable style={[styles.btn, styles.btnGreen, { flex: 1 }]} onPress={onNavigate}>
              <Text style={styles.btnGreenText}>➤  Navigate Back</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnGhost, { width: 52 }]} onPress={onClear}>
              <Text style={styles.btnGhostText}>✕</Text>
            </Pressable>
          </View>
        )}

        {phase === 'nav' && (
          <Pressable style={[styles.btn, styles.btnRed]} onPress={onStop}>
            <Text style={styles.btnRedText}>Stop Navigation</Text>
          </Pressable>
        )}
      </View>
    </>
  );
}

/** Small status dot that optionally blinks. */
function BlinkDot({ color, blink }: { color: string; blink?: boolean }) {
  const op = useSharedValue(1);
  useEffect(() => {
    op.value = blink ? withRepeat(withTiming(0.35, { duration: 800 }), -1, true) : 1;
  }, [blink]);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return <Animated.View style={[styles.blinkDot, { backgroundColor: color, boxShadow: `0px 0px 5px ${color}` }, style]} />;
}

const styles = StyleSheet.create({
  topbar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, alignItems: 'flex-start', pointerEvents: 'box-none' },
  ribbon: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blinkDot: { width: 7, height: 7, borderRadius: 4 },
  ribbonText: { color: colors.textMid, fontSize: 12 },

  offlineBanner: {
    marginTop: 8,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,146,60,0.12)',
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  offlineIcon: { fontSize: 14, color: colors.orange },
  offlineText: { flex: 1, color: colors.text, fontSize: 11, lineHeight: 15 },
  offlineStrong: { color: colors.orange, fontWeight: '700' },

  preciseBanner: {
    marginTop: 8,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  preciseIcon: { fontSize: 14, color: colors.red },
  preciseStrong: { color: colors.red, fontWeight: '700' },

  controls: { position: 'absolute', right: 16, gap: 10, pointerEvents: 'box-none', alignItems: 'flex-end' },
  ctrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlIcon: { fontSize: 20, color: colors.text },
  styleGroup: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  styleBtn: { width: 44, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  styleBtnActive: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent },
  styleIcon: { fontSize: 16 },
  styleLabel: { fontSize: 9, color: colors.textDim, marginTop: 1 },
  styleLabelActive: { color: colors.accent },

  panel: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, pointerEvents: 'box-none' },
  navHud: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  navDist: { fontFamily: 'System', fontSize: 40, fontWeight: '500', letterSpacing: -2, color: colors.text },
  navDistUnit: { fontSize: 18, color: colors.textDim, fontWeight: '400' },
  navSub: { fontSize: 12, color: colors.textDim, marginTop: 2 },
  navHint: { fontSize: 11, color: colors.textDim, marginTop: 6 },
  arrived: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 10,
  },
  arrivedText: { color: colors.green, fontWeight: '600', fontSize: 14 },

  savedBar: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  savedLabel: { color: colors.textDim, fontSize: 11 },
  savedDetail: { color: colors.green, fontSize: 11, marginLeft: 'auto' },

  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { paddingVertical: 15, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnAccent: { backgroundColor: colors.accent },
  btnAccentText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
  btnGreen: { backgroundColor: colors.green },
  btnGreenText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
  btnGhost: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  btnRed: { backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  btnRedText: { color: colors.red, fontWeight: '600', fontSize: 15 },
});
