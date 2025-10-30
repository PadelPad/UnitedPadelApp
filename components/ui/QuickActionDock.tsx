// components/ui/QuickActionDock.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { colors, radii, shadow } from '@/lib/theme';
import { impact } from '@/lib/haptics';

export type Action = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: string;         // use this to navigate
  onPress?: () => void;  // or handle yourself
};

type Props = {
  actions: Action[];
  open?: boolean;        // optional controlled mode
  onClose?: () => void;
};

export default function QuickActionDock({ actions, open, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // internal open state (supports controlled & uncontrolled)
  const [isOpen, setIsOpen] = useState(Boolean(open));
  useEffect(() => {
    if (typeof open === 'boolean') setIsOpen(open);
  }, [open]);

  // simple Animated for scale/alpha
  const scale = useRef(new Animated.Value(0)).current;
  const alpha = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const to = isOpen ? 1 : 0;
    Animated.parallel([
      Animated.timing(scale, { toValue: to, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(alpha, { toValue: to, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [isOpen]);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (!next && onClose) onClose();
    impact();
  };

  const handleAction = (a: Action) => {
    impact();
    if (a.onPress) a.onPress();
    else if (a.href) router.push(a.href as never);
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      {/* Toggle (+) — floats above the bar, bottom-right */}
      <View
        pointerEvents="box-none"
        style={[
          styles.fabWrap,
          { bottom: Math.max(insets.bottom, 10) + 70, right: 16 }, // ~70 to sit above the tab bar neatly
        ]}
      >
        <Pressable onPress={toggle} style={styles.fab} accessibilityRole="button">
          <Ionicons name={isOpen ? 'close' : 'add'} size={22} color={colors.bg} />
        </Pressable>
      </View>

      {/* Action panel */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.panelWrap,
          {
            bottom: Math.max(insets.bottom, 10) + 120,
            right: 16,
            opacity: alpha,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.panel}>
          {actions.map((a) => (
            <Pressable
              key={a.key}
              onPress={() => handleAction(a)}
              style={styles.actionRow}
              accessibilityRole="button"
            >
              <View style={styles.actionIcon}>
                <Ionicons name={a.icon} size={16} color={colors.primary} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    zIndex: 30,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3a2413',
    ...shadow.soft,
  },
  panelWrap: {
    position: 'absolute',
    zIndex: 29,
  },
  panel: {
    backgroundColor: '#0f141b',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radii.lg,
    paddingVertical: 8,
    minWidth: 190,
    ...shadow.soft,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.primary15,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionLabel: {
    color: '#fff',
    fontWeight: '800',
  },
});
