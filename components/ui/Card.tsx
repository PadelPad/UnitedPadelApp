// components/ui/Card.tsx
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors, radii, shadow } from '@/lib/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  border?: boolean;
};

export default function Card({ children, style, elevated = false, border = true }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: 16,
          borderWidth: border ? 1 : 0,
          borderColor: colors.outline,
        },
        elevated ? shadow.soft : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
