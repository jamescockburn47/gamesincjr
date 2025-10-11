import { NextResponse } from 'next/server';
import { isAIEnabled } from '@/lib/tables/ai/featureFlags';
import { getAIUserFromCookies } from '@/lib/tables/ai/user';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getAIUserFromCookies();
  const enabled = await isAIEnabled(user);
  return NextResponse.json({ enabled });
}


