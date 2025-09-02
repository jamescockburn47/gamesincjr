import { cookies } from 'next/headers';

export type Tier = 'free' | 'starter' | 'explorer' | 'champion' | 'premium_ai';

export async function getUserFromCookies() {
  try {
    const jar = await cookies();
    const email = jar.get('gi_user')?.value || '';
    const tier = (jar.get('gi_tier')?.value as Tier | undefined) || 'free';
    return { email, tier } as { email: string; tier: Tier };
  } catch {
    return { email: '', tier: 'free' } as { email: string; tier: Tier };
  }
}

export function hasAccessToGame(tier: Tier, indexZeroBased: number): boolean {
  if (tier === 'champion' || tier === 'premium_ai') return true;
  if (tier === 'explorer') return indexZeroBased < 3;
  if (tier === 'starter') return indexZeroBased < 1;
  return false;
}

