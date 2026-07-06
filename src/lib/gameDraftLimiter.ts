// Daily cap on draft-generation + revision calls per creator email, so the
// guided make-your-game iteration loop can't be used to run up unbounded AI
// costs. Separate from the Prisma-backed GameSubmission rate limit, which
// only gates final submissions.
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const DRAFT_CALLS_PER_DAY = 20; // generous: a real 3-5 iteration session uses ~5-8

async function kv(command: unknown[]): Promise<unknown> {
  if (!KV_URL || !KV_TOKEN) return null;
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands: [command] }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('KV request failed');
  const data = await res.json();
  return data?.result?.[0]?.result ?? null;
}

/** Returns true if the caller may make another draft/revise call today. Fails
 * open (allows the call) if KV is unavailable, matching this codebase's
 * existing pattern for non-critical infra (see moderateContent). */
export async function checkDraftLimit(email: string): Promise<boolean> {
  if (!KV_URL || !KV_TOKEN) return true;
  try {
    const day = new Date().toISOString().slice(0, 10);
    const key = `gi:draftlimit:${email}:${day}`;
    const count = await kv(['INCR', key]);
    await kv(['EXPIRE', key, 172800]); // 2 days, safety margin
    return typeof count === 'number' ? count <= DRAFT_CALLS_PER_DAY : true;
  } catch (error) {
    console.error('[Draft Limiter] Failed, allowing call:', error);
    return true;
  }
}
