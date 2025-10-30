// app/(tabs)/home/index.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

// 🔒 RELATIVE imports only
import { supabase } from '../../../lib/supabase';
import { colors, radii, shadow } from '../../../lib/theme';
import { success } from '../../../lib/haptics';
import TopNav from '../../../components/ui/TopNav';

type Profile = {
  id: string;
  username: string | null;
  rating: number | null;
  avatar_url: string | null;
  streak_days?: number | null;
};

type Tournament = {
  id: string;
  name: string;
  start_date?: string | null;
  city?: string | null;
  cover_url?: string | null;
};

async function fetchMe(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const id = auth?.user?.id;
  if (!id) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id,username,rating,avatar_url,streak_days')
    .eq('id', id)
    .single();
  return (data as any) ?? null;
}

async function fetchTournaments(): Promise<Tournament[]> {
  try {
    const { data } = await supabase
      .from('tournaments')
      .select('id,name,start_date,city,cover_url')
      .order('start_date', { ascending: true })
      .limit(5);
    return (data ?? []) as any;
  } catch {
    return [];
  }
}

const seedTournaments: Tournament[] = [
  {
    id: 'seed-1',
    name: 'United Padel Cup — London',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    city: 'London',
    cover_url:
      'https://images.unsplash.com/photo-1551024709-8f23befc6cf7?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'seed-2',
    name: 'Summer Doubles — Manchester',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9).toISOString(),
    city: 'Manchester',
    cover_url:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop',
  },
];

const SectionHeader = ({
  icon,
  title,
  onSeeAll,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onSeeAll?: () => void;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 18,
      marginBottom: 8,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{title}</Text>
    </View>
    {!!onSeeAll && (
      <Pressable onPress={onSeeAll}>
        <Text style={{ color: colors.subtext, fontWeight: '700' }}>See all</Text>
      </Pressable>
    )}
  </View>
);

const Pill = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(17,22,30,0.75)', // translucent so wallpaper breathes
      borderWidth: 1,
      borderColor: colors.outline,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
    }}
  >
    <Ionicons name={icon} size={16} color="#ffd79f" />
    <Text style={{ color: '#ffd79f', fontWeight: '900' }}>{value}</Text>
    <Text style={{ color: '#b9bdc3', fontWeight: '700' }}>{label}</Text>
  </View>
);

// Animated brand belt
const BrandTicker = () => {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = () =>
      Animated.sequence([
        Animated.timing(x, { toValue: -240, duration: 6500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]).start(() => loop());
    loop();
  }, [x]);

  const items = useMemo(
    () => [
      { key: 'u1', label: 'United Padel', icon: 'flame' as const },
      { key: 'u2', label: 'Club+ Events', icon: 'trophy' as const },
      { key: 'u3', label: 'Leaderboards', icon: 'stats-chart' as const },
      { key: 'u4', label: 'Badges', icon: 'medal' as const },
      { key: 'u5', label: 'Tournaments', icon: 'tennisball' as const },
    ],
    []
  );

  const Chip = ({ label, icon }: { label: string; icon: keyof typeof Ionicons.glyphMap }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(17,22,30,0.65)',
        borderWidth: 1,
        borderColor: colors.outline,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        marginRight: 12,
      }}
    >
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={{ color: '#ced2d8', fontWeight: '700' }}>{label}</Text>
    </View>
  );

  return (
    <View style={{ overflow: 'hidden', paddingVertical: 6, marginBottom: 4 }}>
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: x }] }}>
        {[...items, ...items].map((i, idx) => (
          <Chip key={`${i.key}-${idx}`} label={i.label} icon={i.icon} />
        ))}
      </Animated.View>
    </View>
  );
};

export default function Home() {
  const router = useRouter();

  const { data: me, isLoading: loadingMe } = useQuery({ queryKey: ['me'], queryFn: fetchMe });
  const { data: tourns = [], isLoading: loadingT } = useQuery({
    queryKey: ['tourns'],
    queryFn: fetchTournaments,
  });

  const rating = Math.round(me?.rating ?? 1000);
  const streak = me?.streak_days ?? 0;
  const username = me?.username || 'Player';

  const xpCurrent = 100;
  const xpTarget = 150;
  const xpPct = Math.max(0, Math.min(1, xpCurrent / xpTarget));

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <TopNav />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }}
      >
        {/* HERO */}
        <View
          style={{
            padding: 18,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(17,22,30,0.80)',
            ...shadow.soft,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: 'rgba(15,20,27,0.75)',
                borderWidth: 1,
                borderColor: colors.outline,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              {me?.avatar_url ? (
                <Image source={{ uri: me.avatar_url }} style={{ width: 56, height: 56, borderRadius: 14 }} />
              ) : (
                <Ionicons name="sparkles" size={26} color={colors.primary} />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>
                {loadingMe ? 'Welcome' : username}
              </Text>
              <Text style={{ color: '#c9ced6', marginTop: 4 }}>Your padel journey, gamified.</Text>
            </View>

            <Pressable
              onPress={() => {
                router.push('/(tabs)/leaderboard');
                success();
              }}
              style={{
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderWidth: 1,
                borderColor: colors.outline,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="stats-chart" size={16} color={colors.primary} />
                <Text style={{ color: '#fff', fontWeight: '800' }}>Leaderboard</Text>
              </View>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Pill icon="flash" label="Rating" value={rating} />
            <Pill icon="flame" label="Streak" value={`${streak}d`} />
          </View>

          <View
            style={{
              marginTop: 16,
              backgroundColor: 'rgba(15,20,27,0.7)',
              borderWidth: 1,
              borderColor: colors.outline,
              padding: 14,
              borderRadius: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '900' }}>Level 1</Text>
              <Text style={{ color: '#dfe3e9', fontWeight: '900' }}>
                {xpCurrent} / {xpTarget} XP
              </Text>
            </View>

            <View
              style={{
                height: 10,
                backgroundColor: 'rgba(0,0,0,0.45)',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.outline,
                overflow: 'hidden',
              }}
            >
              <View style={{ height: '100%', width: `${xpPct * 100}%`, backgroundColor: colors.primary }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              {[
                { label: 'Ranking', value: '#3' },
                { label: 'Matches Won', value: '—' },
                { label: 'Active Streak', value: String(streak ?? 0) },
              ].map((s) => (
                <View
                  key={s.label}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(17,22,30,0.75)',
                    borderWidth: 1,
                    borderColor: colors.outline,
                    paddingVertical: 12,
                    borderRadius: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#c9ced6', fontWeight: '700' }}>{s.label}</Text>
                  <Text style={{ color: '#fff', fontWeight: '900', marginTop: 6 }}>{s.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <Pressable
              onPress={() => {
                router.push('/submit');
                success();
              }}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="add-circle" size={18} color="#111" />
                <Text style={{ color: '#111', fontWeight: '900' }}>Submit Match</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => {
                router.push('/(tabs)/matches');
                success();
              }}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: colors.outline,
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="tennisball" size={18} color={colors.primary} />
                <Text style={{ color: '#fff', fontWeight: '900' }}>My Matches</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <BrandTicker />

        <SectionHeader icon="trophy" title="Challenges" onSeeAll={() => {}} />
        <View
          style={{
            backgroundColor: 'rgba(17,22,30,0.78)',
            borderWidth: 1,
            borderColor: colors.outline,
            borderRadius: radii.lg,
            padding: 14,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.primary15,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.outline,
              }}
            >
              <Ionicons name="flash" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Complete 3 matches</Text>
              <Text style={{ color: '#c9ced6', marginTop: 4 }}>Progress: 0 / 3</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
          </View>
          <View
            style={{
              height: 8,
              backgroundColor: 'rgba(0,0,0,0.45)',
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.outline,
              marginTop: 12,
              overflow: 'hidden',
            }}
          >
            <View style={{ height: '100%', width: '0%', backgroundColor: colors.primary }} />
          </View>
        </View>

        <SectionHeader
          icon="calendar"
          title="Upcoming Matches"
          onSeeAll={() => router.push('/(tabs)/matches')}
        />
        <Text style={{ color: colors.subtext, marginBottom: 8 }}>No matches scheduled yet.</Text>

        <SectionHeader
          icon="tennisball"
          title="Tournaments"
          onSeeAll={() => router.push('/(tabs)/tournaments')}
        />
        {loadingT ? (
          <ActivityIndicator color={colors.primary} />
        ) : (tourns.length ? tourns : seedTournaments).length ? (
          <FlatList
            data={tourns.length ? tourns : seedTournaments}
            keyExtractor={(i) => i.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push('/(tabs)/tournaments')}
                style={{
                  width: 260,
                  backgroundColor: 'rgba(17,22,30,0.78)',
                  borderWidth: 1,
                  borderColor: colors.outline,
                  borderRadius: radii.lg,
                  overflow: 'hidden',
                }}
              >
                <View style={{ height: 120, backgroundColor: 'rgba(15,20,27,0.7)' }}>
                  {!!item.cover_url && (
                    <Image source={{ uri: item.cover_url }} style={{ width: '100%', height: '100%' }} />
                  )}
                </View>
                <View style={{ padding: 12 }}>
                  <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.subtext, marginTop: 6 }}>
                    {item.start_date ? new Date(item.start_date).toLocaleDateString() : 'TBA'}
                    {item.city ? ` • ${item.city}` : ''}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        ) : (
          <Text style={{ color: colors.subtext }}>No upcoming tournaments yet.</Text>
        )}

        <SectionHeader icon="medal" title="Badges" onSeeAll={() => router.push('/(tabs)/profile')} />
        <View
          style={{
            backgroundColor: 'rgba(17,22,30,0.78)',
            borderWidth: 1,
            borderColor: colors.outline,
            borderRadius: radii.lg,
            padding: 14,
          }}
        >
          <Text style={{ color: '#dfe3e9' }}>Earn your first badge by playing a match!</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            {['sparkles', 'ribbon', 'trophy'].map((ic) => (
              <View
                key={ic}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(15,20,27,0.7)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.outline,
                }}
              >
                <Ionicons name={ic as any} size={20} color={colors.primary} />
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: Platform.select({ ios: 28, android: 20, default: 20 }) }} />
      </ScrollView>
    </View>
  );
}
