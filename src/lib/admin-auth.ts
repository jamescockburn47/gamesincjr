import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// HMAC key for session tokens. Falls back to ADMIN_PASSWORD so a single
// env var is enough to run admin auth; without either, admin is disabled.
function getSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Create a signed, expiring session token. Returns null when admin auth is not configured. */
export function createAdminSessionToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const secret = getSessionSecret();
    if (!secret) return false;

    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    if (!token) return false;

    const [expiresAt, signature] = token.split('.');
    if (!expiresAt || !signature) return false;

    const expected = sign(expiresAt, secret);
    const provided = Buffer.from(signature);
    const wanted = Buffer.from(expected);
    if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) {
      return false;
    }

    return Number(expiresAt) > Date.now();
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    throw new Error('Admin authentication required');
  }
}
