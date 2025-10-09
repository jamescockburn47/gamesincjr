import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let username = String(body?.username || '').trim();
    if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });
    // Basic sanitisation: limit length and allowed chars
    username = username.slice(0, 40).replace(/[^a-zA-Z0-9_\-\s]/g, '');
    const res = NextResponse.json({ ok: true, username });
    res.cookies.set('gi_user', username, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}


