// app/(tabs)/profile/index.tsx
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable, ScrollView,
  RefreshControl, Alert, Modal, Image, Share, TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';

import PlayerHeroCard from '@/components/cards/PlayerHeroCard';
import { usePlayerStats, type PlayerStats } from '@/lib/hooks/usePlayerStats';

// Optional QR
// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRCode = require('react-native-qrcode-svg')?.default ?? null;

const C = {
  bg: '#0b0e13', panel: '#0e1116', border: '#1f2630', text: '#fff', sub: '#9aa0a6',
  orange: '#ff6a00', gold: '#ffb86b', success: '#46d39a', danger: '#ff4d4f',
};

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  rating: number | null;
  club_id: string | null;
  region?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  preferred_format?: 'singles' | 'doubles' | 'mixed' | null;
  phone?: string | null;             // optional column in profiles
  bio?: string | null;
  subscription_tier?: 'free'|'plus'|'elite'|'club_plus'|'club_elite'|null;
  referral_code?: string | null;
};

async function getMe() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
async function fetchProfile(userId?: string): Promise<ProfileRow | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, rating, club_id, region, gender, preferred_format, phone, bio, subscription_tier, referral_code')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as ProfileRow;
}
async function fetchClubName(clubId?: string | null): Promise<string | null> {
  if (!clubId) return null;
  const { data } = await supabase.from('clubs').select('name').eq('id', clubId).single();
  return data?.name ?? null;
}
async function fetchBadgesPreview(userId?: string) {
  if (!userId) return [];
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id, awarded_at')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false })
    .limit(6);
  const ids = Array.from(new Set((userBadges ?? []).map(b => b.badge_id).filter(Boolean)));
  if (!ids.length) return [];
  const { data: badges } = await supabase.from('badges').select('id, name, icon_url').in('id', ids);
  const map = new Map((badges ?? []).map(b => [b.id, b]));
  return (userBadges ?? []).map(ub => ({ awarded_at: ub.awarded_at, badge: map.get(ub.badge_id) }));
}
async function fetchBadgesCount(userId?: string) {
  if (!userId) return 0;
  const { count } = await supabase.from('user_badges').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  return count ?? 0;
}
async function fetchRecentMatches(userId?: string) {
  if (!userId) return [];
  const { data } = await supabase
    .from('match_players')
    .select('match_id, is_winner, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const matchIds = Array.from(new Set((data ?? []).map(r => r.match_id)));
  if (!matchIds.length) return [];
  const { data: matches } = await supabase
    .from('matches')
    .select('id, status, finalized, finalized_at, winner_team, winning_team, created_at')
    .in('id', matchIds);

  const map = new Map((matches ?? []).map(m => [m.id, m]));
  const isFinal = (m:any) => {
    if (!m) return false;
    const status = (m.status || '').toLowerCase();
    return Boolean(m.finalized || m.finalized_at ||
      ['finalized','completed','complete'].includes(status) ||
      typeof m.winner_team === 'number' || typeof m.winning_team === 'number');
  };
  return (data ?? []).filter(r => isFinal(map.get(r.match_id))).slice(0, 8);
}

export default function ProfileScreen() {
  const router = useRouter();
  const [qrOpen, setQrOpen] = useState(false);

  // ===== hooks (top) =====
  const { data: me, isLoading: loadingMe, isError: errorMe, refetch: refetchMe, error: meError } =
    useQuery({ queryKey: ['me'], queryFn: getMe });

  const userId = me?.id ?? '';

  const {
    data: profile,
    isLoading: loadingProfile,
    isError: errorProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId),
    enabled: !!userId,
  });

  const { data: clubName, refetch: refetchClub } = useQuery({
    queryKey: ['club-name', profile?.club_id],
    queryFn: () => fetchClubName(profile?.club_id),
    enabled: !!profile?.club_id,
  });

  const { data: badgesPreview = [], isError: errorBadgesPreview, refetch: refetchBadgesPreview } = useQuery({
    queryKey: ['badges-preview', userId],
    queryFn: () => fetchBadgesPreview(userId),
    enabled: !!userId,
  });

  const { data: badgesCount = 0 } = useQuery({
    queryKey: ['badges-count', userId],
    queryFn: () => fetchBadgesCount(userId),
    enabled: !!userId,
  });

  const { data: recentMatches = [], isError: errorRecent, refetch: refetchRecent, error: recentError } = useQuery({
    queryKey: ['recent-matches', userId],
    queryFn: () => fetchRecentMatches(userId),
    enabled: !!userId,
  });

  const {
    data: stats,
    isLoading: loadingStats,
    isError: errorStats,
    refetch: refetchStats,
    error: statsError,
  } = usePlayerStats(userId, { enabled: !!userId });

  const safeStats: PlayerStats = stats ?? { matches: 0, wins: 0, winRatePct: 0, streak: 0, xp: 0, eloDelta: 0 };

  // ===== personal details (form state) =====
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // from auth
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [gender, setGender] = useState<ProfileRow['gender']>(null);
  const [preferred, setPreferred] = useState<ProfileRow['preferred_format']>(null);
  const [bio, setBio] = useState('');
  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setPhone(profile.phone ?? '');
      setRegion(profile.region ?? '');
      setGender(profile.gender ?? null);
      setPreferred(profile.preferred_format ?? null);
      setBio(profile.bio ?? '');
    }
    if (me?.email) setEmail(me.email);
  }, [profile, me?.email]);

  const saveDetails = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user');
      // 1) update profiles table
      const { error: e1 } = await supabase.from('profiles').update({
        username: username || null,
        phone: phone || null,
        region: region || null,
        gender: gender || null,
        preferred_format: preferred || null,
        bio: bio || null,
      }).eq('id', userId);
      if (e1) throw e1;

      // 2) update auth email if changed
      if (email && me?.email && email.trim().toLowerCase() !== me.email.toLowerCase()) {
        const { error: e2 } = await supabase.auth.updateUser({ email });
        if (e2) throw e2;
      }
    },
  });

  const resendVerify = useMutation({
    mutationFn: async () => {
      if (!me?.email) throw new Error('No email');
      const { error } = await supabase.auth.resend({ type: 'signup', email: me.email });
      if (error) throw error;
    },
  });
  const signOut = useMutation({ mutationFn: async () => { const { error } = await supabase.auth.signOut(); if (error) throw error; } });
  const signOutAll = useMutation({ mutationFn: async () => { const { error } = await supabase.auth.signOut({ scope: 'global' as any }); if (error) throw error; } });
  const softDelete = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        .update({ bio: null, username: '(deleted)', deactivated_at: new Date().toISOString() as any })
        .eq('id', userId);
      if (error) throw error;
    },
  });

  const onRefresh = useCallback(async () => {
    await Promise.all([
      refetchMe(), refetchProfile(), refetchStats(),
      refetchRecent(), refetchBadgesPreview(), refetchClub(),
    ]);
  }, [refetchMe, refetchProfile, refetchStats, refetchRecent, refetchBadgesPreview, refetchClub]);

  // ===== early returns =====
  if (loadingMe || loadingProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  }
  if (errorMe || !userId) {
    return <RetryScreen title="No user session" subtitle={(meError as any)?.message ?? 'Please sign in again.'} onRetry={refetchMe} />;
  }
  if (errorProfile || !profile) {
    return <RetryScreen title="Couldn’t load your profile" subtitle={(profileError as any)?.message ?? 'Unknown error'} onRetry={refetchProfile} />;
  }

  // ===== render =====
  const unverified = me && (!me.email_confirmed_at && !(me as any).confirmed_at);
  const tierLabel =
    profile.subscription_tier === 'elite' ? 'Elite'
      : profile.subscription_tier === 'plus' ? 'Plus'
      : profile.subscription_tier === 'club_elite' ? 'Club Elite'
      : profile.subscription_tier === 'club_plus' ? 'Club Plus' : 'Free';

  const shareUrl = `https://unitedpadel.app/u/${profile.id}`;
  const referral = profile.referral_code || profile.id.slice(0, 6).toUpperCase();

  const level = Math.floor((safeStats.xp ?? 0) / 100) + 1;
  const levelStart = (level - 1) * 100;
  const levelEnd = level * 100;
  const progress = Math.max(0, Math.min(1, ((safeStats.xp ?? 0) - levelStart) / (levelEnd - levelStart)));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack.Screen
        options={{
          title: 'My Profile',
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} refreshControl={<RefreshControl tintColor={C.orange} refreshing={false} onRefresh={onRefresh} />}>
        {/* Screen Title */}
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22 }}>My Profile</Text>

        {unverified && (
          <View style={S.banner}>
            <Ionicons name="mail-unread-outline" size={18} color={C.gold} />
            <Text style={{ color: C.gold, fontWeight: '800', flex: 1 }}>Verify your email to unlock all features</Text>
            <Pressable
              onPress={() =>
                resendVerify.mutate(undefined, {
                  onSuccess: () => Alert.alert('Sent', 'Check your inbox for a verification email.'),
                  onError: (e: any) => Alert.alert('Could not resend', e?.message ?? 'Try again.'),
                })
              }
              style={S.linkBtn}
            >
              <Text style={S.linkBtnText}>Resend</Text>
            </Pressable>
          </View>
        )}

        {/* BIGGER HERO CARD */}
        <PlayerHeroCard
          size="lg"
          player={{
            id: profile.id,
            username: profile.username,
            avatar_url: profile.avatar_url ?? undefined,
            rating: profile.rating ?? undefined,
            club: clubName ?? undefined,
            badges_count: badgesCount ?? undefined,
            tierLabel,
          }}
          stats={errorStats ? null : safeStats}
        />

        {/* Personal Details (editable) */}
        <View style={S.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={S.sectionTitle}>Personal details</Text>
            <Pressable
              onPress={() => router.push('/(tabs)/profile/edit')}
              style={S.linkBtn}
              accessibilityRole="button"
            >
              <Text style={S.linkBtnText}>Open full editor</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 10, gap: 8 }}>
            <Label>Display name</Label>
            <Input value={username} onChangeText={setUsername} />

            <Label>Email</Label>
            <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Text style={{ color: C.sub, fontSize: 11 }}>
              Changing email sends a confirmation link to the new address.
            </Text>

            <Label>Phone</Label>
            <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Label>Region / Location</Label>
            <Input value={region} onChangeText={setRegion} placeholder="e.g. London, UK" />

            <Label>Gender</Label>
            <Input value={gender ?? ''} onChangeText={(t: string) => setGender((t || '') as any)} placeholder="male / female / other" />

            <Label>Preferred format</Label>
            <Input value={preferred ?? ''} onChangeText={(t: string) => setPreferred((t || '') as any)} placeholder="singles / doubles / mixed" />

            <Label>Bio</Label>
            <Input value={bio} onChangeText={setBio} multiline />

            <Pressable
              style={[S.primary, { marginTop: 6 }]}
              onPress={() =>
                saveDetails.mutate(undefined, {
                  onSuccess: () => {
                    Alert.alert('Saved', 'Details updated. If you changed email, check your inbox.');
                    refetchProfile();
                    refetchMe();
                  },
                  onError: (e: any) => Alert.alert('Update failed', e?.message ?? 'Try again.'),
                })
              }
              disabled={saveDetails.isPending}
            >
              <Text style={S.primaryText}>{saveDetails.isPending ? 'Saving…' : 'Save changes'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Level / XP */}
        <View style={S.card}>
          <Text style={S.sectionTitle}>Level & XP</Text>
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>Level {level}</Text>
              <Text style={{ color: C.sub }}>{(safeStats.xp ?? 0) - levelStart}/{levelEnd - levelStart} XP</Text>
            </View>
            <View style={S.progressOuter}><View style={[S.progressInner, { width: `${Math.round(progress * 100)}%` }]} /></View>
            <Text style={{ color: C.sub, marginTop: 6 }}>Play matches to earn XP. Wins and streaks give more.</Text>
          </View>
        </View>

        {/* Recent matches */}
        <View style={S.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={S.sectionTitle}>Recent Matches</Text>
            {errorRecent ? (<Pressable onPress={() => refetchRecent()} style={S.linkBtn}><Text style={S.linkBtnText}>Retry</Text></Pressable>) : null}
          </View>
          {(recentMatches ?? []).length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {recentMatches.map((m: any, idx: number) => (
                <View key={`${m.match_id}-${idx}`} style={[
                  S.bubble,
                  m.is_winner ? { backgroundColor: 'rgba(70,211,154,0.2)', borderColor: '#2b6f5a' }
                              : { backgroundColor: 'rgba(255,77,79,0.2)', borderColor: '#7a2f32' },
                ]}>
                  <Text style={{ color: m.is_winner ? C.success : '#ff9aa2', fontWeight: '900' }}>{m.is_winner ? 'W' : 'L'}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: C.sub, marginTop: 8 }}>
              {errorRecent ? (recentError as any)?.message ?? 'Failed to load' : 'No recent finalized matches yet.'}
            </Text>
          )}
        </View>

        {/* Badges */}
        <View style={S.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={S.sectionTitle}>Badges</Text>
            <Pressable onPress={() => Alert.alert('Badges', 'Full badge gallery coming soon.')} style={S.linkBtn}>
              <Text style={S.linkBtnText}>See all</Text>
            </Pressable>
          </View>
          {(badgesPreview ?? []).length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              {badgesPreview.map((b: any, i: number) => (
                <View key={`${b.badge?.id ?? i}-${b.awarded_at}`} style={{
                  alignItems: 'center', width: 72, padding: 8, borderRadius: 12,
                  backgroundColor: '#0f141d', borderWidth: 1, borderColor: '#222936',
                }}>
                  {b.badge?.icon_url
                    ? <Image source={{ uri: b.badge.icon_url }} style={{ width: 40, height: 40, borderRadius: 8, marginBottom: 6 }} />
                    : <Ionicons name="ribbon-outline" size={28} color="#ffd79f" />}
                  <Text style={{ color: '#fff', fontWeight: '800' }} numberOfLines={1}>{b.badge?.name ?? 'Badge'}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: C.sub, marginTop: 8 }}>
              {errorBadgesPreview ? 'Couldn’t load badges.' : 'No badges yet—play matches to earn some!'}
            </Text>
          )}
        </View>

        {/* Share / Referral */}
        <View style={S.card}>
          <Text style={S.sectionTitle}>Share & Referral</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <ActionBtn icon="share-social-outline" label="Share profile" onPress={() => Share.share({ message: `Check out my United Padel profile: ${shareUrl}` })} />
            <ActionBtn icon="copy-outline" label="Copy referral" onPress={async () => { await Clipboard.setStringAsync(referral); Alert.alert('Copied', 'Referral code copied.'); }} />
            <ActionBtn icon="qr-code-outline" label="My QR" onPress={() => setQrOpen(true)} />
          </View>
        </View>

        {/* Account */}
        <View style={[S.card, { borderColor: '#3a1f23' }]}>
          <Text style={[S.sectionTitle, { color: '#ff9aa2' }]}>Account</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            <Pressable style={[S.secondary, { borderColor: C.danger }]} onPress={() =>
              Alert.alert('Sign out', 'Sign out from this device?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', style: 'destructive',
                  onPress: () => signOut.mutate(undefined, {
                    onError: (e:any)=>Alert.alert('Sign out failed', e?.message ?? 'Try again.'), onSuccess: ()=>router.replace('/'),
                  })},
              ])
            }>
              <Ionicons name="log-out-outline" size={16} color={C.danger} />
              <Text style={[S.secondaryText, { color: C.danger }]}>Sign out</Text>
            </Pressable>

            <Pressable style={[S.secondary, { borderColor: '#ff7f50' }]} onPress={() =>
              Alert.alert('Sign out everywhere?', 'This will revoke all active sessions.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out all', style: 'destructive',
                  onPress: () => signOutAll.mutate(undefined, {
                    onError: (e:any)=>Alert.alert('Sign out (all devices) failed', e?.message ?? 'Try again.'), onSuccess: ()=>router.replace('/'),
                  })},
              ])
            }>
              <Ionicons name="exit-outline" size={16} color="#ff7f50" />
              <Text style={[S.secondaryText, { color: '#ff7f50' }]}>Sign out all</Text>
            </Pressable>

            <Pressable style={[S.secondary, { borderColor: C.danger }]} onPress={() =>
              Alert.alert('Deactivate account?', 'This will deactivate your profile.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Deactivate', style: 'destructive',
                  onPress: () => softDelete.mutate(undefined, {
                    onSuccess: ()=>{ Alert.alert('Account deactivated', 'We deactivated your account.'); router.replace('/'); },
                    onError: (e:any)=>Alert.alert('Delete failed', e?.message ?? 'Try again.'),
                  })},
              ])
            }>
              <Ionicons name="trash-outline" size={16} color={C.danger} />
              <Text style={[S.secondaryText, { color: C.danger }]}>Deactivate</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* QR modal */}
      <Modal visible={qrOpen} animationType="fade" onRequestClose={() => setQrOpen(false)} transparent>
        <View style={S.modalWrap}>
          <View style={[S.card, { width: 320, alignItems: 'center' }]}>
            <Text style={S.sectionTitle}>My QR</Text>
            <View style={{ marginTop: 12, padding: 12, backgroundColor: '#fff', borderRadius: 12 }}>
              {QRCode ? <QRCode value={shareUrl} size={220} /> : <Text style={{ color: '#000' }}>{shareUrl}</Text>}
            </View>
            <Pressable onPress={() => setQrOpen(false)} style={[S.closeBtn, { marginTop: 16 }]}>
              <Ionicons name="close" size={22} color="#0b0e13" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RetryScreen({ title, subtitle, onRetry }: { title: string; subtitle: string; onRetry: () => void | Promise<any>; }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Text style={{ color: '#ff9aa2', fontWeight: '900', fontSize: 16, textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: C.sub, marginTop: 6, textAlign: 'center' }}>{subtitle}</Text>
      <Pressable onPress={onRetry} style={[S.secondary, { marginTop: 12 }]}>
        <Ionicons name="refresh" size={16} color={C.orange} />
        <Text style={S.secondaryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function ActionBtn({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; }) {
  return (
    <Pressable onPress={onPress} style={S.actionBtn} accessibilityRole="button">
      <Ionicons name={icon} size={16} color={C.orange} />
      <Text style={{ color: C.orange, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: C.sub, fontWeight: '700' }}>{children}</Text>;
}
function Input(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#6f7782"
      style={{
        backgroundColor: C.panel,
        borderWidth: 1,
        borderColor: C.border,
        color: C.text,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
      }}
    />
  );
}

const S = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141821', borderWidth: 1, borderColor: '#2a313c', padding: 12, borderRadius: 12 },
  sectionTitle: { color: C.text, fontWeight: '900', fontSize: 16 },
  card: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14 },
  primary: { backgroundColor: C.orange, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#0b0e13', fontWeight: '900' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.panel, borderWidth: 1, borderColor: C.orange, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  secondary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.panel, borderWidth: 1, borderColor: C.orange, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  secondaryText: { color: C.orange, fontWeight: '800' },
  progressOuter: { height: 10, borderRadius: 999, backgroundColor: '#0c1016', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 8 },
  progressInner: { height: '100%', backgroundColor: C.orange, borderRadius: 999 },
  bubble: { width: 28, height: 28, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  closeBtn: { backgroundColor: '#ffd79f', borderRadius: 999, padding: 10, borderWidth: 2, borderColor: '#332317', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  linkBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#3a4453' },
  linkBtnText: { color: '#ffd79f', fontWeight: '800' },
});
