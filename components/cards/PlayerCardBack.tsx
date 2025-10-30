// components/cards/PlayerCardBack.tsx
import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { colors } from '@/lib/theme';
import type { ImageSourcePropType } from 'react-native';

type Stats = {
  matches: number;
  wins: number;
  winRatePct: number; // 0..100
  streak: number; // days or matches, your call
  xp: number;
  eloDelta: number;
  last5: number[]; // newest first, 1=win,0=loss
};

export default function PlayerCardBack({
  bg,
  width,
  height,
  region,
  gender,
  stats,
  imageScale = 1.34,
  imageTranslateY = 10,
  locked = false,
}: {
  bg: ImageSourcePropType;
  width: number;
  height: number;
  region?: string | null;
  gender?: string;
  stats: Stats;
  imageScale?: number;
  imageTranslateY?: number;
  locked?: boolean;
}) {
  const last5 = (stats?.last5 ?? []).slice(0, 5);
  const winRate = Math.max(0, Math.min(100, Math.round(stats?.winRatePct ?? 0)));

  return (
    <ImageBackground
      source={bg}
      style={{ width, height, borderRadius: 24, overflow: 'hidden' }}
      imageStyle={{ borderRadius: 24, transform: [{ scale: imageScale }, { translateY: imageTranslateY }] }}
      resizeMode="cover"
    >
      <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />

      {/* Meta */}
      <View style={{ position: 'absolute', left: 14, right: 14, top: 14, flexDirection: 'row', gap: 8 }}>
        <View style={styles.tag}>
          <Ionicons name="map" size={12} color="#ffd79f" style={{ marginRight: 6 }} />
          <Text style={styles.tagText}>{region || '—'}</Text>
        </View>
        {gender ? (
          <View style={styles.tag}>
            <Ionicons name="male-female" size={12} color="#ffd79f" style={{ marginRight: 6 }} />
            <Text style={styles.tagText}>{gender}</Text>
          </View>
        ) : null}
      </View>

      {/* Stats grid */}
      <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
        {locked ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.45)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.14)',
              padding: 16,
              borderRadius: 16,
            }}
          >
            <Ionicons name="lock-closed" size={20} color="#ffd79f" />
            <Text style={{ color: '#ffd79f', fontWeight: '900', marginTop: 8 }}>Upgrade for insights</Text>
            <Text style={{ color: '#e6c8a4', marginTop: 6, textAlign: 'center' }}>
              Get win rate, streaks & ELO trends with Plus/Elite.
            </Text>
          </View>
        ) : (
          <>
            {/* Row 1 */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatBox label="Matches" value={stats.matches} icon="tennisball" />
              <StatBox label="Wins" value={stats.wins} icon="trophy" />
            </View>

            {/* Row 2 */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <StatBox label="Win %" value={`${winRate}%`} icon="analytics" />
              <StatBox label="Streak" value={`${stats.streak}d`} icon="flame" />
            </View>

            {/* XP + ELO delta */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <StatBox label="XP" value={stats.xp} icon="sparkles" />
              <StatBox
                label="Δ ELO"
                value={`${stats.eloDelta > 0 ? '+' : ''}${stats.eloDelta}`}
                icon={stats.eloDelta >= 0 ? 'trending-up' : 'trending-down'}
                valueColor={stats.eloDelta >= 0 ? colors.success : colors.danger}
              />
            </View>

            {/* Sparkline last 5 */}
            <View style={{ marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <Text style={{ color: '#fff', fontWeight: '800', marginBottom: 8 }}>Last 5</Text>
              <Sparkline points={last5} />
            </View>
          </>
        )}
      </View>
    </ImageBackground>
  );
}

function StatBox({
  label,
  value,
  icon,
  valueColor = '#ffd79f',
}: {
  label: string;
  value: string | number;
  icon: any;
  valueColor?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(12,12,14,0.55)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        padding: 12,
        borderRadius: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={14} color="#ffd79f" />
        <Text style={{ color: '#e6c8a4', fontWeight: '700' }}>{label}</Text>
      </View>
      <Text style={{ color: valueColor, fontWeight: '900', fontSize: 18, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 180;
  const h = 36;
  if (!points.length) {
    return <Text style={{ color: '#cfd3da' }}>No recent matches.</Text>;
  }
  // map 0..1 to y positions (invert for SVG top-left origin)
  const step = w / Math.max(1, points.length - 1);
  const poly = points
    .map((p, i) => {
      const y = p ? 6 : h - 6;
      const x = i * step;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Svg width={w} height={h}>
      <Polyline points={poly} stroke="#ffd79f" strokeWidth="2" fill="none" />
      {points.map((p, i) => {
        const y = p ? 6 : h - 6;
        const x = i * step;
        return <Circle key={i} cx={x} cy={y} r="3" fill="#ffe0b0" />;
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12,12,14,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagText: { color: '#ffd79f', fontWeight: '800' },
});
