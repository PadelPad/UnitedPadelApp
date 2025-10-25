// components/match/steps/StepPlayers.tsx
import { View, Text, TextInput, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import type { MatchDraft } from '@/features/matches/schema';

export default function StepPlayers({
  draft,
  setDraft,
  onBack,
  onNext,
}: {
  draft: MatchDraft;
  setDraft: (updater: (d: MatchDraft) => MatchDraft) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const parseCsv = (t: string) => t.split(',').map((s) => s.trim()).filter(Boolean);

  const autoFillMe = async () => {
    const { data } = await supabase.auth.getUser();
    const me = data.user?.id;
    if (me) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDraft((d) => ({
        ...d,
        submitted_by: me,
        team1: d.team1.length ? d.team1 : [me],
      }));
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Players</Text>

      <Text>Team 1 (comma-separated user IDs)</Text>
      <TextInput
        placeholder="uuid1,uuid2"
        value={draft.team1.join(',')}
        onChangeText={(t) => setDraft((d) => ({ ...d, team1: parseCsv(t) }))}
        style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
      />

      <Text>Team 2 (comma-separated user IDs)</Text>
      <TextInput
        placeholder="uuid3,uuid4"
        value={draft.team2.join(',')}
        onChangeText={(t) => setDraft((d) => ({ ...d, team2: parseCsv(t) }))}
        style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
      />

      <Pressable onPress={autoFillMe} style={{ borderWidth: 1, padding: 10, borderRadius: 10, alignSelf: 'flex-start' }}>
        <Text>Auto-fill me</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}>
          <Text>Back</Text>
        </Pressable>
        <Pressable onPress={onNext} style={{ backgroundColor: '#111', padding: 12, borderRadius: 10 }}>
          <Text style={{ color: '#fff' }}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}
