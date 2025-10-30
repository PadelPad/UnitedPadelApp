// app/search/index.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radii } from '@/lib/theme';
import { useRouter } from 'expo-router';

export default function SearchScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <View style={{
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderColor: colors.outline,
        borderWidth: 1,
        borderRadius: radii.lg,
        paddingHorizontal: 12,
        alignItems: 'center',
        height: 48,
        marginBottom: 16,
      }}>
        <Ionicons name="search" size={18} color={colors.subtext} />
        <TextInput
          placeholder="Search players, clubs, tournaments…"
          placeholderTextColor={colors.subtext}
          value={q}
          onChangeText={setQ}
          style={{ color: colors.text, marginLeft: 8, flex: 1 }}
          returnKeyType="search"
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ('')}>
            <Ionicons name="close" size={18} color={colors.subtext} />
          </Pressable>
        )}
      </View>

      {/* Stub list for now */}
      <Text style={{ color: colors.subtext }}>
        Type to search. (Hook this up to Supabase profiles/clubs later.)
      </Text>
    </View>
  );
}
