// app/(auth)/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, Platform, Animated, Easing } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radii, shadow } from '@/lib/theme';
import BackgroundOrbs from '@/components/ui/BackgroundOrbs';
const Logo = require('@/assets/icon.png');

export default function AuthIndex() {
  const router = useRouter();

  const [showCtas, setShowCtas] = useState(false);
  const fadeIn = useState(() => new Animated.Value(0))[0];
  const scale = useState(() => new Animated.Value(0.94))[0];
  const halo = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeIn, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.05, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => setShowCtas(true));

    Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1.06, duration: 3800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(halo, { toValue: 1, duration: 3800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [fadeIn, scale, halo]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BackgroundOrbs />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 120,
            width: 240,
            height: 240,
            borderRadius: 120,
            overflow: 'hidden',
            zIndex: -1,
            opacity: 0.75,
            transform: [{ scale: halo }],
          }}
        >
          <LinearGradient
            colors={['rgba(255,106,0,0.35)', 'rgba(255,106,0,0.0)']}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <Animated.View style={{ width: 168, marginBottom: 20, opacity: fadeIn, transform: [{ scale }] }}>
          <LinearGradient
            colors={['#1b2029', '#0f141b']}
            style={{
              padding: 24,
              borderRadius: radii.xl,
              borderWidth: 1,
              borderColor: colors.outline,
              alignItems: 'center',
              ...shadow.soft,
            }}
          >
            <Image source={Logo} style={{ width: 88, height: 88, borderRadius: 20 }} />
          </LinearGradient>
        </Animated.View>

        <Text style={{ color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: 0.3, textAlign: 'center' }}>
          United Padel
        </Text>
        <Text style={{ color: colors.subtext, marginTop: 10, textAlign: 'center', fontSize: 16, lineHeight: 22 }}>
          Track matches. Climb rankings. Join tournaments.
        </Text>

        {showCtas && (
          <View style={{ marginTop: 28, width: '100%', gap: 12 }}>
            <Pressable
              onPress={() => router.push('/(auth)/login')}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: radii.lg,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
              accessibilityRole="button"
              accessibilityLabel="Log in"
            >
              <Ionicons name="log-in-outline" size={18} color={colors.bg} />
              <Text style={{ color: colors.bg, fontWeight: '900', fontSize: 16 }}>Log in</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/signup')}
              style={{
                borderWidth: 1,
                borderColor: colors.primary,
                paddingVertical: 14,
                borderRadius: radii.lg,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 16 }}>Create account</Text>
            </Pressable>

            <View style={{ marginTop: 4, gap: 10 }}>
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => router.push('/(auth)/login?provider=apple')}
                  style={{
                    backgroundColor: '#000',
                    paddingVertical: 12,
                    borderRadius: radii.md,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  accessibilityRole="button"
                >
                  <Ionicons name="logo-apple" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Continue with Apple</Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => router.push('/(auth)/login?provider=google')}
                style={{
                  backgroundColor: '#101418',
                  paddingVertical: 12,
                  borderRadius: radii.md,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  borderWidth: 1,
                  borderColor: colors.outline,
                }}
                accessibilityRole="button"
              >
                <Ionicons name="logo-google" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800' }}>Continue with Google</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <View style={{ paddingBottom: 20, alignItems: 'center', gap: 6 }}>
        <Text style={{ color: colors.subtext, fontSize: 12 }}>By continuing you agree to our</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Link href="/legal/terms"><Text style={{ color: colors.primary, fontSize: 12 }}>Terms</Text></Link>
          <Text style={{ color: colors.subtext, fontSize: 12 }}>•</Text>
          <Link href="/legal/privacy"><Text style={{ color: colors.primary, fontSize: 12 }}>Privacy</Text></Link>
        </View>
      </View>
    </View>
  );
}
