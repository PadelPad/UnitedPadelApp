// app/match/[id]/disputes.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '@/lib/supabase';

type EvidenceRow = {
  id: string;
  match_id: string;
  created_at: string;
  created_by?: string | null;
  storage_path: string;
  public_url: string;
  mime_type: string | null;
  original_name: string | null;
  note?: string | null;
};

function fmtDate(iso?: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '';
  }
}

async function uriToBlob(uri: string): Promise<Blob> {
  // Works in Expo (native & web) for file:// and content:// URIs
  const res = await fetch(uri);
  return await res.blob();
}

function guessExt(name?: string | null, mime?: string | null) {
  if (name && name.includes('.')) return name.split('.').pop() || 'bin';
  if (mime) {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'video/mp4': 'mp4',
      'application/pdf': 'pdf',
    };
    return map[mime] || 'bin';
  }
  return 'bin';
}

export default function DisputesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const matchId = useMemo(() => String(params.id || ''), [params.id]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [note, setNote] = useState('');

  const loadEvidence = async () => {
    if (!matchId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('match_dispute_evidence')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load evidence.');
    } else {
      setEvidence((data ?? []) as EvidenceRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEvidence();
  }, [matchId]);

  async function uploadToBucket(opts: {
    uri: string;
    name?: string | null;
    contentType?: string | null;
    userId: string;
  }): Promise<{ path: string; publicUrl: string; contentType: string | null; originalName: string | null }> {
    const bucket = 'evidence'; // ensure this bucket exists in Supabase Storage
    const originalName = opts.name ?? 'file';
    const ext = guessExt(originalName, opts.contentType ?? null);
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `matches/${matchId}/${opts.userId}/${filename}`;
    const blob = await uriToBlob(opts.uri);

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, blob, { upsert: false, contentType: opts.contentType || undefined });
    if (upErr) {
      throw upErr;
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return { path, publicUrl: pub.publicUrl, contentType: opts.contentType ?? null, originalName };
  }

  const addImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'Media library permission is required.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: false,
        quality: 0.9,
      });
      if (picked.canceled) return;

      const asset = picked.assets[0];
      await handleUpload({
        uri: asset.uri,
        name: asset.fileName ?? undefined,
        type: asset.type === 'video' ? 'video/mp4' : asset.mimeType ?? 'image/jpeg',
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Could not pick media.');
    }
  };

  const addFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const file = res.assets[0];
      // DocumentPicker on native provides uri, mimeType, name
      await handleUpload({
        uri: file.uri,
        name: file.name,
        type: (file as any).mimeType || null,
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Could not pick file.');
    }
  };

  async function handleUpload(file: { uri: string; name?: string | null; type?: string | null }) {
    try {
      setSubmitting(true);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      // Ensure the file exists (especially on iOS temp paths)
      const info = await FileSystem.getInfoAsync(file.uri);
      if (!info.exists) throw new Error('File does not exist');

      const uploaded = await uploadToBucket({
        uri: file.uri,
        name: file.name ?? null,
        contentType: file.type ?? null,
        userId,
      });

      const { error: insErr } = await supabase.from('match_dispute_evidence').insert({
        match_id: matchId,
        created_by: userId,
        storage_path: uploaded.path,
        public_url: uploaded.publicUrl,
        mime_type: uploaded.contentType,
        original_name: uploaded.originalName,
        note: note?.trim() ? note.trim() : null,
      });
      if (insErr) throw insErr;

      setNote('');
      await loadEvidence();
      Alert.alert('Uploaded', 'Your evidence was added.');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Upload failed', e?.message || 'Could not upload evidence.');
    } finally {
      setSubmitting(false);
    }
  }

  const removeEvidence = async (row: EvidenceRow) => {
    Alert.alert('Remove evidence?', 'This will delete the file and its record.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSubmitting(true);
            // delete from storage
            await supabase.storage.from('evidence').remove([row.storage_path]);
            // delete row
            const { error } = await supabase
              .from('match_dispute_evidence')
              .delete()
              .eq('id', row.id);
            if (error) throw error;
            await loadEvidence();
          } catch (e: any) {
            console.error(e);
            Alert.alert('Error', 'Failed to delete evidence.');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link.');
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={18} color="#e5e8ef" />
        </Pressable>
        <Text style={styles.h1}>Dispute & Evidence</Text>
      </View>

      <Text style={styles.sub}>
        Attach screenshots, photos, PDFs, or videos related to this match. Only admins and involved
        players can view these files.
      </Text>

      {/* Note box */}
      <View style={styles.card}>
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Describe the issue (optional)…"
          placeholderTextColor="#6b7280"
          multiline
          style={styles.input}
        />

        <View style={styles.actionsRow}>
          <Pressable
            onPress={addImage}
            style={[styles.actionBtn, submitting && styles.actionBtnDisabled]}
            disabled={submitting}
          >
            <Ionicons name="images" size={16} color="#0b0e13" />
            <Text style={styles.actionBtnText}>Add photo/video</Text>
          </Pressable>

          <Pressable
            onPress={addFile}
            style={[styles.actionBtnAlt, submitting && styles.actionBtnAltDisabled]}
            disabled={submitting}
          >
            <MaterialCommunityIcons name="file-plus" size={16} color="#ff6a00" />
            <Text style={styles.actionBtnAltText}>Upload file</Text>
          </Pressable>
        </View>

        {submitting ? (
          <View style={{ marginTop: 10 }}>
            <ActivityIndicator color="#ff6a00" />
          </View>
        ) : null}
      </View>

      {/* Evidence list */}
      <View style={{ marginTop: 16 }}>
        <Text style={styles.sectionTitle}>Submitted evidence</Text>

        {loading ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator color="#ff6a00" />
          </View>
        ) : evidence.length === 0 ? (
          <Text style={styles.muted}>No evidence yet.</Text>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={evidence}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ gap: 10, paddingTop: 10 }}
            renderItem={({ item }) => (
              <View style={styles.evRow}>
                <View style={styles.evIconWrap}>
                  <MaterialCommunityIcons
                    name={
                      item.mime_type?.startsWith('image/')
                        ? 'image'
                        : item.mime_type?.startsWith('video/')
                        ? 'video'
                        : item.mime_type === 'application/pdf'
                        ? 'file-pdf-box'
                        : 'file-document'
                    }
                    size={20}
                    color="#fff"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.evName}>
                    {item.original_name || item.storage_path.split('/').pop()}
                  </Text>
                  <Text style={styles.evMeta}>
                    {item.mime_type || 'file'} • {fmtDate(item.created_at)}
                  </Text>
                  {item.note ? <Text style={styles.evNote}>“{item.note}”</Text> : null}
                </View>

                <View style={{ gap: 8, alignItems: 'flex-end' }}>
                  <Pressable
                    onPress={() => openUrl(item.public_url)}
                    style={styles.smallBtn}
                    accessibilityRole="button"
                  >
                    <Ionicons name="open-outline" size={14} color="#0b0e13" />
                    <Text style={styles.smallBtnText}>Open</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => removeEvidence(item)}
                    style={[styles.smallBtnAlt]}
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash" size={14} color="#ff6a00" />
                    <Text style={styles.smallBtnAltText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0e13' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#11161f',
    borderWidth: 1,
    borderColor: '#1f2630',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: { color: '#fff', fontSize: 20, fontWeight: '900' },
  sub: { color: '#9aa0a6', marginBottom: 12 },

  card: {
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#1f2630',
    borderRadius: 12,
    padding: 12,
  },
  label: { color: '#e5e8ef', fontWeight: '700', marginBottom: 6 },
  input: {
    minHeight: 80,
    color: '#fff',
    backgroundColor: '#0b0e13',
    borderWidth: 1,
    borderColor: '#1f2630',
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
  },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#ff6a00',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionBtnText: { color: '#0b0e13', fontWeight: '800' },
  actionBtnDisabled: { opacity: 0.65 },

  actionBtnAlt: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#ff6a00',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionBtnAltText: { color: '#ff6a00', fontWeight: '700' },
  actionBtnAltDisabled: { opacity: 0.65 },

  sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  muted: { color: '#9aa0a6', marginTop: 6 },

  evRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#1f2630',
    padding: 10,
    borderRadius: 12,
  },
  evIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#11161f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f2630',
  },
  evName: { color: '#fff', fontWeight: '800', maxWidth: 200 },
  evMeta: { color: '#9aa0a6', fontSize: 12 },
  evNote: { color: '#cbd5e1', marginTop: 2, fontStyle: 'italic' },

  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffd79f',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#332317',
  },
  smallBtnText: { color: '#0b0e13', fontWeight: '800', fontSize: 12 },

  smallBtnAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#ff6a00',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  smallBtnAltText: { color: '#ff6a00', fontWeight: '700', fontSize: 12 },
});
