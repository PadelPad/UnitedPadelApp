// components/GlobalFab.tsx
import React, { useState, useMemo } from 'react';
import { View, Pressable, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/lib/theme';
import { impact } from '@/lib/haptics';
import QuickActionSheet, { QuickAction } from '@/components/ui/QuickActionSheet';
import { useRouter } from 'expo-router';

export type FabProps = {
  /** Optional: override the default actions */
  actions?: QuickAction[];
  /** Optional: offset from edges */
  offset?: { right?: number; bottom?: number };
  /** Optional: hide the button entirely (you can keep the sheet logic) */
  hidden?: boolean;
};

export default function GlobalFab({ actions, offset, hidden }: FabProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const defaultActions: QuickAction[] = useMemo(
    () => [
      { key: 'submit', label: 'Submit Match', icon: 'add-circle', onPress: () => router.push('/submit' as any) },
      { key: 'tournament', label: 'Create Tournament', icon: 'trophy', onPress: () => router.push('/(tabs)/tournaments?create=1' as any) },
      { key: 'challenge', label: 'Challenge Player', icon: 'people', onPress: () => router.push('/(tabs)/matches?challenge=1' as any) },
    ],
    [router]
  );

  const items = actions && actions.length ? actions : defaultActions;

  return (
    <>
      {!hidden ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            right: offset?.right ?? 16,
            bottom: offset?.bottom ?? 24,
          }}
        >
          <Pressable
            onPress={() => {
              impact();
              setOpen(true);
            }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#332317',
              shadowColor: '#ff7b00',
              shadowOpacity: Platform.OS === 'ios' ? 0.45 : 0.25,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
            accessibilityRole="button"
            accessibilityLabel="Quick actions"
          >
            <Ionicons name="add" size={26} color={colors.bg} />
          </Pressable>
        </View>
      ) : null}

      <QuickActionSheet open={open} onClose={() => setOpen(false)} actions={items} />
    </>
  );
}
