import { NextRequest, NextResponse } from 'next/server';
import { isAIEnabled } from '@/src/lib/tables/ai/featureFlags';
import { kvGet, kvSet } from '@/src/lib/tables/ai/kvCache';
import { generateDeterministicProblem } from '@/src/lib/tables/core/problems';

export const runtime = 'nodejs';

function hashKey(a: number, b: number, theme?: string, age?: string) {
  return `tables:wp:${a}x${b}:${theme || 'default'}:${age || 'all'}`;
}

export async function POST(req: NextRequest) {
  const { a, b, theme, ageBand } = await req.json();
  const aa = Number(a); const bb = Number(b);
  const key = hashKey(aa, bb, theme, ageBand);
  const cached = await kvGet<any>(key);
  if (cached) return NextResponse.json(cached);

  const ai = await isAIEnabled(undefined);
  if (!ai) {
    const fallback = generateDeterministicProblem(aa, bb, theme);
    await kvSet(key, fallback, Number(process.env.AI_CACHE_TTL_SECONDS || 604800));
    return NextResponse.json(fallback);
  }
  // For now, no model provider wired. Use deterministic generation but still cache.
  const generated = generateDeterministicProblem(aa, bb, theme);
  await kvSet(key, generated, Number(process.env.AI_CACHE_TTL_SECONDS || 604800));
  return NextResponse.json(generated);
}


