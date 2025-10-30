// components/ui/QuickActionSheet.tsx
import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radii } from '@/lib/theme';
import { impact } from '@/lib/haptics';
import { useRouter } from 'expo-router';

export type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  actions?: QuickAction[];
};

export default function QuickActionSheet({ open, onClose, actions }: Props) {
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();

  const items: QuickAction[] =
    actions && actions.length
      ? actions
      : [
          {
            key: 'submit',
            label: 'Submit Match',
            icon: 'add-circle',
            onPress: () => router.push('/submit' as any),
          },
          {
            key: 'tournament',
            label: 'Create Tournament',
            icon: 'trophy',
            onPress: () => router.push('/(tabs)/tournaments?create=1' as any),
          },
          {
            key: 'challenge',
            label: 'Challenge Player',
            icon: 'people',
            onPress: () => router.push('/(tabs)/matches?challenge=1' as any),
          },
        ];

  // Note: omit "key" from props here to avoid duplicate "key" when spreading
  const ItemComp = ({
    icon,
    label,
    onPress
  }: Omit<QuickAction, 'key'>) => (
    <Pressable
      onPress={() => {
        impact();
        try {
          onPress();
        } finally {
          onClose();
        }
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: radii.lg,
        backgroundColor: '#0e1116',
        borderWidth: 1,
        borderColor: colors.outline,
      }}
    >
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal animationType="fade" visible={open} transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
        accessibilityRole="button"
        accessibilityLabel="Close quick actions"
      />

      <View
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12 + bottom,
          backgroundColor: '#0d1117',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.outline,
          padding: 14,
          gap: 10,
        }}
      >
        {items.map(({ key, ...rest }) => (
          <ItemComp key={key} {...rest} />
        ))}
      </View>
    </Modal>
  );
}
