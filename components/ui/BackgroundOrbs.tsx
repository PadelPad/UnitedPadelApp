import React, { useEffect } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { theme } from "./Brand";

export default function BackgroundOrbs() {
  const { width, height } = useWindowDimensions();
  const base = Math.min(width, height);

  // Responsive sizes
  const sizeA = Math.round(base * 0.9);   // top-right
  const sizeB = Math.round(base * 1.15);  // bottom-left
  const sizeC = Math.round(base * 0.7);   // bottom-right accent

  // Animation drivers
  const s1 = useSharedValue(1);
  const s2 = useSharedValue(1.04);
  const s3 = useSharedValue(0.96);

  useEffect(() => {
    s1.value = withRepeat(withTiming(1.06, { duration: 3600, easing: Easing.inOut(Easing.quad) }), -1, true);
    s2.value = withRepeat(withTiming(0.94, { duration: 4200, easing: Easing.inOut(Easing.quad) }), -1, true);
    s3.value = withRepeat(withTiming(1.03, { duration: 4800, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);

  const orb1 = useAnimatedStyle(() => ({ transform: [{ scale: s1.value }], opacity: 0.35 }));
  const orb2 = useAnimatedStyle(() => ({ transform: [{ scale: s2.value }], opacity: 0.28 }));
  const orb3 = useAnimatedStyle(() => ({ transform: [{ scale: s3.value }], opacity: 0.22 }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Base tint FIRST so it doesn’t cover the orbs */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg, opacity: 0.9 }]} />

      {/* Top-right wash */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -sizeA * 0.35,
            right: -sizeA * 0.35,
            width: sizeA,
            height: sizeA,
            borderRadius: sizeA / 2,
            overflow: "hidden",
          },
          orb1,
        ]}
      >
        <LinearGradient
          colors={["rgba(255,106,0,0.38)", "rgba(255,106,0,0.08)"]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Bottom-left wash */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: -sizeB * 0.4,
            left: -sizeB * 0.4,
            width: sizeB,
            height: sizeB,
            borderRadius: sizeB / 2,
            overflow: "hidden",
          },
          orb2,
        ]}
      >
        <LinearGradient
          colors={["rgba(255,127,26,0.32)", "rgba(255,127,26,0.07)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Small accent wash */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: -sizeC * 0.35,
            right: -sizeC * 0.35,
            width: sizeC,
            height: sizeC,
            borderRadius: sizeC / 2,
            overflow: "hidden",
          },
          orb3,
        ]}
      >
        <LinearGradient
          colors={["rgba(255,142,69,0.22)", "rgba(255,142,69,0.04)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
