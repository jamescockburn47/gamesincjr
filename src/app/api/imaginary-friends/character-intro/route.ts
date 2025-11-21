import { NextRequest, NextResponse } from 'next/server';
import { chatWithCharacter } from '../_lib/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let characterId = 'luna';
  try {
    const body = await request.json();
    characterId = String(body.characterId || '').trim() || characterId;

    // Generate intro by simulating a "start" interaction
    const result = await chatWithCharacter({
      characterId,
      userMessage: "Hello! Who are you?", // Prompt for an intro
      history: [],
      userId: 'intro-generator',
      requestImage: false
    });

    return NextResponse.json({
      introduction: result.response,
      gameStatus: result.gameStatus
    });
  } catch (error) {
    console.error('Imaginary Friends intro failed', error);
    return NextResponse.json(
      {
        error: 'Failed to generate introduction.',
        // Fallback status
        gameStatus: {
          friendshipLevel: 1,
          experience: 0,
          nextLevelThreshold: 100,
          stardustEarned: 0,
          badgesUnlocked: [],
          sentiment: 'happy',
          keywords: [],
          suggestedActivity: 'Say hello!',
          summary: 'Ready to play.',
          creativityScore: 50
        },
      },
      { status: 500 },
    );
  }
}
