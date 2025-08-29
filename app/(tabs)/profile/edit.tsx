// app/(tabs)/profile/edit.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '@/lib/supabase';
import { uploadAvatarFromUri } from '@/lib/storage';

const C = {
  bg: '#0b0e13',
  panel: '#0e1116',
  border: '#1f2630',
  text: '#fff',
  sub: '#9aa0a6',
  orange: '#ff6a00',
};

async function fetchMeProfile() {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, bio, region, play_style, preferred_format, club_id, avatar_url')
    .eq('id', uid)
    .single();
  if (error) throw error;
  return data as any;
}
async function fetchClubById(id: string | null) {
  if (!id) return null;
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, bio, location, website_url, social_links')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as any;
}

export default function EditProfile() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: p, isLoading } = useQuery({ queryKey: ['profile'], queryFn: fetchMeProfile });
  const { data: c } = useQuery({
    queryKey: ['club-edit', p?.club_id],
    queryFn: () => fetchClubById(p?.club_id ?? null),
    enabled: !!p?.club_id,
  });

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [region, setRegion] = useState('');
  const [playStyle, setPlayStyle] = useState('');
  const [format, setFormat] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [clubName, setClubName] = useState('');
  const [clubBio, setClubBio] = useState('');
  const [clubLoc, setClubLoc] = useState('');
  const [clubWebsite, setClubWebsite] = useState('');
  const [clubInstagram, setClubInstagram] = useState('');

  useEffect(() => {
    if (p) {
      setUsername(p.username ?? '');
      setBio(p.bio ?? '');
      setRegion(p.region ?? '');
      setPlayStyle(p.play_style ?? '');
      setFormat(p.preferred_format ?? '');
      setAvatarUrl(p.avatar_url ?? null);
    }
    if (c) {
      setClubName(c.name ?? '');
      setClubBio(c.bio ?? '');
      setClubLoc(c.location ?? '');
      setClubWebsite(c.website_url ?? '');
      setClubInstagram(c?.social_links?.instagram ?? '');
    }
  }, [p, c]);

  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'We need access to your photos to set your avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (result.canceled || !result.assets?.length) return;

      const uri = result.assets[0].uri;
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error('No user.');

      setUploading(true);
      const { publicUrl } = await uploadAvatarFromUri(uri, uid);

      const { error: upErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', uid);
      if (upErr) throw upErr;

      setAvatarUrl(publicUrl);
      qc.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('Updated', 'Your profile photo has been updated.');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Try again.');
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!p?.id) throw new Error('Missing profile');
      const updates: any = {
        username,
        bio,
        region,
        play_style: playStyle,
        preferred_format: format as any,
      };
      const { error: e1 } = await supabase.from('profiles').update(updates).eq('id', p.id);
      if (e1) throw e1;

      if (p?.club_id) {
        const { error: e2 } = await supabase
          .from('clubs')
          .update({
            name: clubName || null,
            bio: clubBio || null,
            location: clubLoc || null,
            website_url: clubWebsite || null,
            social_links: { instagram: clubInstagram || null },
          })
          .eq('id', p.club_id);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['club', p?.club_id] });
      Alert.alert('Saved', 'Your profile has been updated.');
      router.back();
    },
    onError: (e: any) => Alert.alert('Save failed', e?.message ?? 'Try again'),
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack.Screen
        options={{ title: 'Edit Profile', headerStyle: { backgroundColor: C.bg }, headerTintColor: '#fff' }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Avatar block */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Profile Photo</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 64, height: 64, borderRadius: 32 }} />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#11161f' }} />
            )}
            <Pressable onPress={pickAvatar} style={S.secondary} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#0b0e13" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={16} color={C.orange} />
                  <Text style={S.secondaryText}>Choose photo</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        <Card title="Profile">
          <Label>Username</Label>
          <Input value={username} onChangeText={setUsername} />

          <Label style={{ marginTop: 8 }}>Bio</Label>
          <Input value={bio} onChangeText={setBio} multiline />

          <Label style={{ marginTop: 8 }}>Region</Label>
          <Input value={region} onChangeText={setRegion} />

          <Label style={{ marginTop: 8 }}>Play style</Label>
          <Input value={playStyle} onChangeText={setPlayStyle} />

          <Label style={{ marginTop: 8 }}>Preferred format</Label>
          <Input value={format} onChangeText={setFormat} placeholder="singles / doubles / mixed" />
        </Card>

        {p?.club_id && (
          <Card title="Club">
            <Label>Club name</Label>
            <Input value={clubName} onChangeText={setClubName} />

            <Label style={{ marginTop: 8 }}>Club bio</Label>
            <Input value={clubBio} onChangeText={setClubBio} multiline />

            <Label style={{ marginTop: 8 }}>Location</Label>
            <Input value={clubLoc} onChangeText={setClubLoc} />

            <Label style={{ marginTop: 8 }}>Website</Label>
            <Input value={clubWebsite} onChangeText={setClubWebsite} autoCapitalize="none" />

            <Label style={{ marginTop: 8 }}>Instagram</Label>
            <Input value={clubInstagram} onChangeText={setClubInstagram} autoCapitalize="none" />
          </Card>
        )}

        <Pressable style={S.primary} onPress={() => save.mutate()} disabled={save.isPending || uploading}>
          <Text style={S.primaryText}>{save.isPending ? 'Saving…' : 'Save changes'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Card({ title, children }: any) {
  return (
    <View style={S.card}>
      <Text style={S.cardTitle}>{title}</Text>
      <View style={{ marginTop: 8, gap: 8 }}>{children}</View>
    </View>
  );
}
function Label({ children, style }: any) {
  return <Text style={[{ color: C.sub, fontWeight: '700' }, style]}>{children}</Text>;
}
function Input(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#6f7782"
      style={{
        backgroundColor: C.panel,
        borderWidth: 1,
        borderColor: C.border,
        color: C.text,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
      }}
    />
  );
}

const S = StyleSheet.create({
  card: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
  },
  cardTitle: { color: C.text, fontWeight: '900', fontSize: 16 },
  primary: {
    backgroundColor: C.orange,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#0b0e13', fontWeight: '900' },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.orange,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  secondaryText: { color: C.orange, fontWeight: '800' },
});
