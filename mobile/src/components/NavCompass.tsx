import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '../theme';

interface Props {
  /** Degrees to rotate the arrow (0 = pointing up toward the "N" mark). */
  angle: number;
}

/** The circular compass with an arrow that rotates toward the saved spot. */
export default function NavCompass({ angle }: Props) {
  const rot = useSharedValue(angle);

  useEffect(() => {
    rot.value = withTiming(angle, { duration: 250 });
  }, [angle]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.outer}>
        <Text style={styles.n}>N</Text>
        <Animated.View style={[styles.arrowWrap, arrowStyle]}>
          <View style={styles.triangle} />
          <View style={styles.shaft} />
        </Animated.View>
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const SIZE = 120;
const CENTER = SIZE / 2;

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignSelf: 'center', marginBottom: 10 },
  outer: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  n: { position: 'absolute', top: 6, fontFamily: 'System', fontSize: 9, color: colors.textDim },
  arrowWrap: { position: 'absolute', width: SIZE, height: SIZE, alignItems: 'center' },
  triangle: {
    position: 'absolute',
    top: CENTER - 44,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.accent,
  },
  shaft: {
    position: 'absolute',
    top: CENTER - 28,
    width: 3,
    height: 28,
    backgroundColor: colors.accent,
    opacity: 0.6,
    borderRadius: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
