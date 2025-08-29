import React from 'react';
import { View, Text } from 'react-native';

// If you already built the real scanner screen elsewhere, keep that instead.
// This placeholder prevents broken routes.
export default function Scan() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0b0e13', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff' }}>Scanner goes here (Submit → Scan QR)</Text>
    </View>
  );
}
