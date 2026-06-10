import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createAdminSessionToken } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      // No default password: admin login is disabled until ADMIN_PASSWORD is set.
      return NextResponse.json(
        { error: 'Admin login is not configured' },
        { status: 503 }
      );
    }

    const { password } = await request.json();
    const provided = Buffer.from(String(password ?? ''));
    const expected = Buffer.from(adminPassword);
    const valid = provided.length === expected.length && timingSafeEqual(provided, expected);

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const sessionToken = createAdminSessionToken();
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Admin login is not configured' },
        { status: 503 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
