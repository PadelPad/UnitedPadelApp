// components/match/steps/StepSummary.tsx
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import type { MatchDraft } from '@/features/matches/schema';

export default function StepSummary({
  draft,
  onBack,
  onSubmit,
  isSubmitting,
  canSubmit,
}: {
  draft: MatchDraft;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Review</Text>

      <Text>Type: {draft.match_type}</Text>
      <Text>Level: {draft.match_level}</Text>
      <Text>Date: {draft.date}</Text>
      <Text>Team 1: {draft.team1.join(', ') || '—'}</Text>
      <Text>Team 2: {draft.team2.join(', ') || '—'}</Text>
      <Text>Sets: {draft.sets.map((s) => `${s.t1}-${s.t2}${s.super_tiebreak ? ' (STB)' : ''}`).join(', ')}</Text>

      <Pressable
        disabled={!canSubmit || isSubmitting}
        onPress={onSubmit}
        style={{
          backgroundColor: canSubmit ? '#ff6a00' : '#999',
          padding: 12,
          borderRadius: 10,
          alignItems: 'center',
        }}
        accessibilityLabel="Submit match"
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Submit</Text>}
      </Pressable>

      <Pressable onPress={onBack} style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}>
        <Text>Back</Text>
      </Pressable>
    </View>
  );
}
