import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const C = {
  orange: '#ff6a00',
  panel: '#0e1116',
  border: '#303845',
  text: '#e5e8ef',
  bg: '#0b0e13',
};

type Props = {
  containerStyle?: StyleProp<ViewStyle>;
  bottomOffset?: number;
  hidden?: boolean;
  /** pass this if you know it; we also try to read from context safely */
  tabBarHeightOverride?: number;
};

function useSafeTabBarHeight(override?: number) {
  if (typeof override === 'number') return override;
  // Call hook once; if context missing, catch and fall back to 0
  try {
    return useBottomTabBarHeight();
  } catch {
    return 0;
  }
}

export default function GlobalFab({ containerStyle, bottomOffset = 0, hidden, tabBarHeightOverride }: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const tabH = useSafeTabBarHeight(tabBarHeightOverride);
  const router = useRouter();

  if (hidden) return null;

  const bottom = Math.max(12, tabH + insets.bottom + 8) + bottomOffset;

  const act = (fn: () => void) => {
    Haptics.selectionAsync();
    setOpen(false);
    fn();
  };

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { zIndex: 99 }, containerStyle]}>
      {open ? (
        <Pressable
          onPress={() => setOpen(false)}
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)' }}
          accessibilityLabel="Close quick actions"
        />
      ) : null}

      <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom }}>
        {open ? (
          <View style={{ alignItems: 'flex-end', gap: 10, marginBottom: 10 }}>
            <Action
              icon="tennisball"
              label="Submit match"
              onPress={() => act(() => router.push('/submit'))}
            />
            <Action
              icon="qr-code"
              label="Scan QR"
              onPress={() => act(() => router.push('/submit/scan'))}
            />
            <Action
              icon="bar-chart"
              label="Leaderboard"
              onPress={() => act(() => router.push('/(tabs)/leaderboard'))}
            />
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? 'Close quick actions' : 'Open quick actions'}
          onPress={() => {
            Haptics.selectionAsync();
            setOpen((v) => !v);
          }}
          style={({ pressed }) => [
            styles.fab,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <Ionicons name={open ? 'close' : 'add'} size={24} color={C.bg} />
        </Pressable>
      </View>
    </View>
  );
}

function Action({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.action}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={C.orange} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 58, height: 58, borderRadius: 999, backgroundColor: C.orange,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#2a180b',
    shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 6 }, shadowRadius: 10,
    elevation: 8,
  },
  action: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.panel, borderWidth: 1, borderColor: C.border,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12,
  },
  actionText: { color: C.text, fontWeight: '800' },
});
