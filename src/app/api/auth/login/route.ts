import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, tier } = await req.json();
  const res = NextResponse.json({ ok: true });
  // Very simple demo auth: set cookies for email and tier
  res.cookies.set('gi_user', String(email || ''), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.set('gi_tier', String(tier || 'free'), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

