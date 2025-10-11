const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export async function kvGet<T>(key: string): Promise<T | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands: [["GET", key]] }),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.result?.[0]?.result;
  if (!raw) return null;
  try { return JSON.parse(String(raw)); } catch { return null; }
}

export async function kvSet<T>(key: string, value: T, ttlSeconds = 604800): Promise<void> {
  if (!KV_URL || !KV_TOKEN) return;
  await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands: [["SETEX", key, String(ttlSeconds), JSON.stringify(value)]] }),
    cache: 'no-store',
  });
}


