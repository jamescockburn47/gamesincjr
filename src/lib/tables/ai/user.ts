import { cookies } from 'next/headers';

export type AIUserLike = {
  role: string;
  orgId?: string;
  aiAllowed?: boolean;
};

export async function getAIUserFromCookies(): Promise<AIUserLike | undefined> {
  try {
    const jar = await cookies();
    const role = jar.get('gi_role')?.value ?? 'STUDENT';
    const orgId = jar.get('gi_org')?.value ?? undefined;
    const aiAllowed = jar.get('gi_ai')?.value !== 'false';
    return { role, orgId, aiAllowed };
  } catch {
    return undefined;
  }
}
