// app/(auth)/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, Pressable, Platform } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  useAnimatedStyle,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";

// theme tokens (keep as your existing lib)
import { colors, radii, shadow } from "@/lib/theme";

// animated background
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";

// brand mark (use your existing app icon for now)
const Logo = require("@/assets/icon.png");

export default function Welcome() {
  // entrance animation
  const [showCtas, setShowCtas] = useState(false);
  const fadeIn = useSharedValue(0);
  const scale = useSharedValue(0.94);

  // subtle halo behind the tile (breathing)
  const halo = useSharedValue(1);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }, () => {
      scale.value = withTiming(1.05, { duration: 420 }, () => {
        scale.value = withTiming(1, { duration: 320 }, () => runOnJS(setShowCtas)(true));
      });
    });

    halo.value = withRepeat(
      withTiming(1.06, { duration: 3800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  const logoAnim = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ scale: scale.value }],
  }));

  const haloAnim = useAnimatedStyle(() => ({
    transform: [{ scale: halo.value }],
    opacity: 0.75,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* animated gradient bubbles behind everything */}
      <BackgroundOrbs />

      {/* CONTENT */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        {/* halo behind the logo tile */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 120,
              width: 240,
              height: 240,
              borderRadius: 120,
              overflow: "hidden",
              zIndex: -1,
            },
            haloAnim,
          ]}
        >
          <LinearGradient
            colors={["rgba(255,106,0,0.35)", "rgba(255,106,0,0.0)"]}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        {/* Brand tile */}
        <Animated.View style={[logoAnim, { width: 168, marginBottom: 20 }]}>
          <LinearGradient
            colors={["#1b2029", "#0f141b"]}
            style={{
              padding: 24,
              borderRadius: radii.xl,
              borderWidth: 1,
              borderColor: colors.outline,
              alignItems: "center",
              ...shadow.soft,
            }}
          >
            <Image source={Logo} style={{ width: 88, height: 88, borderRadius: 20 }} />
          </LinearGradient>
        </Animated.View>

        {/* Headline */}
        <Text
          style={{
            color: colors.text,
            fontSize: 34,
            fontWeight: "900",
            letterSpacing: 0.3,
            textAlign: "center",
          }}
        >
          United Padel
        </Text>
        <Text
          style={{
            color: colors.subtext,
            marginTop: 10,
            textAlign: "center",
            fontSize: 16,
            lineHeight: 22,
          }}
        >
          Track matches. Climb rankings. Join tournaments.
        </Text>

        {/* CTAs */}
        {showCtas && (
          <View style={{ marginTop: 28, width: "100%", gap: 12 }}>
            <Link href="/(auth)/login" asChild>
              <Pressable
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: radii.lg,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
                accessibilityRole="button"
                accessibilityLabel="Log in"
              >
                <Ionicons name="log-in-outline" size={18} color={colors.bg} />
                <Text style={{ color: colors.bg, fontWeight: "900", fontSize: 16 }}>Log in</Text>
              </Pressable>
            </Link>

            <Link href="/(auth)/signup" asChild>
              <Pressable
                style={{
                  borderWidth: 1,
                  borderColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: radii.lg,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
                accessibilityRole="button"
                accessibilityLabel="Create account"
              >
                <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 16 }}>
                  Create account
                </Text>
              </Pressable>
            </Link>

            {/* Social sign-in shortcuts (routes to login with provider param) */}
            <View style={{ marginTop: 4, gap: 10 }}>
              {Platform.OS === "ios" && (
                <Link href="/(auth)/login?provider=apple" asChild>
                  <Pressable
                    style={{
                      backgroundColor: "#000",
                      paddingVertical: 12,
                      borderRadius: radii.md,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                    accessibilityRole="button"
                  >
                    <Ionicons name="logo-apple" size={18} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "800" }}>Continue with Apple</Text>
                  </Pressable>
                </Link>
              )}

              <Link href="/(auth)/login?provider=google" asChild>
                <Pressable
                  style={{
                    backgroundColor: "#101418",
                    paddingVertical: 12,
                    borderRadius: radii.md,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: colors.outline,
                  }}
                  accessibilityRole="button"
                >
                  <Ionicons name="logo-google" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "800" }}>Continue with Google</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={{ paddingBottom: 20, alignItems: "center", gap: 6 }}>
        <Text style={{ color: colors.subtext, fontSize: 12 }}>By continuing you agree to our</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Link href="/legal/terms">
            <Text style={{ color: colors.primary, fontSize: 12 }}>Terms</Text>
          </Link>
          <Text style={{ color: colors.subtext, fontSize: 12 }}>•</Text>
          <Link href="/legal/privacy">
            <Text style={{ color: colors.primary, fontSize: 12 }}>Privacy</Text>
          </Link>
        </View>
      </View>
    </View>
  );
}
