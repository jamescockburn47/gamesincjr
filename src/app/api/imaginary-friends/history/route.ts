import { NextRequest, NextResponse } from 'next/server';
import { loadRecentConversationTurns } from '../_lib/service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = String(searchParams.get('characterId') || '').trim();
    const userId = String(searchParams.get('userId') || 'default').trim();
    const limitRaw = searchParams.get('limit');
    const limit = Math.max(1, Math.min(50, Number(limitRaw || 20)));

    if (!characterId) {
      return NextResponse.json({ error: 'Missing characterId' }, { status: 400 });
    }

    const turns = await loadRecentConversationTurns(characterId, userId, limit);
    return NextResponse.json({ turns });
  } catch (error) {
    console.error('Imaginary Friends history fetch failed', error);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}


