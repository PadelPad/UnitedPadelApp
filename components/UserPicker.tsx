import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { colors, radii } from '@/lib/theme';

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  rating: number | null;
  email: string | null;
};

async function searchProfiles(term: string): Promise<ProfileRow[]> {
  const q = term.trim();
  if (!q) return [];
  if (/^[0-9a-f-]{36}$/i.test(q)) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,username,avatar_url,rating,email')
      .eq('id', q);
    if (error) throw error;
    return data ?? [];
  }
  if (q.includes('@')) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,username,avatar_url,rating,email')
      .ilike('email', `%${q}%`)
      .limit(10);
    if (error) throw error;
    return data ?? [];
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,avatar_url,rating,email')
    .ilike('username', `%${q}%`)
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export default function UserPicker({
  label,
  value,
  onChangeText,
  onPick,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  onPick: (p: ProfileRow) => void;
  placeholder?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProfileRow[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const v = value.trim();
      if (v.length < 2) {
        setResults([]);
        return;
      }
      try {
        setLoading(true);
        const rows = await searchProfiles(v);
        if (active) setResults(rows);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [value]);

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: '#9aa0a6', fontSize: 13 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'username / email / uuid'}
        placeholderTextColor="#6f7785"
        style={{
          backgroundColor: '#10151d',
          borderWidth: 1,
          borderColor: '#1f2630',
          color: '#fff',
          borderRadius: radii.md,
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      />

      {loading ? (
        <View style={{ paddingVertical: 8 }}>
          <ActivityIndicator color="#ff6a00" />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(item)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#151a22',
              }}
            >
              {item.avatar_url ? (
                <Image
                  source={{ uri: item.avatar_url }}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#131923' }}
                />
              ) : (
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#131923',
                  }}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }} numberOfLines={1}>
                  {item.username || item.email || 'Player'}
                </Text>
                <Text style={{ color: '#9aa0a6', fontSize: 12 }}>
                  ⭐ {Math.round(item.rating ?? 1000)}
                </Text>
              </View>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>Select</Text>
            </Pressable>
          )}
        />
      ) : null}
    </View>
  );
}
