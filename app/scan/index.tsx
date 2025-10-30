// app/scan/index.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/lib/theme';

export default function ScanQrScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: 8 }}>
        Scan QR
      </Text>
      <Text style={{ color: colors.subtext }}>
        Scanner coming soon. (Wire up expo-barcode-scanner here.)
      </Text>
    </View>
  );
}
