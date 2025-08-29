// components/Skeleton.tsx
import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';

export function SkeletonBlock({ style }: { style: ViewStyle }) {
  const o = useSharedValue(0.6);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ backgroundColor: '#1a2029', borderRadius: 12 }, style, a]} />;
}
