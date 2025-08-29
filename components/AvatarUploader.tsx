import React, { useState } from 'react';
import { View, Image, Pressable, Text, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatar } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

type Props = {
  userId: string;
  avatarUrl: string | null | undefined;
  onUploaded?: (url: string) => void;
};

export default function AvatarUploader({ userId, avatarUrl, onUploaded }: Props) {
  const [busy, setBusy] = useState(false);

  async function pickAndUpload() {
    try {
      setBusy(true);
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (res.canceled) return;

      const uri = res.assets[0].uri;
      const publicUrl = await uploadAvatar(userId, uri);

      // persist to profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;

      onUploaded?.(publicUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable onPress={busy ? undefined : pickAndUpload} style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: '#11161f',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#1f2630',
        }}
      >
        {busy ? (
          <ActivityIndicator color="#ff6a00" />
        ) : avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ color: '#9aa0a6', fontWeight: '800' }}>Upload</Text>
        )}
      </View>
      <Text style={{ color: '#9aa0a6', marginTop: 6, fontSize: 12 }}>Change photo</Text>
    </Pressable>
  );
}
