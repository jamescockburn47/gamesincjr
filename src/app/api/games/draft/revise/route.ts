import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  buildRevisePrompt,
  generateWithRetry,
  withTimeout,
  extractHTMLFromResponse,
  validateGeneratedCode,
  moderateText,
  AI_GENERATION_TIMEOUT_MS,
} from '@/lib/games/generator';
import { checkDraftLimit } from '@/lib/gameDraftLimiter';

const ReviseSchema = z.object({
  code: z.string().min(100),
  instruction: z.string().min(1).max(300),
  gameTitle: z.string().min(1).max(30),
  creatorEmail: z.string().email(),
});

// Applies one playtest-driven change to an existing draft. This is the core
// of the guided flow: the child describes a gap ("the boss appears too
// late"), not a whole new game, and gets back a revised draft to try again.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, instruction, gameTitle, creatorEmail } = ReviseSchema.parse(body);

    const moderation = await moderateText(instruction, 'A change request for their own game draft.');
    if (!moderation.approved) {
      return NextResponse.json({ error: moderation.reason || 'Please describe your change differently.' }, { status: 400 });
    }

    const allowed = await checkDraftLimit(creatorEmail);
    if (!allowed) {
      return NextResponse.json({ error: "You've hit today's limit for building games. Try again tomorrow!" }, { status: 429 });
    }

    const prompt = buildRevisePrompt(code, instruction, gameTitle);
    const { text } = await withTimeout(generateWithRetry(prompt), AI_GENERATION_TIMEOUT_MS, 'Revision timed out');
    const revisedCode = extractHTMLFromResponse(text);

    if (!validateGeneratedCode(revisedCode)) {
      return NextResponse.json({ error: 'That change broke the game — try describing it a different way.' }, { status: 502 });
    }

    return NextResponse.json({ code: revisedCode });
  } catch (error) {
    console.error('[Draft Reviser] Error:', error);
    return NextResponse.json({ error: 'Could not make that change right now. Please try again.' }, { status: 500 });
  }
}
