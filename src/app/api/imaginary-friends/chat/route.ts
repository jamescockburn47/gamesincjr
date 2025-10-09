import { NextRequest, NextResponse } from 'next/server';
import { chatWithCharacter, loadRecentConversationTurns, streamChatWithCharacter } from '../_lib/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const characterId = String(body.characterId || '').trim();
    const message = typeof body.message === 'string' ? body.message : '';
    const history: unknown[] = Array.isArray(body.conversationHistory)
      ? body.conversationHistory
      : [];
    const requestImage = Boolean(body.requestImage);
    const newThread = Boolean(body.newThread);
    const userId = typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : 'default';

    if (!characterId) {
      return NextResponse.json({ error: 'Missing characterId' }, { status: 400 });
    }

    // Load last 20 Q&A pairs (40 turns) from persistent storage for context (skip if starting a new thread)
    const storedHistory = newThread ? [] : await loadRecentConversationTurns(characterId, userId, 40);
    const normalisedHistory = [...storedHistory, ...history]
      .filter((entry: unknown): entry is { speaker: 'player' | 'character'; text: string } => {
        if (!entry || typeof entry !== 'object') return false;
        const record = entry as Record<string, unknown>;
        if (record.speaker !== 'player' && record.speaker !== 'character') return false;
        return typeof record.text === 'string' && record.text.length > 0;
      })
      .map((entry: { speaker: 'player' | 'character'; text: string }) => ({
        speaker: entry.speaker,
        text: entry.text,
      }));

    if (Boolean(body.stream)) {
      const stream = streamChatWithCharacter({
        characterId,
        userMessage: message,
        history: normalisedHistory,
        requestImage,
        userId,
      });
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    const result = await chatWithCharacter({
      characterId,
      userMessage: message,
      history: normalisedHistory,
      requestImage,
      userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Imaginary Friends chat failed', error);
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 },
    );
  }
}
