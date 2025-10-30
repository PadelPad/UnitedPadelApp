// components/ui/LevelBar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useXpStore } from '@/lib/state/xpStore';
import { levelFromXp } from '@/lib/gamification';
import { colors } from '@/lib/theme';

export default function LevelBar({ compact = false }: { compact?: boolean }) {
  const xp = useXpStore((s) => s.xp);
  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(xp);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 600, useNativeDriver: false }).start();
  }, [progress]);

  const pct = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.wrap, compact && { padding: 10 }]}>
      <View style={styles.row}>
        <Text style={styles.level}>Lv {level}</Text>
        <Text style={styles.xpText}>
          {xp - currentLevelXp} / {nextLevelXp - currentLevelXp} XP
        </Text>
      </View>
      <View style={styles.bar}>
        <Animated.View style={[styles.fill, { width: pct }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#0f141b',
    borderWidth: 1,
    borderColor: '#222a35',
    borderRadius: 12,
    padding: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  level: { color: '#fff', fontWeight: '900' },
  xpText: { color: '#cdd2db', fontWeight: '700' },
  bar: {
    height: 10,
    backgroundColor: '#151b24',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
});
