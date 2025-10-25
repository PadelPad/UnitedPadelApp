import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithApple,
} from '@/lib/auth';
import { colors, radii } from '@/lib/theme';

export default function Login() {
  const router = useRouter();
  const { provider } = useLocalSearchParams<{ provider?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // auto-trigger provider if opened from welcome quick buttons
  async function handleProviderAuto() {
    try {
      if (provider === 'google') {
        setBusy(true); await signInWithGoogle();
      } else if (provider === 'apple') {
        setBusy(true); await signInWithApple();
      }
    } catch (e: any) {
      Alert.alert('Login error', e?.message ?? String(e));
      setBusy(false);
    }
  }
  // fire once
  useState(() => { handleProviderAuto(); });

  async function onLogin() {
    try {
      setBusy(true);
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Login error', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0e13', padding: 20, gap: 16 }}>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 6 }}>Log in</Text>

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
            borderWidth: 1,
            borderColor: '#1f2630',
            color: '#fff',
            borderRadius: radii.md,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
        />
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: '#9aa0a6' }}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#6f7785"
          style={{
            backgroundColor: '#10151d',
            borderWidth: 1,
            borderColor: '#1f2630',
            color: '#fff',
            borderRadius: radii.md,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
        />
        <Link href="/(auth)/reset"><Text style={{ color: colors.primary, marginTop: 6 }}>Forgot password?</Text></Link>
      </View>

      <Pressable
        onPress={onLogin}
        disabled={busy}
        style={{
          backgroundColor: colors.primary,
          paddingVertical: 14,
          borderRadius: radii.lg,
          alignItems: 'center',
          opacity: busy ? 0.7 : 1,
        }}
      >
        <Text style={{ color: '#0b0e13', fontWeight: '900' }}>{busy ? 'Signing in…' : 'Continue'}</Text>
      </Pressable>

      <View style={{ alignItems: 'center', marginVertical: 6 }}>
        <Text style={{ color: '#6f7785' }}>or</Text>
      </View>

      <Pressable
        onPress={async () => { setBusy(true); try { await signInWithApple(); } catch (e: any) { Alert.alert('Apple sign in failed', e?.message ?? String(e)); } finally { setBusy(false); } }}
        style={{
          backgroundColor: '#101418',
          borderWidth: 1, borderColor: '#202733',
          paddingVertical: 12,
          borderRadius: radii.md,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Ionicons name="logo-apple" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '800' }}>Continue with Apple</Text>
      </Pressable>

      <Pressable
        onPress={async () => { setBusy(true); try { await signInWithGoogle(); } catch (e: any) { Alert.alert('Google sign in failed', e?.message ?? String(e)); } finally { setBusy(false); } }}
        style={{
          backgroundColor: '#101418',
          borderWidth: 1, borderColor: '#202733',
          paddingVertical: 12,
          borderRadius: radii.md,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Ionicons name="logo-google" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '800' }}>Continue with Google</Text>
      </Pressable>

      <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <Text style={{ color: '#9aa0a6' }}>No account?</Text>
        <Link href="/(auth)/signup"><Text style={{ color: colors.primary, fontWeight: '800' }}>Create one</Text></Link>
      </View>
    </View>
  );
}
