// components/FinalizeRatingsButton.tsx
import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinalizeMatch } from '@/features/matches/hooks';

export default function FinalizeRatingsButton({
  matchId,
  disabled,
  onDone,
}: {
  matchId: string;
  disabled?: boolean;
  onDone?: () => void;
}) {
  const mut = useFinalizeMatch();

  return (
    <Pressable
      disabled={!!disabled || mut.isPending}
      onPress={async () => {
        try {
          const res = await mut.mutateAsync(matchId);
          // Optional: toast here
          onDone?.();
        } catch (e) {
          // Optional: toast error here
          console.warn('[Finalize] error', e);
        }
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#ff6a00',
        paddingVertical: 12,
        borderRadius: 12,
        opacity: disabled || mut.isPending ? 0.6 : 1,
      }}
      accessibilityRole="button"
      accessibilityLabel="Finalize ratings"
    >
      {mut.isPending ? (
        <ActivityIndicator color="#0b0e13" />
      ) : (
        <Ionicons name="checkmark-circle" size={18} color="#0b0e13" />
      )}
      <Text style={{ color: '#0b0e13', fontWeight: '900' }}>Finalize ratings</Text>
    </Pressable>
  );
}
