import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/tables/db/prisma';
import { getNextFactsForUser } from '@/lib/tables/db/ensure';
import { DEFAULT_USER_ID } from '@/lib/tables/constants';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const prisma = getPrisma();
  const userId = req.nextUrl.searchParams.get('userId')?.trim() || DEFAULT_USER_ID;
  const targets = await getNextFactsForUser(prisma, userId, 10);
  return NextResponse.json({
    targets: targets.map((target) => ({
      id: target.id,
      a: target.a,
      b: target.b,
      op: target.op,
    })),
  });
}


