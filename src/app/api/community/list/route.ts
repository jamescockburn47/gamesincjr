import { NextResponse } from 'next/server';
import { getMessages } from '@/lib/community-store';

export const revalidate = 0;

export async function GET() {
  const items = await getMessages();
  return NextResponse.json({ items });
}


