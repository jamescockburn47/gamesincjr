import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('gi_user', '', { path: '/', maxAge: 0 });
  res.cookies.set('gi_tier', '', { path: '/', maxAge: 0 });
  return res;
}

