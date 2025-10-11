import { NextRequest, NextResponse } from 'next/server';
import { isAIEnabled } from '@/lib/tables/ai/featureFlags';
import { explainError } from '@/lib/tables/ai/coach';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { a, b, op, typed } = await req.json();
  const ai = await isAIEnabled(undefined);
  if (!ai) {
    return NextResponse.json({ message: 'Try splitting into tens and ones, then recombine.', pattern: 'unknown' });
  }
  const result = await explainError({ a: Number(a), b: Number(b), op: '*', typed: String(typed || '') });
  return NextResponse.json(result);
}


