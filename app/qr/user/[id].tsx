import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { colors, radii } from '@/lib/theme';

export default function UserQR() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const value = `up://user/${id}`;

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0e13', padding: 20, alignItems: 'center', gap: 16 }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>User QR</Text>
      <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: radii.lg }}>
        <QRCode value={value} size={220} />
      </View>
      <Text selectable style={{ color: '#9aa0a6' }}>{value}</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={() => Clipboard.setStringAsync(value)}
          style={{ backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radii.md }}
        >
          <Text style={{ color: '#0b0e13', fontWeight: '900' }}>Copy</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          style={{ borderWidth: 1, borderColor: colors.primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radii.md }}
        >
          <Text style={{ color: colors.primary, fontWeight: '900' }}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}
