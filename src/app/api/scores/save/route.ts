import { NextRequest, NextResponse } from 'next/server';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvPipeline(commands: unknown[]) {
  if (!KV_URL || !KV_TOKEN) return null;
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
  const data = await res.json();
  return data?.result ?? null;
}

function sanitizeName(name: string): string {
  const clean = name.replace(/[^a-z0-9 _.-]/gi, '').slice(0, 16).trim();
  return clean || 'anon';
}

export async function POST(req: NextRequest) {
  try {
    const { slug, score, name } = await req.json();
    if (!slug || typeof score !== 'number' || !isFinite(score)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const clamped = Math.max(0, Math.min(10_000_000, Math.floor(score)));
    const player = sanitizeName(String(name || ''));

    if (!KV_URL || !KV_TOKEN) {
      return NextResponse.json({ ok: true, stored: false });
    }

    const key = `gi:scores:${slug}`;
    // Store in a sorted set: member is name, score is numeric score
    // Keep only top 5
    await kvPipeline([
      ['ZADD', key, clamped, player],
      ['ZREMRANGEBYRANK', key, 0, -6],
      ['EXPIRE', key, 60 * 60 * 24 * 30],
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to save score', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}


