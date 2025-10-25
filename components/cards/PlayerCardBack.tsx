import React from 'react';
import {
  ImageBackground,
  View,
  Text,
  type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type PlayerCardBackProps = {
  bg: ImageSourcePropType;

  /** outer size + crop (match front to avoid layout jumps) */
  width: number;
  height: number;
  imageScale?: number;       // default 1.28
  imageTranslateY?: number;  // default 6

  /** header */
  region: string | null;
  gender?: string | null;

  /** core stats */
  stats: {
    matches: number;
    wins: number;
    winRatePct: number; // 0..100
    streak: number;
    xp: number;
    eloDelta: number;   // last delta
  };

  /** premium gate */
  locked?: boolean;

  /** last 5 Elo deltas (oldest -> newest or newest -> oldest accepted; we render newest at the RIGHT) */
  last5Deltas?: number[];
};

export default function PlayerCardBack({
  bg,
  width,
  height,
  region,
  gender,
  stats,
  locked = false,
  imageScale = 1.28,
  imageTranslateY = 6,
  last5Deltas = [],
}: PlayerCardBackProps) {
  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <View
      style={{
        width: '48%',
        backgroundColor: 'rgba(0,0,0,0.28)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,214,170,0.16)',
        marginBottom: 12,
      }}
    >
      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 6 }}>
        {label}
      </Text>
      <Text numberOfLines={1} style={{ color: '#f2d2a0', fontSize: 20, fontWeight: '800' }}>
        {value}
      </Text>
    </View>
  );

  // Normalize sparkline data: show exactly 5 bars (pad with zeros), newest on the RIGHT.
  const normalized: number[] = Array.from({ length: 5 }, (_, i) => {
    // If input is oldest->newest, take from end; if newest->oldest, also ends up correct by slicing.
    const src = last5Deltas.slice(-5); // last up to 5 items
    // left-to-right should be oldest->newest:
    return src[i - (5 - src.length)] ?? 0;
  });

  const maxAbs = Math.max(1, ...normalized.map((v) => Math.abs(v)));
  const BAR_MAX = 44; // px
  const BAR_MIN = 6;  // px (always visible)

  const toBarH = (v: number) => {
    const h = Math.round((Math.abs(v) / maxAbs) * BAR_MAX);
    return Math.max(BAR_MIN, h);
    // We draw baseline zero in the middle; sign is visualized by position (above/below line) + color
  };

  return (
    <ImageBackground
      source={bg}
      style={{ width, height, borderRadius: 22, overflow: 'hidden' }}
      imageStyle={{
        borderRadius: 22,
        transform: [{ scale: imageScale }, { translateY: imageTranslateY }],
      }}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.78)']}
        style={{ flex: 1, padding: 14 }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14, opacity: 0.9 }}>📍</Text>
          <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '800', fontSize: 15, flexShrink: 1 }}>
            {region ?? '—'}
          </Text>
          {gender ? (
            <Text style={{ color: 'rgba(255,255,255,0.75)' }}>· {gender}</Text>
          ) : null}
        </View>

        {/* Top stats grid (mirrors your left/right look) */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginTop: 12,
          }}
        >
          <Stat label="Matches" value={stats.matches} />
          <Stat label="Wins" value={stats.wins} />
          <Stat label="Win %" value={`${Math.round(stats.winRatePct)}%`} />
          <Stat label="Streak" value={stats.streak} />
          <Stat label="XP" value={stats.xp} />
          <Stat label="Elo Δ" value={(stats.eloDelta > 0 ? '+' : '') + Math.round(stats.eloDelta)} />
        </View>

        {/* Sparkline (Elo Δ last 5) */}
        <View
          style={{
            marginTop: 8,
            backgroundColor: 'rgba(0,0,0,0.22)',
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,214,170,0.14)',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
            <Text style={{ color: '#e8e0d6', fontWeight: '800' }}>Elo momentum (last 5)</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              Newest →
            </Text>
          </View>

          {/* Chart area */}
          <View
            style={{
              height: 90,
              position: 'relative',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 6,
            }}
          >
            {/* Zero baseline */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 45,
                height: 1,
                backgroundColor: 'rgba(235, 225, 205, 0.25)',
              }}
            />

            {/* Bars (newest right) */}
            {normalized.map((v, i) => {
              const h = toBarH(v);
              const isUp = v >= 0;
              return (
                <View
                  key={`bar-${i}`}
                  style={{
                    width: 14,
                    height: h,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    borderBottomLeftRadius: 4,
                    borderBottomRightRadius: 4,
                    backgroundColor: isUp ? 'rgba(90, 200, 80, 0.95)' : 'rgba(255, 95, 87, 0.95)',
                    borderWidth: 1,
                    borderColor: isUp ? 'rgba(60, 160, 50, 0.6)' : 'rgba(200, 70, 60, 0.6)',
                    transform: [
                      // position bar above or below zero line by translating from center
                      { translateY: isUp ? - (h / 2) : (h / 2) },
                    ],
                  }}
                />
              );
            })}
          </View>

          {/* Small legend */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Losses ↓</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Gains ↑</Text>
          </View>
        </View>

        {/* Lock overlay */}
        {locked && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 18,
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(24,24,24,0.95)',
                borderRadius: 16,
                padding: 16,
                width: '92%',
                borderWidth: 1,
                borderColor: 'rgba(255,214,170,0.2)',
              }}
            >
              <Text style={{ textAlign: 'center', fontSize: 22, marginBottom: 6 }}>🔒</Text>
              <Text
                style={{
                  color: '#FFD7A8',
                  fontWeight: '800',
                  fontSize: 16,
                  textAlign: 'center',
                }}
              >
                Plus & Elite unlock advanced insights
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  marginTop: 6,
                  textAlign: 'center',
                  fontSize: 14,
                }}
              >
                XP, Elo momentum, deeper stats, and the sparkline are premium.
              </Text>
            </View>
          </View>
        )}

        <Text
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.65)',
            fontSize: 12,
            marginTop: 10,
          }}
        >
          Tap to flip
        </Text>
      </LinearGradient>
    </ImageBackground>
  );
}
