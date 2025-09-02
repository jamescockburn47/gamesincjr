import { NextRequest, NextResponse } from 'next/server';
import { addMessage } from '@/lib/community-store';

export async function POST(req: NextRequest) {
  const { name, text } = await req.json();
  if (!text || String(text).trim().length === 0) {
    return NextResponse.json({ error: 'Text required' }, { status: 400 });
  }
  const msg = {
    id: crypto.randomUUID(),
    name: String(name || 'Anon'),
    text: String(text).trim(),
    ts: Date.now(),
  };
  await addMessage(msg);
  return NextResponse.json({ ok: true, item: msg });
}


