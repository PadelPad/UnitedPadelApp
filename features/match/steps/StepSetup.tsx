// components/match/steps/StepSetup.tsx
import { View, Text, TextInput, Pressable } from 'react-native';
import type { MatchDraft } from '@/features/matches/schema';

export default function StepSetup({
  draft,
  setDraft,
  onNext,
}: {
  draft: MatchDraft;
  setDraft: (updater: (d: MatchDraft) => MatchDraft) => void;
  onNext: () => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Basics</Text>

      <Text style={{ fontWeight: '600' }}>Match type (singles/doubles)</Text>
      <TextInput
        accessibilityLabel="Match type"
        value={draft.match_type}
        onChangeText={(t) => setDraft((d) => ({ ...d, match_type: (t as any) || 'doubles' }))}
        style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
      />

      <Text style={{ fontWeight: '600' }}>Level (friendly/league/tournament/nationals)</Text>
      <TextInput
        accessibilityLabel="Match level"
        value={draft.match_level}
        onChangeText={(t) => setDraft((d) => ({ ...d, match_level: (t as any) || 'friendly' }))}
        style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
      />

      <Text style={{ fontWeight: '600' }}>Date (ISO string)</Text>
      <TextInput
        accessibilityLabel="Match date ISO"
        value={draft.date}
        onChangeText={(t) => setDraft((d) => ({ ...d, date: t }))}
        style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
      />

      <View style={{ alignItems: 'flex-end' }}>
        <Pressable onPress={onNext} style={{ backgroundColor: '#111', padding: 12, borderRadius: 10 }}>
          <Text style={{ color: '#fff' }}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}
