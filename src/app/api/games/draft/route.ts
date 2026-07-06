import { NextRequest, NextResponse } from 'next/server';
import {
  DraftBriefSchema,
  buildGuidedDraftPrompt,
  buildIterationFeedbackPrompt,
  generateWithRetry,
  withTimeout,
  extractHTMLFromResponse,
  validateGeneratedCode,
  analyzeGameplayMechanics,
  moderateContent,
  AI_GENERATION_TIMEOUT_MS,
} from '@/lib/games/generator';
import { checkDraftLimit } from '@/lib/gameDraftLimiter';

// Generates a single playable draft synchronously (no DB write — drafts live
// in the browser until the creator submits). One retry pass if the first
// attempt fails the gameplay-mechanics check, mirroring the legacy pipeline,
// but no graphics-enhancement pass here: the child iterates on real feedback
// instead of waiting on an automatic polish step.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brief = DraftBriefSchema.parse(body);

    const moderation = await moderateContent(brief);
    if (!moderation.approved) {
      return NextResponse.json({ error: moderation.reason || 'Please change your game idea and try again.' }, { status: 400 });
    }

    const allowed = await checkDraftLimit(brief.creatorEmail);
    if (!allowed) {
      return NextResponse.json({ error: "You've hit today's limit for building games. Try again tomorrow!" }, { status: 429 });
    }

    const draftSlug = `draft-${crypto.randomUUID().slice(0, 8)}`;
    const prompt = buildGuidedDraftPrompt(draftSlug, brief);

    const { text } = await withTimeout(generateWithRetry(prompt), AI_GENERATION_TIMEOUT_MS, 'Draft generation timed out');
    let code = extractHTMLFromResponse(text);

    if (!validateGeneratedCode(code)) {
      return NextResponse.json({ error: 'That draft came out broken — please try again.' }, { status: 502 });
    }

    const criticalIssues = analyzeGameplayMechanics(code).filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      const feedbackPrompt = buildIterationFeedbackPrompt(prompt, criticalIssues);
      const { text: retryText } = await withTimeout(generateWithRetry(feedbackPrompt), AI_GENERATION_TIMEOUT_MS, 'Draft retry timed out');
      const retryCode = extractHTMLFromResponse(retryText);
      if (validateGeneratedCode(retryCode) && analyzeGameplayMechanics(retryCode).filter(i => i.severity === 'critical').length === 0) {
        code = retryCode;
      }
    }

    return NextResponse.json({ code, draftSlug });
  } catch (error) {
    console.error('[Draft Generator] Error:', error);
    return NextResponse.json({ error: 'Could not build your draft right now. Please try again.' }, { status: 500 });
  }
}
