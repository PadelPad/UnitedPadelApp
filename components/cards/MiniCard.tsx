// components/cards/MiniCard.tsx
import React from 'react';
import { ImageBackground, View, Text, Image, Pressable, type ImageSourcePropType } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/lib/theme';

type Props = {
  bg: ImageSourcePropType;
  username: string;
  region?: string | null;
  rating?: number | null;
  avatarUrl?: string | null;
  rank?: number;
  onPress?: () => void;

  onToggleExpand?: () => void;
  expanded?: boolean;

  clubLogoUrl?: string | null;
  clubTier?: 'basic' | 'plus' | 'elite' | null;
};

export default function MiniCard({
  bg,
  username,
  region,
  rating,
  avatarUrl,
  rank,
  onPress,
  onToggleExpand,
  expanded,
  clubLogoUrl,
  clubTier,
}: Props) {
  const rankBg =
    rank === 1
      ? 'rgba(107,69,10,0.7)'
      : rank === 2
      ? 'rgba(63,68,75,0.7)'
      : rank === 3
      ? 'rgba(90,58,47,0.7)'
      : 'rgba(22,27,34,0.7)';
  const rankFg = rank && rank <= 3 ? '#ffd79f' : '#d7d7e0';
  const isElite = clubTier === 'elite';

  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ width: '100%' }}>
      <ImageBackground
        source={bg}
        style={{ minHeight: 104, borderRadius: 16, overflow: 'hidden', justifyContent: 'center' }}
        imageStyle={{ borderRadius: 16 }}
        resizeMode="cover"
      >
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
          {/* Rank */}
          <View
            style={{
              minWidth: 38,
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: rankBg,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: rankFg, fontWeight: '900', fontSize: 12 }}>{rank ? `#${rank}` : '—'}</Text>
          </View>

          {/* Avatar */}
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: 46, height: 46, borderRadius: 999 }} />
          ) : (
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 999,
                backgroundColor: 'rgba(0,0,0,0.35)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={18} color="#f5f5f8" />
            </View>
          )}

          {/* Name + region + elite chip */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '800', fontSize: 16, flexShrink: 1 }}>
                {username || 'Player'}
              </Text>

              {isElite && clubLogoUrl ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(14,17,22,0.85)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 999,
                    paddingVertical: 3,
                    paddingLeft: 3,
                    paddingRight: 8,
                  }}
                >
                  <Image source={{ uri: clubLogoUrl }} style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#222' }} />
                  <Text style={{ color: '#ffd79f', fontWeight: '800', fontSize: 11 }}>Elite</Text>
                </View>
              ) : null}
            </View>

            <Text numberOfLines={1} style={{ color: '#dddde7', opacity: 0.85, fontSize: 12 }}>
              {region || '—'}
            </Text>
          </View>

          {/* Elo + caret */}
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#ffe0b0', fontWeight: '900', fontSize: 18 }}>{Math.round(rating ?? 1000)}</Text>
              <Text style={{ color: '#ffd79f', fontSize: 10, marginTop: 2 }}>ELO</Text>
            </View>

            {onToggleExpand ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Open details"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(14,17,22,0.85)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={18} color="#c4c4d2" />
              </Pressable>
            ) : null}
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}
