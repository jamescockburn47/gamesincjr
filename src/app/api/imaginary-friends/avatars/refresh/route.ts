import { NextResponse } from 'next/server';
import { listCharacterAvatars } from '../../_lib/service';

export const runtime = 'nodejs';

export async function POST() {
  try {
    // For now avatars are static emoji placeholders; return the same mapping.
    return NextResponse.json({ avatars: listCharacterAvatars() });
  } catch (error) {
    console.error('Failed to refresh avatars', error);
    return NextResponse.json({ error: 'Failed to refresh avatars' }, { status: 500 });
  }
}
