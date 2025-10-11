import { NextResponse } from 'next/server';
import { isAIEnabled } from '@/lib/tables/ai/featureFlags';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

async function getUserLike() {
  try {
    const jar = await cookies();
    const role = jar.get('gi_role')?.value || 'STUDENT';
    const orgId = jar.get('gi_org')?.value;
    const aiAllowed = jar.get('gi_ai')?.value !== 'false';
    return { role, orgId, aiAllowed } as { role: string; orgId?: string; aiAllowed?: boolean };
  } catch {
    return undefined;
  }
}

export async function GET() {
  const user = await getUserLike();
  const enabled = await isAIEnabled(user);
  return NextResponse.json({ enabled });
}


