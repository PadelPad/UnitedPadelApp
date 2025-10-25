import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const access_token = params['access_token'] as string | undefined;
        const refresh_token = params['refresh_token'] as string | undefined;
        const code = params['code'] as string | undefined;

        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        } else if (code && 'exchangeCodeForSession' in supabase.auth) {
          // @ts-ignore - not in types for all adapters
          await supabase.auth.exchangeCodeForSession(code);
        }
      } finally {
        router.replace('/(tabs)/home');
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0e13', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#ff6a00" />
      <Text style={{ color: '#fff', marginTop: 8 }}>Completing sign-in…</Text>
    </View>
  );
}
