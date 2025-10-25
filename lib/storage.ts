// lib/storage.ts
import { supabase } from '@/lib/supabase';

/** Basic React Native file shape */
export type RNFile = { uri: string; name?: string; type?: string };

export type UploadOpts = {
  bucket?: string;
  pathPrefix?: string;
  upsert?: boolean;
  contentType?: string;
};

export type UploadResult = {
  path: string;
  publicUrl: string;
};

const randId = () => `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

function joinPath(prefix: string | undefined, filename: string) {
  const p = (prefix ?? '').replace(/^\/+|\/+$/g, '');
  return p ? `${p}/${filename}` : filename;
}

function guessExt(file: RNFile): string {
  if (file.name && file.name.includes('.')) return file.name.split('.').pop()!;
  const noQuery = file.uri.split(/[?#]/)[0];
  const ext = noQuery.includes('.') ? noQuery.split('.').pop()! : '';
  return ext && ext.length <= 5 ? ext : 'jpg';
}

function inferContentType(file: RNFile, ext: string): string {
  if (file.type) return file.type;
  const e = ext.toLowerCase();
  if (['jpg', 'jpeg', 'jpe'].includes(e)) return 'image/jpeg';
  if (e === 'png') return 'image/png';
  if (e === 'webp') return 'image/webp';
  if (e === 'gif') return 'image/gif';
  if (e === 'heic') return 'image/heic';
  if (e === 'mp4') return 'video/mp4';
  if (e === 'mov') return 'video/quicktime';
  if (e === 'pdf') return 'application/pdf';
  if (e === 'csv') return 'text/csv';
  if (e === 'txt') return 'text/plain';
  return 'application/octet-stream';
}

async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to read file: ${res.status} ${res.statusText}`);
  return await res.blob();
}

async function uploadBlobToStorage(params: {
  bucket: string;
  path: string;
  blob: Blob;
  upsert?: boolean;
  contentType?: string;
}): Promise<UploadResult> {
  const { bucket, path, blob, upsert, contentType } = params;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: Boolean(upsert),
    contentType: contentType || (blob as any).type || 'application/octet-stream',
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/** Generic upload */
export async function uploadFile(file: RNFile, opts?: UploadOpts): Promise<UploadResult> {
  if (!file?.uri) throw new Error('uploadFile: file.uri is required');
  const bucket = opts?.bucket ?? 'misc';
  const ext = guessExt(file);
  const filename = file.name ?? `${randId()}.${ext}`;
  const path = joinPath(opts?.pathPrefix, filename);
  const blob = await uriToBlob(file.uri);
  return await uploadBlobToStorage({
    bucket,
    path,
    blob,
    upsert: Boolean(opts?.upsert),
    contentType: opts?.contentType || inferContentType(file, ext),
  });
}

/** Evidence (kept for BC) */
export async function uploadEvidence(file: RNFile, opts?: { bucket?: string; pathPrefix?: string }): Promise<UploadResult> {
  const bucket = opts?.bucket ?? 'evidence';
  const prefix = opts?.pathPrefix;
  const ext = guessExt(file);
  const filename = file.name ?? `${randId()}.${ext}`;
  const path = joinPath(prefix, filename);
  const blob = await uriToBlob(file.uri);
  return await uploadBlobToStorage({
    bucket,
    path,
    blob,
    upsert: false,
    contentType: inferContentType(file, ext),
  });
}

/* ---------- IMPROVED AVATAR HELPERS ---------- */

/**
 * Avatar upload from a URI. Uses the blob’s real MIME to decide extension,
 * but still keeps a stable filename: `${userId}.${ext}`. Upserts by default.
 */
export async function uploadAvatarFromUri(
  uri: string,
  userId: string,
  opts?: { bucket?: string; filename?: string; upsert?: boolean }
): Promise<UploadResult> {
  if (!uri) throw new Error('uploadAvatarFromUri: uri is required');
  if (!userId) throw new Error('uploadAvatarFromUri: userId is required');

  const bucket = opts?.bucket ?? 'avatars';
  const blob = await uriToBlob(uri);

  // Deduce extension from the blob’s MIME; fallback to jpg
  const mime = (blob as any).type || 'image/jpeg';
  const ext = (() => {
    const m = mime.split('/')[1]?.toLowerCase();
    if (!m) return 'jpg';
    if (m.includes('jpeg')) return 'jpg';
    return m.replace(/[^a-z0-9]/g, '') || 'jpg';
  })();

  const filename = (opts?.filename ?? `${userId}.${ext}`).replace(/\/+/g, '');
  const path = joinPath(undefined, filename);

  return await uploadBlobToStorage({
    bucket,
    path,
    blob,
    upsert: opts?.upsert ?? true,
    contentType: mime,
  });
}

/**
 * Upload avatar directly from a local asset module (e.g. require('.../avatar1.png')).
 * Perfect for your preset avatars grid.
 */
export async function uploadAvatarFromAsset(
  assetModule: number, // require(...) result
  userId: string,
  opts?: { bucket?: string; upsert?: boolean }
): Promise<UploadResult> {
  // Resolve the asset to a file URI Expo can fetch
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: { resolveAssetSource } } = require('react-native/Libraries/Image/resolveAssetSource');
  const src = resolveAssetSource(assetModule);
  if (!src?.uri) throw new Error('uploadAvatarFromAsset: could not resolve asset URI');
  return uploadAvatarFromUri(src.uri, userId, { bucket: opts?.bucket, upsert: opts?.upsert });
}

/** Delete, public and signed URL helpers */
export async function removeFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
export async function getSignedUrl(bucket: string, path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
