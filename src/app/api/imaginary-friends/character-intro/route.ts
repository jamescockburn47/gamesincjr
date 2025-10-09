import { NextRequest, NextResponse } from 'next/server';
import { characterIntro, getInitialGameStatus } from '../_lib/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let characterId = 'luna';
  try {
    const body = await request.json();
    characterId = String(body.characterId || '').trim() || characterId;
    if (!characterId) {
      return NextResponse.json({ error: 'Missing characterId' }, { status: 400 });
    }

    const introduction = await characterIntro(characterId);
    const gameStatus = getInitialGameStatus(characterId);
    return NextResponse.json({ introduction, gameStatus });
  } catch (error) {
    console.error('Imaginary Friends intro failed', error);
    return NextResponse.json(
      {
        error: 'Failed to generate introduction. Please try again.',
        gameStatus: getInitialGameStatus(characterId),
      },
      { status: 500 },
    );
  }
}
