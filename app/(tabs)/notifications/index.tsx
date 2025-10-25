// app/(tabs)/notifications/index.tsx
import React from 'react';
import { View, Text, Pressable, FlatList, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors, radii, shadow } from '@/lib/theme';
import { useRouter } from 'expo-router';

type ConfirmationRow = {
  id: string;
  match_id: string;
  user_id: string;
  confirmed: boolean | null;
  rejected: boolean | null;
  created_at: string;
};

async function fetchMyConfirmations(): Promise<ConfirmationRow[]> {
  const { data, error } = await supabase
    .from('match_confirmations')
    .select('id, match_id, user_id, confirmed, rejected, created_at')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function setConfirmation(id: string, patch: Partial<ConfirmationRow>) {
  const { error } = await supabase
    .from('match_confirmations')
    .update(patch)
    .eq('id', id);
  if (error) throw error;
}

export default function ConfirmationsScreen() {
  const qc = useQueryClient();
  const router = useRouter();

  const q = useQuery({
    queryKey: ['confirmations'],
    queryFn: fetchMyConfirmations,
  });

  const mut = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      setConfirmation(id, accept ? { confirmed: true, rejected: false } : { confirmed: false, rejected: true }),
    onError: (e) => Alert.alert('Update failed', (e as any)?.message ?? 'Please try again.'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['confirmations'] }),
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0e13', padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 12 }}>
        Confirmations
      </Text>

      <FlatList
        data={q.data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 10 }}
        ListEmptyComponent={
          <Text style={{ color: '#9aa0a6' }}>
            {q.isLoading ? 'Loading…' : 'No pending confirmations.'}
          </Text>
        }
        renderItem={({ item }) => {
          const status =
            item.rejected ? 'Rejected' :
            item.confirmed ? 'Confirmed' : 'Pending';
          const statusColor =
            item.rejected ? '#f87171' :
            item.confirmed ? '#34d399' : '#fbbf24';

          return (
            <View
              style={{
                backgroundColor: '#0e1116',
                borderWidth: 1,
                borderColor: '#1f2630',
                borderRadius: radii.lg,
                padding: 14,
                ...shadow.soft,
                gap: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Match #{item.match_id.slice(0,8)}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => router.push(`/match/${item.match_id}`)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radii.md,
                  }}
                >
                  <Text style={{ color: '#9aa0a6', fontWeight: '800' }}>View details</Text>
                </Pressable>

                {!item.confirmed && !item.rejected && (
                  <>
                    <Pressable
                      onPress={() => mut.mutate({ id: item.id, accept: true })}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: radii.md,
                        backgroundColor: '#34d399',
                      }}
                    >
                      <Text style={{ color: '#0b0e13', fontWeight: '900' }}>Confirm</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => mut.mutate({ id: item.id, accept: false })}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: radii.md,
                        backgroundColor: '#f87171',
                      }}
                    >
                      <Text style={{ color: '#0b0e13', fontWeight: '900' }}>Reject</Text>
                    </Pressable>
                  </>
                )}

                <View
                  style={{
                    marginLeft: 'auto',
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: '#0f141b',
                  }}
                >
                  <Text style={{ color: statusColor, fontWeight: '800' }}>{status}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
