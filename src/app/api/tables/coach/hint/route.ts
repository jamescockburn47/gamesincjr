import { NextRequest, NextResponse } from 'next/server';
import { isAIEnabled } from '@/lib/tables/ai/featureFlags';
import { deterministicHint } from '@/lib/tables/core/hints';
import { getHint } from '@/lib/tables/ai/coach';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { a, b, lastWrong, theme } = await req.json() as { a: number; b: number; lastWrong?: number; theme?: string };
  const ai = await isAIEnabled(undefined);
  if (!ai) {
    return NextResponse.json({ hint: deterministicHint(Number(a), Number(b)) });
  }
  const result = await getHint({ a: Number(a), b: Number(b), op: '*', lastWrong, theme });
  return NextResponse.json(result);
}


