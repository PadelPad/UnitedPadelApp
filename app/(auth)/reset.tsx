import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { sendPasswordReset } from '@/lib/auth';
import { colors, radii } from '@/lib/theme';

export default function Reset() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onReset() {
    try {
      setBusy(true);
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (e: any) {
      Alert.alert('Reset failed', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0e13', padding: 20, gap: 16 }}>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 6 }}>Reset password</Text>

      <View style={{ gap: 10 }}>
        <Text style={{ color: '#9aa0a6' }}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@email.com"
          placeholderTextColor="#6f7785"
          style={{
            backgroundColor: '#10151d',
            borderWidth: 1, borderColor: '#1f2630',
            color: '#fff', borderRadius: radii.md,
            paddingHorizontal: 12, paddingVertical: 12,
          }}
        />
      </View>

      <Pressable
        onPress={onReset}
        disabled={busy}
        style={{
          backgroundColor: colors.primary,
          paddingVertical: 14,
          borderRadius: radii.lg,
          alignItems: 'center',
          opacity: busy ? 0.7 : 1,
        }}
      >
        <Text style={{ color: '#0b0e13', fontWeight: '900' }}>
          {busy ? 'Sending…' : 'Send reset link'}
        </Text>
      </Pressable>

      {sent && (
        <View style={{ backgroundColor: '#141a22', borderWidth: 1, borderColor: '#253041', padding: 12, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Check your inbox</Text>
          <Text style={{ color: '#9aa0a6', marginTop: 4 }}>
            We sent a password reset link to {email}.
          </Text>
        </View>
      )}
    </View>
  );
}
