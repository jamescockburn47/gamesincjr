export type CommunityMessage = { id: string; name: string; text: string; ts: number };

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = 'gi:feedback';
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_RW_TOKEN || '';
const BLOB_PREFIX = 'community/messages';

let memory: CommunityMessage[] = [];

async function kvPipeline(commands: unknown[]) {
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ commands }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('KV request failed');
  return res.json();
}

export async function getMessages(): Promise<CommunityMessage[]> {
  if (KV_URL && KV_TOKEN) {
    try {
      const data = await kvPipeline([["LRANGE", KEY, "0", "99"]]);
      // Upstash returns { result: [ ["ok", ["value1","value2"] ] ] } or array of results
      const arr = Array.isArray(data?.result?.[0]?.result)
        ? data.result[0].result as string[]
        : [];
      return arr.map((s) => JSON.parse(String(s))).filter(Boolean);
    } catch (e) {
      console.warn('KV get failed, falling back to memory', e);
      return memory;
    }
  }
  // Blob fallback
  if (BLOB_TOKEN) {
    try {
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: `${BLOB_PREFIX}/`, token: BLOB_TOKEN });
      const latest = blobs.sort((a, b) => (a.pathname > b.pathname ? -1 : 1)).slice(0, 100);
      const items: CommunityMessage[] = [];
      for (const b of latest) {
        const res = await fetch(b.url, { cache: 'no-store' });
        if (res.ok) items.push(await res.json() as CommunityMessage);
      }
      return items;
    } catch (e) {
      console.warn('Blob get failed, using memory', e);
    }
  }
  return memory;
}

export async function addMessage(msg: CommunityMessage): Promise<void> {
  if (KV_URL && KV_TOKEN) {
    try {
      await kvPipeline([
        ["LPUSH", KEY, JSON.stringify(msg)],
        ["LTRIM", KEY, "0", "99"],
      ]);
      return;
    } catch (e) {
      console.warn('KV push failed, writing to memory', e);
    }
  }
  if (BLOB_TOKEN) {
    try {
      const { put } = await import('@vercel/blob');
      const key = `${BLOB_PREFIX}/${msg.ts}-${msg.id}.json`;
      await put(key, JSON.stringify(msg), { access: 'public', token: BLOB_TOKEN, contentType: 'application/json' });
      return;
    } catch (e) {
      console.warn('Blob push failed, writing to memory', e);
    }
  }
  memory.push(msg);
  memory = memory.slice(-100);
}


