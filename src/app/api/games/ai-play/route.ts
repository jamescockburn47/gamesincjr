import { NextRequest, NextResponse } from 'next/server';
import { getGameBySlug } from '@/lib/games';

export async function POST(request: NextRequest) {
  try {
    const { gameSlug } = await request.json();
    
    // Validate game exists and is AI-powered
    const game = await getGameBySlug(gameSlug);
    if (!game || game.gameType !== 'ai-powered') {
      return NextResponse.json(
        { error: 'Game not found or not AI-powered' },
        { status: 404 }
      );
    }

    // Generate session ID for tracking
    const sessionId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store session in database/cache (you'd implement this)
    // await storeAISession(sessionId, {
    //   gameSlug,
    //   apiCost: game.apiCostPerPlay,
    //   startTime: new Date(),
    //   status: 'active'
    // });

    // For now, return the game URL with session tracking
    const gameUrl = game.demoPath || `/games/${gameSlug}/play`;
    
    return NextResponse.json({
      gameUrl: `${gameUrl}?session=${sessionId}`,
      sessionId,
      apiCost: game.apiCostPerPlay,
      message: 'AI game session started'
    });

  } catch (error) {
    console.error('AI game play error:', error);
    return NextResponse.json(
      { error: 'Failed to start AI game' },
      { status: 500 }
    );
  }
}
