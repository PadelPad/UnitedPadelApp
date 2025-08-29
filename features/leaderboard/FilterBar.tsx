// features/leaderboard/FilterBar.tsx
import React from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import { Region } from './hooks';
import { colors, radii } from '@/lib/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function FilterBar({
  search,
  onSearchChange,
  regions,
  regionId,
  onRegionChange,
  loading,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  regions: Region[];
  regionId: string | null;
  onRegionChange: (v: string | null) => void;
  loading?: boolean;
}) {
  return (
    <View style={{ paddingHorizontal: 16, gap: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#10151d',
          borderWidth: 1,
          borderColor: '#1f2630',
          borderRadius: radii.lg,
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name="search" size={18} color="#9aa0a6" />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search players…"
          placeholderTextColor="#6f7785"
          style={{ flex: 1, color: '#fff', paddingVertical: 10, marginLeft: 8 }}
        />
        {search.length > 0 && (
          <Pressable onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={18} color="#9aa0a6" />
          </Pressable>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => onRegionChange(null)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: regionId ? '#1f2630' : colors.primary,
            backgroundColor: regionId ? '#0e1116' : '#201109',
          }}
        >
          <Text style={{ color: regionId ? '#9aa0a6' : colors.primary, fontWeight: '800' }}>
            All regions
          </Text>
        </Pressable>

        {/* show first 3 regions as quick chips; a full selector can come later */}
        {(regions ?? []).slice(0, 3).map((r) => {
          const active = regionId === r.id;
          return (
            <Pressable
              key={r.id}
              onPress={() => onRegionChange(active ? null : r.id)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: active ? colors.primary : '#1f2630',
                backgroundColor: active ? '#201109' : '#0e1116',
              }}
            >
              <Text style={{ color: active ? colors.primary : '#9aa0a6', fontWeight: '800' }}>
                {loading ? '…' : r.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
