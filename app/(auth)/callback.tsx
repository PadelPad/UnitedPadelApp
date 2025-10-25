import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { buildCallbackUrl } from '@/lib/auth';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams(); // contains code, state, etc.
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Rebuild the full redirect URL for native, or use window URL on web.
        const url =
          typeof window !== 'undefined'
            ? window.location.href
            : buildCallbackUrl(params as Record<string, string>);

        const { error } = await supabase.auth.exchangeCodeForSession(url);
        if (error) throw error;

        router.replace('/(tabs)/home');
      } catch (e: any) {
        setErr(e?.message ?? 'Auth failed');
        // Even on failure, push to welcome so user can retry
        setTimeout(() => router.replace('/(auth)'), 1200);
      }
    })();
  }, [router, params]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0e13', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <ActivityIndicator color="#ff6a00" />
      <Text style={{ color: '#fff' }}>{err ?? 'Signing you in…'}</Text>
    </View>
  );
}
