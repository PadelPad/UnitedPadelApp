// components/VerifyEmailBanner.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing, elevate } from '@/lib/theme';

type Props = {
  style?: StyleProp<ViewStyle>;
  /** Force show even if confirmed (for testing) */
  forceShow?: boolean;
  onDismiss?: () => void;
};

export default function VerifyEmailBanner({ style, forceShow, onDismiss }: Props) {
  const [sending, setSending] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const confirmed = !!data.user?.email_confirmed_at;
        if (!cancelled && !forceShow) setVisible(!confirmed);
      } catch {
        if (!cancelled && !forceShow) setVisible(false);
      }
    })();
    return () => { cancelled = true; };
  }, [forceShow]);

  const onResend = useCallback(async () => {
    try {
      setSending(true);
      const { data: userData, error: gErr } = await supabase.auth.getUser();
      if (gErr) throw gErr;
      const email = userData.user?.email;
      if (!email) throw new Error('Missing email.');

      // If you have a deep link callback URL, pass it as `emailRedirectTo`
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;

      Alert.alert('Sent', 'Verification email has been re-sent.');
    } catch (e: any) {
      Alert.alert('Failed', e?.message ?? 'Could not resend verification email.');
    } finally {
      setSending(false);
    }
  }, []);

  if (!visible) return null;

  return (
    <View style={[styles.card, style]} accessibilityRole="summary">
      <Ionicons name="mail-unread-outline" size={18} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.sub}>Please check your inbox for the verification link.</Text>
      </View>

      <Pressable onPress={onResend} style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.98 }] }]} disabled={sending} accessibilityRole="button">
        {sending ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.ctaText}>Resend</Text>}
      </Pressable>

      <Pressable
        onPress={() => { setVisible(false); onDismiss?.(); }}
        style={styles.dismiss}
        accessibilityRole="button"
        hitSlop={8}
      >
        <Ionicons name="close" size={16} color={colors.subtext} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    ...elevate(0),
  },
  title: { color: colors.text, fontWeight: '900' },
  sub: { color: colors.subtext, fontSize: 12 },
  cta: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: spacing.xs,
  },
  ctaText: { color: colors.bg, fontWeight: '900' },
  dismiss: { padding: 6, marginLeft: 6 },
});
