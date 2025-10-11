import { NextRequest, NextResponse } from 'next/server';
import { coinsFor } from '@/lib/tables/core/rewards';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { kind } = await req.json();
  const amount = coinsFor(kind === 'FIRST_MASTERY' ? { kind: 'FIRST_MASTERY' } : kind === 'REVIEW_CORRECT' ? { kind: 'REVIEW_CORRECT' } : { kind: 'NO_REWARD' });
  return NextResponse.json({ coins: amount });
}


