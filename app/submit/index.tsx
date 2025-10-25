// app/submit/index.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { eloProject, submitMatchTx, type EloProjection, type MatchCategory } from '@/lib/utils/elo';

type User = { id: string; username: string | null; rating: number | null };

const CATEGORY_META: Array<{ key: MatchCategory; label: string; k: number }> = [
  { key: 'friendly',              label: 'Friendly',              k: 16 },
  { key: 'club_league',           label: 'Club League',           k: 32 },
  { key: 'official_tournament',   label: 'Official Tournament',   k: 50 },
  { key: 'corporate_challenge',   label: 'Corporate Challenge',   k: 25 },
  { key: 'national_championship', label: 'National Championship', k: 75 },
];

async function getMe(): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error('Not signed in');
  const { data: prof, error: perr } = await supabase
    .from('profiles')
    .select('id, username, rating')
    .eq('id', uid)
    .single();
  if (perr) throw perr;
  return prof as any;
}

async function searchUsersByUsername(term: string): Promise<User[]> {
  if (!term) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, rating')
    .ilike('username', `%${term}%`)
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export default function SubmitMatchScreen() {
  const router = useRouter();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });

  // form state
  const [isDoubles, setIsDoubles] = useState(false);
  const myId = me?.id ?? '';
  const [allyId, setAllyId] = useState<string | null>(null);

  const [opp1, setOpp1] = useState<string | null>(null);
  const [opp2, setOpp2] = useState<string | null>(null);

  const [winnerTeam, setWinnerTeam] = useState<1 | 2>(1);
  const [score, setScore] = useState<string>('6-4 6-4');

  // NEW: use your weight categories (K-factor shown)
  const [category, setCategory] = useState<MatchCategory>('friendly');

  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');

  // opponent search box (shared for all quick picks)
  const [query, setQuery] = useState('');
  const { data: results = [], isFetching: searching } = useQuery({
    queryKey: ['user-search', query],
    queryFn: () => searchUsersByUsername(query),
    enabled: query.length >= 2,
  });

  useEffect(() => {
    setMatchType(isDoubles ? 'doubles' : 'singles');
  }, [isDoubles]);

  const team1 = useMemo(
    () => (isDoubles ? [myId, ...(allyId ? [allyId] : [])] : [myId]),
    [isDoubles, myId, allyId]
  );
  const team2 = useMemo(
    () => (isDoubles ? [opp1, opp2].filter(Boolean) as string[] : [opp1].filter(Boolean) as string[]),
    [isDoubles, opp1, opp2]
  );

  const canProject =
    !!myId &&
    team1.length > 0 &&
    team2.length > 0 &&
    !!opp1 &&
    (isDoubles ? !!opp2 : true);

  const [projection, setProjection] = useState<EloProjection | null>(null);

  const projectMut = useMutation({
    mutationFn: async () =>
      eloProject({
        team1_ids: team1,
        team2_ids: team2,
        category,
        winner_team: winnerTeam,
      }),
    onSuccess: setProjection,
    onError: () => setProjection(null),
  });

  const submitMut = useMutation({
    mutationFn: async () =>
      submitMatchTx({
        match_type: matchType,
        category,
        score,
        team1_ids: team1,
        team2_ids: team2,
        winner_team: winnerTeam,
      }),
    onSuccess: ({ match_id, projection }) => {
      setProjection(projection);
      router.replace(`/match/${match_id}`);
    },
  });

  useEffect(() => {
    if (canProject) projectMut.mutate();
    else setProjection(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(team1), JSON.stringify(team2), category, winnerTeam]);

  const kNow = CATEGORY_META.find((c) => c.key === category)?.k ?? 20;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: '#0b0e13' }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={[{ key: 'form' }]}
      renderItem={() => (
        <View style={{ gap: 14 }}>
          <Text style={styles.h1}>Submit match</Text>

          {/* Singles vs Doubles */}
          <View style={styles.rowBetween}>
            <Pressable
              onPress={() => setIsDoubles(false)}
              style={[styles.pill, !isDoubles && styles.pillActive]}
            >
              <Text style={[styles.pillText, !isDoubles && styles.pillTextActive]}>Singles</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsDoubles(true)}
              style={[styles.pill, isDoubles && styles.pillActive]}
            >
              <Text style={[styles.pillText, isDoubles && styles.pillTextActive]}>Doubles</Text>
            </Pressable>
          </View>

          {/* Category (K factor visible) */}
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Match type & weighting</Text>
            <View style={styles.catRow}>
              {CATEGORY_META.map((c) => (
                <Pressable
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={[styles.pill, category === c.key && styles.pillActive]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      category === c.key && styles.pillTextActive,
                    ]}
                  >
                    {c.label} (K={c.k})
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Winner */}
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Winner</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => setWinnerTeam(1)} style={[styles.pill, winnerTeam === 1 && styles.pillActive]}>
                <Text style={[styles.pillText, winnerTeam === 1 && styles.pillTextActive]}>Team 1 (You)</Text>
              </Pressable>
              <Pressable onPress={() => setWinnerTeam(2)} style={[styles.pill, winnerTeam === 2 && styles.pillActive]}>
                <Text style={[styles.pillText, winnerTeam === 2 && styles.pillTextActive]}>Team 2</Text>
              </Pressable>
            </View>
          </View>

          {/* Teams */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Team 1</Text>
            <Text style={styles.smallMuted}>
              You{isDoubles ? (allyId ? ' + ally added' : ' + add ally') : ''}
            </Text>
            {isDoubles && (
              <RowPicker
                placeholder="Add ally by username…"
                onPick={(u) => setAllyId(u.id)}
                query={query}
                setQuery={setQuery}
                results={results}
                searching={searching}
              />
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Team 2 (opponents)</Text>
            <RowPicker
              placeholder="Opponent 1 username…"
              onPick={(u) => setOpp1(u.id)}
              query={query}
              setQuery={setQuery}
              results={results}
              searching={searching}
            />
            {isDoubles && (
              <RowPicker
                placeholder="Opponent 2 username…"
                onPick={(u) => setOpp2(u.id)}
                query={query}
                setQuery={setQuery}
                results={results}
                searching={searching}
              />
            )}
          </View>

          {/* Score */}
          <View>
            <Text style={styles.label}>Score</Text>
            <TextInput
              value={score}
              onChangeText={setScore}
              placeholder="e.g. 6-4 6-4"
              placeholderTextColor="#6b7280"
              style={styles.input}
            />
          </View>

          {/* Projection */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Rating projection</Text>
              {(projectMut.isPending || submitMut.isPending) && (
                <ActivityIndicator color="#ff6a00" />
              )}
            </View>
            <Text style={styles.muted}>
              Using K = {kNow}. Higher K → bigger rating swings.
            </Text>

            {!canProject ? (
              <Text style={styles.muted}>Add opponents (and partner if doubles) to see Elo changes.</Text>
            ) : projection ? (
              <ProjectionView proj={projection} />
            ) : projectMut.isError ? (
              <Text style={styles.error}>Couldn’t compute projection. Check teams.</Text>
            ) : (
              <Text style={styles.muted}>Calculating…</Text>
            )}
          </View>

          {/* Submit */}
          <Pressable
            disabled={!canProject || submitMut.isPending}
            onPress={() => submitMut.mutate()}
            style={[
              styles.submitBtn,
              (!canProject || submitMut.isPending) && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="checkmark-circle" size={18} color="#0b0e13" />
            <Text style={styles.submitText}>
              {submitMut.isPending ? 'Submitting…' : 'Submit match'}
            </Text>
          </Pressable>
        </View>
      )}
    />
  );
}

/* ---------- Small components ---------- */

function RowPicker({
  placeholder,
  onPick,
  query,
  setQuery,
  results,
  searching,
}: {
  placeholder: string;
  onPick: (u: User) => void;
  query: string;
  setQuery: (s: string) => void;
  results: User[];
  searching: boolean;
}) {
  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        style={styles.input}
      />
      {searching ? (
        <ActivityIndicator color="#ff6a00" />
      ) : results.length > 0 ? (
        <View style={{ gap: 6 }}>
          {results.map((u) => (
            <Pressable key={u.id} onPress={() => onPick(u)} style={styles.pickRow}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{u.username || u.id.slice(0,8)}</Text>
              <Text style={{ color: '#9aa0a6' }}>{Math.round(u.rating ?? 1000)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ProjectionView({ proj }: { proj: EloProjection }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.muted}>
        Win prob — Team1 {Math.round(proj.exp1 * 100)}% vs Team2 {Math.round(proj.exp2 * 100)}%
      </Text>
      {([1,2] as const).map(team => (
        <View key={team} style={{ gap: 6 }}>
          <Text style={styles.teamHdr}>Team {team}</Text>
          {proj.items.filter(i => i.team === team).map(i => (
            <View key={i.user_id} style={styles.deltaRow}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{i.user_id.slice(0,8)}…</Text>
              <Text style={{ color: i.delta >= 0 ? '#7bd88f' : '#ff8370', fontWeight: '800' }}>
                {i.delta >= 0 ? '+' : ''}{i.delta} → {i.new}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  h1: { color: '#fff', fontSize: 26, fontWeight: '900' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { color: '#9aa0a6', fontWeight: '700', marginBottom: 6 },

  pill: {
    borderWidth: 1, borderColor: '#28303a',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#0e1116',
    marginRight: 6,
  },
  pillActive: { borderColor: '#ff6a00', backgroundColor: '#141821' },
  pillText: { color: '#9aa0a6', fontWeight: '700' },
  pillTextActive: { color: '#ff6a00' },

  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  input: {
    backgroundColor: '#0e1116',
    borderWidth: 1, borderColor: '#1f2630',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    color: '#fff',
  },

  card: {
    backgroundColor: '#0e1116',
    borderWidth: 1, borderColor: '#1f2630',
    borderRadius: 12, padding: 12, gap: 8,
  },
  cardTitle: { color: '#fff', fontWeight: '800' },
  smallMuted: { color: '#9aa0a6', fontSize: 12 },

  pickRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#10151d', borderWidth: 1, borderColor: '#1f2630',
    padding: 10, borderRadius: 10,
  },

  teamHdr: { color: '#ffb86b', fontWeight: '800', marginTop: 6 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  muted: { color: '#9aa0a6' },
  error: { color: '#ff6a00' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ff6a00', paddingVertical: 12, borderRadius: 12,
  },
  submitText: { color: '#0b0e13', fontWeight: '900' },
});
