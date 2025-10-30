// components/ui/BackgroundOrbs.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function BackgroundOrbs() {
  const t1 = useRef(new Animated.Value(0)).current;
  const t2 = useRef(new Animated.Value(0)).current;
  const t3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, delay: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: dur, delay, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ).start();
    loop(t1, 0, 6000);
    loop(t2, 600, 7000);
    loop(t3, 1200, 7500);
  }, [t1, t2, t3]);

  const styleFor = (v: Animated.Value, dx: number, dy: number, s0 = 0.94, s1 = 1.08) => ({
    transform: [
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [s0, s1] }) },
    ],
    opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.22, 0.4, 0.22] }),
  });

  return (
    <View pointerEvents="none" style={styles.root}>
      <Animated.View style={[styles.orb, { top: -60, left: -30 }, styleFor(t1, 24, 18)]}>
        <LinearGradient colors={['rgba(255,106,0,0.22)', 'rgba(255,106,0,0.05)']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.orb, { bottom: -80, right: -40 }, styleFor(t2, -26, -20, 0.92, 1.1)]}>
        <LinearGradient colors={['rgba(255,170,0,0.2)', 'rgba(255,170,0,0.05)']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.small, { top: 120, right: -20 }, styleFor(t3, -18, 14, 0.96, 1.06)]}>
        <LinearGradient colors={['rgba(255,220,160,0.18)', 'rgba(255,220,160,0.05)']} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  orb: { position: 'absolute', width: 260, height: 260, borderRadius: 130, overflow: 'hidden' },
  small: { position: 'absolute', width: 160, height: 160, borderRadius: 80, overflow: 'hidden' },
});
