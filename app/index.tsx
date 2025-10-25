import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function IndexGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // initial
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    // subscribe
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0e13' }}>
        <ActivityIndicator color="#ff6a00" />
      </View>
    );
  }

  // If signed in → go to tabs/home; else → auth welcome screen
  return <Redirect href={session ? '/(tabs)/home' : '/(auth)'} />;
}
