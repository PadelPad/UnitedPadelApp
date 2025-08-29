// lib/storage.ts
import { supabase } from '@/lib/supabase';

type RNFile = { uri: string; name?: string; type?: string };

const randId = () => `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

export async function uploadEvidence(
  file: RNFile,
  opts?: { bucket?: string; pathPrefix?: string }
): Promise<{ path: string; publicUrl: string }> {
  const bucket = opts?.bucket ?? 'evidence';        // ensure this bucket exists in Supabase Storage
  const prefix = opts?.pathPrefix ? `${opts.pathPrefix.replace(/\/+$/, '')}/` : '';

  const uri = file.uri;
  if (!uri) throw new Error('uploadEvidence: file.uri is required');

  // best-effort extension
  const guessExt = () => {
    if (file.name && file.name.includes('.')) return file.name.split('.').pop()!;
    const fromUri = uri.split('?')[0].split('#')[0].split('.').pop();
    return (fromUri && fromUri.length < 6 ? fromUri : undefined) || 'jpg';
  };

  const ext = guessExt();
  const name = file.name ?? `${randId()}.${ext}`;
  const path = `${prefix}${name}`;

  // React Native: fetch the local file URI to a Blob
  const res = await fetch(uri);
  const blob = await res.blob();

  const { error } = await supabase
    .storage
    .from(bucket)
    .upload(path, blob, {
      upsert: false,
      contentType: file.type || blob.type || 'application/octet-stream',
    });

  if (error) throw error;

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: pub.publicUrl };
}
