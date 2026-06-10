import { NextRequest, NextResponse } from 'next/server';

// Demo tier system: the account page lets visitors pick a tier to preview
// what each membership unlocks. Values are validated against this list so
// the cookie can never carry arbitrary content.
const ALLOWED_TIERS = ['free', 'starter', 'explorer', 'champion', 'premium_ai'] as const;
type AllowedTier = (typeof ALLOWED_TIERS)[number];

export async function POST(req: NextRequest) {
  let body: { email?: unknown; tier?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = String(body.email || '').trim().slice(0, 100);
  const tier: AllowedTier = ALLOWED_TIERS.includes(body.tier as AllowedTier)
    ? (body.tier as AllowedTier)
    : 'free';

  const res = NextResponse.json({ ok: true });
  res.cookies.set('gi_user', email, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.set('gi_tier', tier, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
