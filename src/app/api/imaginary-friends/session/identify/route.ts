import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const COOKIE = 'if_user_id';
const MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export async function GET(request: NextRequest) {
  const cookies = request.cookies;
  // Prefer logged-in username if present
  const loggedIn = cookies.get('gi_user')?.value;
  let userId = loggedIn || cookies.get(COOKIE)?.value;
  if (!userId) {
    userId = 'u_' + randomUUID();
  }
  const response = NextResponse.json({ userId });
  response.cookies.set(COOKIE, userId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
  return response;
}


