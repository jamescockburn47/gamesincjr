import OpenAI from 'openai';
import type { SessionTarget } from '@/lib/tables/service';
import { isAIEnabled } from './featureFlags';
import { getAIUserFromCookies } from './user';

export type ChallengeQuestion = {
  factId: string;
  a: number;
  b: number;
  prompt: string;
  answer: number;
};

const MODEL = process.env.AI_MODEL_CHALLENGE || process.env.AI_MODEL_CONTENT || 'gpt-4o-mini';
const SAFE_MODE = process.env.AI_SAFE_MODE !== 'false';

function shuffle<T>(items: T[]): T[] {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function buildFallback(targets: SessionTarget[]): ChallengeQuestion[] {
  return shuffle(targets).map((target) => ({
    factId: target.id,
    a: target.a,
    b: target.b,
    prompt: `What is ${target.a} × ${target.b}?`,
    answer: target.a * target.b,
  }));
}

export async function generateChallengeQuestions(targets: SessionTarget[]): Promise<ChallengeQuestion[]> {
  if (targets.length === 0) return [];

  const fallback = buildFallback(targets);
  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const user = await getAIUserFromCookies();
    const aiAllowed = await isAIEnabled(user);
    if (!aiAllowed || !apiKey) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  const client = new OpenAI({ apiKey });

  const factMap = new Map(targets.map((target) => [target.id, target]));
  const systemPrompt =
    'You create lively multiplication quiz questions for 7-10 year olds. Keep questions short (<90 chars), upbeat, and only use the provided facts. Return JSON only.';
  const factList = targets
    .map((target) => `${target.id}:${target.a}x${target.b}`)
    .join(', ');

  try {
    const response = await client.responses.create({
      model: MODEL,
      input: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Facts: ${factList}\nReturn JSON {"questions":[{"factId":"id","prompt":"text","answer":number}]}. Ensure answer = a*b and prompt references multiplication.`,
        },
      ],
      ...(SAFE_MODE
        ? {
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'ChallengeQuestions',
                schema: {
                  type: 'object',
                  properties: {
                    questions: {
                      type: 'array',
                      minItems: targets.length,
                      maxItems: targets.length,
                      items: {
                        type: 'object',
                        properties: {
                          factId: { type: 'string' },
                          prompt: { type: 'string', maxLength: 120 },
                          answer: { type: 'integer' },
                        },
                        required: ['factId', 'prompt', 'answer'],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ['questions'],
                  additionalProperties: false,
                },
              },
            },
          }
        : {}),
      max_output_tokens: 400,
      temperature: 0.6,
    });

    const text = response.output_text;
    if (!text) {
      return fallback;
    }

    const parsed = JSON.parse(text) as { questions?: Array<{ factId?: string; prompt?: string; answer?: number }> };
    const used = new Set<string>();
    const enriched: ChallengeQuestion[] = [];

    for (const entry of parsed.questions ?? []) {
      if (!entry || typeof entry !== 'object') continue;
      const factId = typeof entry.factId === 'string' ? entry.factId.trim() : '';
      if (!factId || used.has(factId)) continue;
      const target = factMap.get(factId);
      if (!target) continue;
      const prompt = typeof entry.prompt === 'string' ? entry.prompt.trim() : '';
      if (!prompt) continue;
      const answer = Number(entry.answer);
      if (!Number.isFinite(answer) || answer !== target.a * target.b) continue;
      used.add(factId);
      enriched.push({
        factId,
        a: target.a,
        b: target.b,
        prompt: prompt.slice(0, 120),
        answer: target.a * target.b,
      });
    }

    if (enriched.length === targets.length) {
      return enriched;
    }

    const remaining = fallback.filter((item) => !used.has(item.factId));
    return [...enriched, ...remaining];
  } catch {
    return fallback;
  }
}
