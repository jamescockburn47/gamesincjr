import { NextResponse } from 'next/server';
import { listCharacterAvatars } from '../_lib/service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json({ avatars: listCharacterAvatars() });
  } catch (error) {
    console.error('Failed to list avatars', error);
    return NextResponse.json({ avatars: {} }, { status: 500 });
  }
}
