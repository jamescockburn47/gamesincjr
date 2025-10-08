import { NextRequest, NextResponse } from 'next/server';
import { getSessionInfoForUser } from '../_lib/service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') || 'default';
  const session = getSessionInfoForUser(userId);
  return NextResponse.json(session);
}
