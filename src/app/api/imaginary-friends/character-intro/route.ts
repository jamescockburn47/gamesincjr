import { NextRequest, NextResponse } from 'next/server';
import { characterIntro } from '../_lib/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const characterId = String(body.characterId || '').trim();
    if (!characterId) {
      return NextResponse.json({ error: 'Missing characterId' }, { status: 400 });
    }

    const introduction = await characterIntro(characterId);
    return NextResponse.json({ introduction });
  } catch (error) {
    console.error('Imaginary Friends intro failed', error);
    return NextResponse.json(
      { error: 'Failed to generate introduction. Please try again.' },
      { status: 500 },
    );
  }
}

