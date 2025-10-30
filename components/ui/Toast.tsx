// components/ui/Toast.tsx
import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radii } from '@/lib/theme';
import { impact } from '@/lib/haptics';

type ToastKind = 'success' | 'error' | 'info';
type ToastApi = { show: (msg: string, kind?: ToastKind) => void };

const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState('');
  const [kind, setKind] = useState<ToastKind>('info');

  const y = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const api = useMemo<ToastApi>(
    () => ({
      show(message, k = 'info') {
        setMsg(message);
        setKind(k);
        setVisible(true);
        impact(); // subtle haptic
        Animated.parallel([
          Animated.timing(y, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start(() => {
          const timer = setTimeout(() => {
            Animated.parallel([
              Animated.timing(y, { toValue: 60, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start(() => setVisible(false));
          }, 1800);
          return () => clearTimeout(timer);
        });
      },
    }),
    [opacity, y]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {visible ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 24,
            alignItems: 'center',
            transform: [{ translateY: y }],
            opacity,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: radii.lg,
              backgroundColor:
                kind === 'success' ? '#19361f' : kind === 'error' ? '#3a1a1a' : '#10151d',
              borderWidth: 1,
              borderColor: colors.outline,
            }}
          >
            <Ionicons
              name={
                kind === 'success'
                  ? 'checkmark-circle'
                  : kind === 'error'
                  ? 'close-circle'
                  : 'information-circle'
              }
              size={18}
              color={kind === 'success' ? '#6CFF8E' : kind === 'error' ? '#ff9aa2' : '#fff'}
            />
            <Text style={{ color: '#fff', fontWeight: '800' }}>{msg}</Text>
            <Pressable onPress={() => setVisible(false)}>
              <Ionicons name="close" size={16} color="#cfd3da" />
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider/>');
  return ctx;
}
