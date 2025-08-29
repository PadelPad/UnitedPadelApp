import React, { useEffect } from 'react';
import { ImageBackground, View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  bg: any;                // require('...png')
  width: number;
  height: number;
  rank?: number;
  username: string;
  region?: string | null;
  rating?: number | null;
  avatarUrl?: string | null;
  compact?: boolean;
  shine?: boolean;
};

const ALinear = Animated.createAnimatedComponent(LinearGradient);

export default function PlayerCardFront({
  bg, width, height, rank, username, region, rating, avatarUrl, compact, shine,
}: Props) {
  const x = useSharedValue(-width);

  useEffect(() => {
    if (!shine) return;
    x.value = -width;
    x.value = withRepeat(withTiming(width * 1.8, { duration: 2200 }), -1, false);
  }, [shine, width]);

  const shineStyle = useAnimatedStyle(() => ({
    position: 'absolute', top: -height * 0.1, left: x.value,
    width: width * 0.7, height: height * 1.2,
    transform: [{ rotateZ: '18deg' }], opacity: 0.9,
  }));

  return (
    <ImageBackground
      source={bg}
      style={{ width, height, borderRadius: 22, overflow: 'hidden' }}
      imageStyle={{ borderRadius: 22 }}
      resizeMode="cover"
    >
      {shine ? (
        <ALinear
          colors={['rgba(255,255,255,0.0)','rgba(255,236,200,0.35)','rgba(255,255,255,0.0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={shineStyle}
        />
      ) : null}

      <LinearGradient
        colors={['rgba(0,0,0,0.25)','rgba(0,0,0,0.65)']}
        style={{ flex: 1, padding: 14, justifyContent: 'flex-end' }}
      >
        {typeof rank === 'number' ? (
          <View
            style={{
              position: 'absolute', top: 10, right: 10,
              backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14,
              paddingHorizontal: 10, paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#ffd79f', fontWeight: '900' }}>#{rank}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{
                width: compact ? 46 : 60, height: compact ? 46 : 60, borderRadius: 999,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                backgroundColor: 'rgba(0,0,0,0.25)',
              }}
            />
          ) : (
            <View
              style={{
                width: compact ? 46 : 60, height: compact ? 46 : 60, borderRadius: 999,
                backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={compact ? 20 : 26} color="#e7e7ee" />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '900', fontSize: compact ? 16 : 18 }}>
              {username || 'Player'}
            </Text>
            <Text numberOfLines={1} style={{ color: '#e2e2ea', opacity: 0.8, fontSize: compact ? 12 : 13 }}>
              {region || '—'}
            </Text>
          </View>

          {typeof rating === 'number' ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#ffe0b0', fontWeight: '900', fontSize: compact ? 18 : 22 }}>
                {Math.round(rating)}
              </Text>
              <Text style={{ color: '#ffd79f', fontSize: compact ? 10 : 11, opacity: 0.9 }}>ELO</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}
