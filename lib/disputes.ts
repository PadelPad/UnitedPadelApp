// lib/disputes.ts
import { supabase } from '@/lib/supabase';

/** Open a dispute for a match and get the dispute id back */
export async function openDispute(matchId: string, reason?: string, details?: string) {
  const { data, error } = await supabase.rpc('open_dispute', {
    p_match_id: matchId,
    p_reason: reason ?? null,
    p_details: details ?? null,
  });
  if (error) throw error;
  return data as string; // dispute_id
}

/**
 * Create placeholder & upload a file as evidence.
 * `fileUri` can be from expo-image-picker or the camera: ex. "file:///..."
 * `contentType` like "image/jpeg" | "video/mp4" | "application/pdf"
 */
export async function uploadEvidenceFromUri(
  disputeId: string,
  fileUri: string,
  filename: string,
  contentType: string
) {
  // 1) Mint a safe path (placeholder row), authorized by RLS
  const { data: objectPath, error: placeErr } = await supabase.rpc('create_evidence_placeholder', {
    p_dispute_id: disputeId,
    p_filename: filename,
  });
  if (placeErr) throw placeErr;

  // 2) Fetch the file and turn into Blob (Expo-friendly)
  const resp = await fetch(fileUri);
  const blob = await resp.blob();

  // 3) Upload to Storage at the exact path the server minted
  const { error: upErr } = await supabase
    .storage
    .from('evidence')
    .upload(objectPath as string, blob, { contentType, upsert: false });
  if (upErr) throw upErr;

  return objectPath as string;
}

/** List evidence objects (paths) for a dispute (metadoc reads — NOT storage listing) */
export async function listEvidence(disputeId: string) {
  const { data, error } = await supabase
    .from('match_evidence')
    .select('id, object_path, uploaded_by, created_at')
    .eq('dispute_id', disputeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Get a signed URL to display or download an evidence item */
export async function getEvidenceSignedUrl(objectPath: string, expiresInSeconds = 60 * 10) {
  const { data, error } = await supabase.storage
    .from('evidence')
    .createSignedUrl(objectPath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl as string;
}
