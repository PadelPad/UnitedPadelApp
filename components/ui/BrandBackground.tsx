// components/ui/BrandBackground.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/lib/theme';

const { width: W, height: H } = Dimensions.get('window');

function makeLoop(
  val: Animated.Value,
  { to = 1, duration = 2400, delay = 0, reverse = true } = {}
) {
  const seq = [
    Animated.timing(val, { toValue: to, duration, delay, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
  ];
  return Animated.loop(reverse ? Animated.sequence(seq) : seq[0]);
}

export default function BrandBackground() {
  // Two animated streaks
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;

  // Subtle parallax drift
  const drift = useRef(new Animated.Value(0)).current;

  // “Spark” particles (small glowing dots)
  const particles = useMemo(() => {
    // deterministic positions based on screen size
    const rows = 5;
    const cols = 5;
    const padX = W / (cols + 1);
    const padY = H / (rows + 2);
    const list: { top: number; left: number; delay: number }[] = [];
    let k = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          top: padY * (r + 1.2) + (r % 2 ? 10 : 0),
          left: padX * (c + 0.8),
          delay: 120 * (k++ % 10),
        });
      }
    }
    return list;
  }, []);

  const particleVals = useRef(particles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    makeLoop(a1, { delay: 0 }).start();
    makeLoop(a2, { delay: 900 }).start();

    // slow drift for depth
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    // flicker each particle
    particleVals.forEach((v, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: 1600, delay: particles[i].delay, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        ])
      ).start();
    });
  }, [a1, a2, drift, particleVals, particles]);

  // Opacities & slight translate for streaks
  const op1 = a1.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.45] });
  const op2 = a2.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.38] });

  const tx1 = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const tx2 = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Deep space base */}
      <LinearGradient
        colors={['#0b0e13', '#0c1016', '#0b0e13']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle radial glow behind content center */}
      <LinearGradient
        colors={['rgba(255,106,0,0.08)', 'rgba(255,106,0,0.02)', 'transparent']}
        locations={[0, 0.4, 1]}
        style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.5, y: 0.9 }}
      />

      {/* Diagonal streak #1 */}
      <Animated.View
        style={[
          styles.streakWrap,
          {
            top: -H * 0.18,
            left: -W * 0.35,
            transform: [{ rotate: '-28deg' }, { translateX: tx1 }],
            opacity: op1,
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', colors.primary, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.streak}
        />
      </Animated.View>

      {/* Diagonal streak #2 */}
      <Animated.View
        style={[
          styles.streakWrap,
          {
            bottom: -H * 0.2,
            right: -W * 0.28,
            transform: [{ rotate: '29deg' }, { translateX: tx2 }],
            opacity: op2,
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', colors.primary, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.streak}
        />
      </Animated.View>

      {/* Particle grid (tiny glowing dots) */}
      {particles.map((p, i) => {
        const flicker = particleVals[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0.12, 0.42],
        });
        return (
          <Animated.View
            key={`spark-${i}`}
            style={[
              styles.spark,
              {
                top: p.top,
                left: p.left,
                opacity: flicker,
              },
            ]}
          />
        );
      })}

      {/* Vignettes to help content contrast */}
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']}
        style={styles.topVignette}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
        style={styles.bottomVignette}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
}

const STREAK_W = W * 1.7;
const STREAK_H = 130;

const styles = StyleSheet.create({
  streakWrap: {
    position: 'absolute',
    width: STREAK_W,
    height: STREAK_H,
  },
  streak: {
    flex: 1,
    borderRadius: 100,
  },
  spark: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  topVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 140,
  },
  bottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
});
