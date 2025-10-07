import { NextRequest, NextResponse } from 'next/server';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kv(command: unknown[]) {
  if (!KV_URL || !KV_TOKEN) return null;
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ commands: [command] }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('KV request failed');
  const data = await res.json();
  return data?.result?.[0]?.result ?? null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get('slug') || '').trim();
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const key = `gi:scores:${slug}`;

  try {
    if (!KV_URL || !KV_TOKEN) {
      return NextResponse.json({ top: [] });
    }
    const raw = await kv(['ZRANGE', key, 0, 4, 'REV', 'WITHSCORES']);
    const top: Array<{ name: string; score: number }> = [];
    if (Array.isArray(raw)) {
      for (let i = 0; i < raw.length; i += 2) {
        const name = String(raw[i] ?? 'anon');
        const score = Number(raw[i + 1] ?? 0);
        top.push({ name, score });
      }
    }
    return NextResponse.json({ top });
  } catch (error) {
    console.error('Failed to load scores', error);
    return NextResponse.json({ top: [] });
  }
}


