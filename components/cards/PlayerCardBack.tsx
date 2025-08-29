import React from 'react';
import { ImageBackground, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

export type PlayerCardBackProps = {
  bg: any;
  width: number;
  height: number;
  stats?: {
    matches?: number;
    wins?: number;
    winRatePct?: number;
    streak?: number;
  };
  region?: string | null;
  gender?: string | null;
  preferred?: string | null;
};

export default function PlayerCardBack({
  bg, width, height, stats, region, gender, preferred,
}: PlayerCardBackProps) {
  const s = stats || {};
  return (
    <ImageBackground
      source={bg}
      style={{ width, height, borderRadius: 22, overflow: 'hidden' }}
      imageStyle={{ borderRadius: 22 }}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.85)']}
        style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}
      >
        <View style={{ gap: 6 }}>
          <Meta icon="location" label={region || '—'} />
          {gender ? <Meta icon="male-female" label={gender} /> : null}
          {preferred ? <Meta icon="tennisball" label={preferred} /> : null}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'rgba(0,0,0,0.35)',
            padding: 10,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Stat label="Matches" value={s.matches ?? 0} />
          <Divider />
          <Stat label="Wins" value={s.wins ?? 0} />
          <Divider />
          <Stat label="Win %" value={s.winRatePct != null ? `${s.winRatePct}%` : '—'} />
          <Divider />
          <Stat label="Streak" value={s.streak ?? 0} />
        </View>

        <Text style={{ color: '#e5e5ec', opacity: 0.8, fontSize: 12, textAlign: 'center' }}>
          Tap to flip
        </Text>
      </LinearGradient>
    </ImageBackground>
  );
}

function Meta({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={14} color="#ffd79f" />
      <Text style={{ color: '#fff', fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={{ minWidth: 64, alignItems: 'center' }}>
      <Text style={{ color: '#ffe0b0', fontWeight: '900', fontSize: 16 }}>{value}</Text>
      <Text style={{ color: '#cbcbd7', fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.08)' }} />;
}
