// components/match/Stepper.tsx
import { View, Text, Alert } from 'react-native';
import { useStepper } from './hooks';
import StepSetup from './steps/StepSetup';
import StepPlayers from './steps/StepPlayers';
import StepScores from './steps/StepScores';
import StepSummary from './steps/StepSummary';
import { useCreateMatch } from '@/features/matches/hooks';
import { MatchDraftSchema } from '@/features/matches/schema';
import * as Haptics from 'expo-haptics';

export default function Stepper() {
  const { index, step, next, back, draft, setDraft, canSubmit } = useStepper();
  const createMatch = useCreateMatch();

  async function onSubmit() {
    try {
      const parsed = MatchDraftSchema.parse(draft);
      await createMatch.mutateAsync(parsed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Match submitted', 'Opponents will be asked to confirm.');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Validation failed', e?.message ?? 'Please check your inputs.');
    }
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Progress header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        {['Setup', 'Players', 'Scores', 'Summary'].map((label, i) => (
          <Text key={label} style={{ fontWeight: index === i ? '700' : '400', opacity: index >= i ? 1 : 0.5 }}>
            {label}
          </Text>
        ))}
      </View>

      {step === 'setup' && <StepSetup draft={draft} setDraft={(u) => setDraft(u)} onNext={next} />}
      {step === 'players' && <StepPlayers draft={draft} setDraft={(u) => setDraft(u)} onBack={back} onNext={next} />}
      {step === 'scores' && <StepScores draft={draft} setDraft={(u) => setDraft(u)} onBack={back} onNext={next} />}
      {step === 'summary' && (
        <StepSummary
          draft={draft}
          onBack={back}
          onSubmit={onSubmit}
          isSubmitting={createMatch.isPending}
          canSubmit={canSubmit}
        />
      )}
    </View>
  );
}
