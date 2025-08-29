// components/cards/FlipCard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

type Props = {
  /** Card size */
  width: number;
  height: number;

  /** Faces */
  front: React.ReactNode;
  back: React.ReactNode;

  /** Controlled flip state (optional). If omitted, component is uncontrolled. */
  flipped?: boolean;
  onFlip?: (next: boolean) => void;

  /** Initial state for uncontrolled mode */
  defaultFlipped?: boolean;

  /** Animation config */
  duration?: number;     // default 450ms
  perspective?: number;  // default 1200

  /** Style + interaction */
  style?: StyleProp<ViewStyle>;
  disableTapToFlip?: boolean;
  /** Accessibility label for the pressable wrapper */
  accessibilityLabel?: string;
};

export default function FlipCard({
  width,
  height,
  front,
  back,
  flipped,
  onFlip,
  defaultFlipped = false,
  duration = 450,
  perspective = 1200,
  style,
  disableTapToFlip,
  accessibilityLabel = 'Flip card',
}: Props) {
  const isControlled = typeof flipped === 'boolean';
  const [uncontrolled, setUncontrolled] = useState(defaultFlipped);
  const open = isControlled ? flipped! : uncontrolled;

  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration });
  }, [open, duration, progress]);

  const frontStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 1], [0, 180]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [1, 0, 0]);
    return {
      position: 'absolute',
      backfaceVisibility: 'hidden' as const,
      transform: [{ perspective }, { rotateY: `${rotate}deg` }],
      opacity,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 1], [-180, 0]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]);
    return {
      position: 'absolute',
      backfaceVisibility: 'hidden' as const,
      transform: [{ perspective }, { rotateY: `${rotate}deg` }],
      opacity,
    };
  });

  const toggle = useMemo(
    () => () => {
      const next = !open;
      if (isControlled) onFlip?.(next);
      else setUncontrolled(next);
    },
    [isControlled, onFlip, open]
  );

  return (
    <Pressable
      onPress={disableTapToFlip ? undefined : toggle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[{ width, height }, style]}
    >
      <Animated.View style={[{ width, height }, frontStyle]}>
        <View style={{ width, height }}>{front}</View>
      </Animated.View>

      <Animated.View style={[{ width, height }, backStyle]}>
        <View style={{ width, height }}>{back}</View>
      </Animated.View>
    </Pressable>
  );
}
