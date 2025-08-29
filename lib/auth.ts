// lib/auth.ts
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export function getRedirectUrl() {
  return makeRedirectUri({
    scheme: 'unitedpadel',
    path: 'auth/callback',
    preferLocalhost: true,
  });
}

/** Email + password */
export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Sign up (sends verify link via Supabase) */
export async function signUpWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: getRedirectUrl() },
  });
  if (error) throw error;
}

/** Password reset email */
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl(),
  });
  if (error) throw error;
}

/** Google OAuth (works on all platforms) */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: getRedirectUrl() },
  });
  if (error) throw error;
}

/** Apple: native on iOS, otherwise OAuth fallback */
export async function signInWithApple() {
  try {
    if (Platform.OS === 'ios') {
      // Lazy import so Android/Web builds don’t require the native module
      const AppleAuthentication = await import('expo-apple-authentication');

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (isAvailable) {
        const res = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (!res.identityToken) throw new Error('No Apple identity token returned.');
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: res.identityToken,
        });
        if (error) throw error;
        return;
      }
      // If iOS but unavailable (rare), fall through to OAuth
    }

    // Fallback on Android/Web (or if native unavailable)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: getRedirectUrl() },
    });
    if (error) throw error;
  } catch (e: any) {
    if (e?.code === 'ERR_CANCELED') return; // user cancelled
    throw e;
  }
}

/** Build a full callback URL for native from query params */
export function buildCallbackUrl(query: Record<string, string | string[] | undefined>) {
  const q = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (typeof v === 'string') q.set(k, v);
  });
  return Linking.createURL(`auth/callback?${q.toString()}`);
}
