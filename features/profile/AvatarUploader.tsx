// features/profile/AvatarUploader.tsx
import React, { useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '@/lib/supabase';
import { uploadAvatarFromUri } from '@/lib/storage';

const C = {
  panel: '#0e1116', border: '#1f2630', text: '#fff', sub: '#9aa0a6', orange: '#ff6a00',
};

const PRESETS = [
  require('@/assets/avatars/avatar1.png'),
  require('@/assets/avatars/avatar2.png'),
  require('@/assets/avatars/avatar3.png'),
  require('@/assets/avatars/avatar4.png'),
  require('@/assets/avatars/avatar5.png'),
  require('@/assets/avatars/avatar6.png'),
  require('@/assets/avatars/avatar7.png'),
  require('@/assets/avatars/avatar8.png'),
];

export function AvatarUploader({ onDone }: { onDone?: (publicUrl: string) => void }) {
  const [localUri, setLocalUri] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled) setLocalUri(res.assets[0].uri);
  };

  const uploadLocal = async () => {
    if (!localUri) return;
    setBusy(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No session');
      const { publicUrl } = await uploadAvatarFromUri(localUri, user.id);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      onDone?.(publicUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const usePreset = async (preset: any) => {
    setBusy(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No session');
      // Resolve the local asset URI and upload just like a picked image
      const asset = Image.resolveAssetSource(preset);
      const { publicUrl } = await uploadAvatarFromUri(asset.uri, user.id);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      onDone?.(publicUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: C.text, fontWeight: '800' }}>Choose an avatar</Text>

      {/* Presets grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {PRESETS.map((p, i) => (
          <Pressable
            key={i}
            onPress={() => usePreset(p)}
            style={{
              width: 58, height: 58, borderRadius: 999,
              borderWidth: 1, borderColor: C.border, overflow: 'hidden',
            }}
          >
            <Image source={p} style={{ width: '100%', height: '100%' }} />
          </Pressable>
        ))}
      </View>

      {/* Custom picker */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={pick}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
            borderRadius: 12, borderWidth: 1, borderColor: C.orange, backgroundColor: C.panel }}
        >
          <Ionicons name="image-outline" size={16} color={C.orange} />
          <Text style={{ color: C.orange, fontWeight: '800' }}>Pick photo</Text>
        </Pressable>

        <Pressable
          onPress={uploadLocal}
          disabled={!localUri || busy}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
            borderRadius: 12, borderWidth: 1, borderColor: C.orange, backgroundColor: C.panel, opacity: !localUri || busy ? 0.6 : 1 }}
        >
          {busy ? <ActivityIndicator color="#ff6a00" /> : <Ionicons name="cloud-upload-outline" size={16} color={C.orange} />}
          <Text style={{ color: C.orange, fontWeight: '800' }}>{busy ? 'Uploading…' : 'Upload'}</Text>
        </Pressable>

        {localUri ? (
          <Image source={{ uri: localUri }} style={{ width: 48, height: 48, borderRadius: 999 }} />
        ) : null}
      </View>

      <Text style={{ color: C.sub, fontSize: 12 }}>
        Presets are optional; you can also upload your own photo. Uses Supabase Storage bucket “avatars”.
      </Text>
    </View>
  );
}
