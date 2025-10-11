const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

type UserLike = { aiAllowed?: boolean; orgId?: string; role?: string } | undefined;

async function kvGetBoolean(key: string): Promise<boolean | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ commands: [["GET", key]] }),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  const result = (data as { result?: Array<{ result?: unknown }> })?.result?.[0]?.result;
  if (result == null) return null;
  return String(result) !== 'false';
}

export async function isAIEnabled(user?: UserLike): Promise<boolean> {
  const global = process.env.AI_ENABLED === 'true';
  if (!global) return false;

  const policy = user?.orgId ? await kvGetBoolean(`org:${user.orgId}:aiAllowed`) : null;
  const orgAllows = policy !== false;
  const userAllows = user?.aiAllowed !== false;

  const requireConsent = process.env.REQUIRE_PARENT_CONSENT_FOR_AI === 'true';
  const isStudent = !!user && user.role === 'STUDENT';
  if (requireConsent && isStudent) {
    return global && orgAllows && userAllows;
  }
  return global && orgAllows && userAllows;
}


