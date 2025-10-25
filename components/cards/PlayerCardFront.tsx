import React, { useEffect } from 'react';
import {
  ImageBackground,
  View,
  Text,
  Image,
  type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type ClubTier = 'basic' | 'plus' | 'elite' | null | undefined;
type Variant = 'default' | 'podium';

type Props = {
  bg: ImageSourcePropType;
  width: number;
  height: number;

  /** default card content */
  rank?: number;
  username?: string;
  region?: string | null;
  rating?: number | null;
  avatarUrl?: string | null;

  /** visual options */
  shine?: boolean;
  imageScale?: number;       // background zoom
  imageTranslateY?: number;  // background crop

  /** elite flair */
  clubLogoUrl?: string | null;
  clubTier?: ClubTier;

  /** Layout preset */
  variant?: Variant; // 'podium' centers avatar and keeps text compact
};

const ALinear = Animated.createAnimatedComponent(LinearGradient);

export default function PlayerCardFront({
  bg,
  width,
  height,
  rank,
  username = 'Player',
  region,
  rating,
  avatarUrl,
  shine,
  imageScale = 1.22,
  imageTranslateY = 6,
  clubLogoUrl,
  clubTier,
  variant = 'default',
}: Props) {
  const isElite = clubTier === 'elite';

  // animated “shine”
  const x = useSharedValue(-width);
  useEffect(() => {
    if (!shine) return;
    x.value = -width;
    x.value = withRepeat(withTiming(width * 1.8, { duration: 2200 }), -1, false);
  }, [shine, width, x]);

  const shineStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: -height * 0.1,
    left: x.value,
    width: width * 0.7,
    height: height * 1.2,
    transform: [{ rotateZ: '18deg' }],
    opacity: 0.9,
  }));

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
      {shine ? (
        <ALinear
          colors={[
            'rgba(255,255,255,0.0)',
            'rgba(255,236,200,0.35)',
            'rgba(255,255,255,0.0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={shineStyle}
        />
      ) : null}

      {/* rank + elite chip */}
      <View
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          flexDirection: 'row',
          gap: 6,
        }}
        pointerEvents="none"
      >
        {typeof rank === 'number' ? (
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.52)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.15)',
              borderRadius: 14,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#ffd79f', fontWeight: '900' }}>#{rank}</Text>
          </View>
        ) : null}

        {isElite && clubLogoUrl ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(0,0,0,0.55)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.15)',
              borderRadius: 14,
              paddingVertical: 3,
              paddingLeft: 3,
              paddingRight: 8,
            }}
          >
            <Image
              source={{ uri: clubLogoUrl }}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#222',
              }}
            />
            <Text style={{ color: '#ffd79f', fontWeight: '800', fontSize: 11 }}>
              Elite
            </Text>
          </View>
        ) : null}
      </View>

      {variant === 'podium' ? (
        // Centered avatar + compact stats for podium tiles
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 14 }}>
          <View
            style={{
              position: 'absolute',
              top: height * 0.34,
              alignSelf: 'center',
              width: Math.min(88, width * 0.32),
              height: Math.min(88, width * 0.32),
              borderRadius: 999,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.25)',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowRadius: 14,
              shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 6 },
              backgroundColor: 'rgba(0,0,0,0.18)',
            }}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person" size={28} color="#eee" />
              </View>
            )}
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={{ width: '100%', paddingHorizontal: 14, paddingTop: 34, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
              }}
            >
              <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '900', fontSize: 16, flex: 1 }}>
                {username}
              </Text>
              {typeof rating === 'number' ? (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderRadius: 14,
                    marginLeft: 10,
                  }}
                >
                  <Text style={{ color: '#ffe0b0', fontWeight: '900' }}>{Math.round(rating)}</Text>
                  <Text style={{ color: '#ffd79f', fontSize: 10, textAlign: 'center' }}>ELO</Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>
        </View>
      ) : (
        // Default (list & modal) – avatar left, text right, ELO to the end
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.7)']}
          style={{ flex: 1, padding: 16, justifyContent: 'flex-end' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* avatar */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.18)',
                overflow: 'hidden',
                backgroundColor: 'rgba(0,0,0,0.25)',
              }}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={28} color="#e7e7ee" />
                </View>
              )}
            </View>

            {/* name + region */}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>
                {username}
              </Text>
              <Text numberOfLines={1} style={{ color: '#e2e2ea', opacity: 0.85, fontSize: 13 }}>
                {region || '—'}
              </Text>
            </View>

            {/* elo */}
            {typeof rating === 'number' ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#ffe0b0', fontWeight: '900', fontSize: 22 }}>
                  {Math.round(rating)}
                </Text>
                <Text style={{ color: '#ffd79f', fontSize: 11, opacity: 0.9 }}>ELO</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      )}
    </ImageBackground>
  );
}
