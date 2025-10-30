// components/cards/FlipCard.tsx
import React, { useEffect, useRef } from 'react';
import { View, Pressable, Animated, Easing, StyleSheet } from 'react-native';

type Props = {
  width: number;
  height: number;
  front: React.ReactNode;
  back: React.ReactNode;
  flipped?: boolean;
  onFlip?: (v: boolean) => void;
  tapToFlip?: boolean;
};

export default function FlipCard({
  width,
  height,
  front,
  back,
  flipped = false,
  onFlip,
  tapToFlip = true,
}: Props) {
  const rot = useRef(new Animated.Value(flipped ? 1 : 0)).current;
  const cur = useRef(flipped);

  useEffect(() => {
    if (flipped !== cur.current) {
      cur.current = flipped;
      Animated.timing(rot, {
        toValue: flipped ? 1 : 0,
        duration: 460,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [flipped, rot]);

  const doFlip = () => {
    const next = !cur.current;
    cur.current = next;
    Animated.timing(rot, {
      toValue: next ? 1 : 0,
      duration: 460,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onFlip?.(next));
  };

  const rotateY = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rotateYBack = rot.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <Pressable onPress={tapToFlip ? doFlip : undefined} accessibilityRole="button" style={{ width, height }}>
      <View style={{ width, height }}>
        <Animated.View style={[styles.card, { width, height, transform: [{ rotateY }], backfaceVisibility: 'hidden' }]}>
          {front}
        </Animated.View>
        <Animated.View
          style={[
            styles.card,
            styles.back,
            { width, height, transform: [{ rotateY: rotateYBack }], backfaceVisibility: 'hidden' },
          ]}
        >
          {back}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 0, top: 0, borderRadius: 24, overflow: 'hidden' },
  back: { transform: [{ rotateY: '180deg' }] },
});
