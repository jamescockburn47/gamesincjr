import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// Credential records live in Upstash KV (private), never in public Blob storage.
export type UserRecord = {
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export function isUserStoreConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

function userKey(username: string): string {
  return `gi:auth:user:${username.toLowerCase()}`;
}

async function kvCommand(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ commands: [command] }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('KV request failed');
  const data = await res.json();
  return data?.result?.[0]?.result ?? null;
}

export async function getUser(username: string): Promise<UserRecord | null> {
  if (!isUserStoreConfigured()) return null;
  try {
    const raw = await kvCommand(['GET', userKey(username)]);
    return raw ? (JSON.parse(String(raw)) as UserRecord) : null;
  } catch {
    return null;
  }
}

/** Create a user record. Returns false when the username is taken or KV is unavailable. */
export async function createUser(username: string, password: string): Promise<boolean> {
  if (!isUserStoreConfigured()) return false;
  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, salt, 32).toString('hex');
  const record: UserRecord = {
    username,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };
  try {
    // SET ... NX: only creates if the key doesn't exist (no overwrite race)
    const result = await kvCommand(['SET', userKey(username), JSON.stringify(record), 'NX']);
    return result === 'OK';
  } catch {
    return false;
  }
}

export function verifyPassword(record: UserRecord, password: string): boolean {
  const hash = scryptSync(password, record.salt, 32);
  const stored = Buffer.from(record.passwordHash, 'hex');
  return hash.length === stored.length && timingSafeEqual(hash, stored);
}
