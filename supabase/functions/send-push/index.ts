// supabase/functions/send-push/index.ts
/// <reference lib="deno.ns" />
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

type DBPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    user_id: string;
    title: string | null;
    message: string | null;
    type: string | null;
    metadata: unknown;
  } | null;
};

type PushTokenRow = { expo_push_token: string | null };

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const payload = (await req.json().catch(() => null)) as DBPayload | null;
  if (!payload?.record?.user_id || payload.type !== 'INSERT') {
    return new Response('Ignored', { status: 200 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const userId = payload.record.user_id;

  const tokensRes = await fetch(
    `${supabaseUrl}/rest/v1/user_push_tokens?user_id=eq.${userId}`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  if (!tokensRes.ok) return new Response('Token fetch failed', { status: 500 });

  const tokens = (await tokensRes.json()) as PushTokenRow[];
  const expoTokens: string[] = tokens
    .map((t) => t.expo_push_token ?? '')
    .filter((x): x is string => x.length > 0);

  if (expoTokens.length === 0) return new Response('No tokens', { status: 200 });

  const chunks: string[][] = [];
  const chunkSize = 90;
  for (let i = 0; i < expoTokens.length; i += chunkSize) chunks.push(expoTokens.slice(i, i + chunkSize));

  const baseMessage = {
    title: payload.record.title ?? 'United Padel',
    body: payload.record.message ?? 'You have a new notification',
    data: payload.record.metadata ?? {},
    sound: 'default',
    priority: 'high'
  };

  for (const c of chunks) {
    const messages = c.map((to) => ({ to, ...baseMessage }));
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages)
    });
  }

  return new Response('ok', { status: 200 });
});
