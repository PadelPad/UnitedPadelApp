// components/ui/StatPill.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { colors, radii } from '@/lib/theme';

export default function StatPill({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0e1116',
        borderWidth: 1,
        borderColor: colors.outline,
        borderRadius: radii.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
      <Text style={{ color: '#ffd79f', fontWeight: '900', marginRight: 6 }}>{value}</Text>
      <Text style={{ color: '#e6c8a4', fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </View>
  );
}
