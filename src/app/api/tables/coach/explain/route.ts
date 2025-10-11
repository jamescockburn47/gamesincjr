import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { isAIEnabled } from '@/lib/tables/ai/featureFlags';
import { explainError } from '@/lib/tables/ai/coach';
import { getAIUserFromCookies } from '@/lib/tables/ai/user';
import { kvGet, kvSet } from '@/lib/tables/ai/kvCache';
import { validateExplain } from '@/lib/tables/ai/schemas';

export const runtime = 'nodejs';

const TTL_SECONDS = Number(process.env.AI_CACHE_TTL_SECONDS || 604800);
const HINT_MODEL = process.env.AI_MODEL_HINTS || 'gpt-4o-mini';
const SAFE_MODE = process.env.AI_SAFE_MODE !== 'false';

function cacheKey(a: number, b: number, typed?: string) {
  return `tables:explain:${a}x${b}:${typed ? typed.slice(0, 20) : 'none'}`;
}

export async function POST(req: NextRequest) {
  const { a, b, typed } = (await req.json()) as { a: number; b: number; typed?: string };
  const aa = Number(a);
  const bb = Number(b);
  const typedStr = String(typed ?? '');

  const key = cacheKey(aa, bb, typedStr);
  const cached = await kvGet<{ message: string; pattern?: string }>(key);
  if (cached) {
    return NextResponse.json(cached);
  }

  const user = await getAIUserFromCookies();
  const ai = await isAIEnabled(user);
  const fallback = {
    message: 'Try splitting into tens and ones, then recombine the pieces to check your work.',
    pattern: 'unknown',
  };

  if (!ai) {
    await kvSet(key, fallback, TTL_SECONDS);
    return NextResponse.json(fallback);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const client = apiKey ? new OpenAI({ apiKey }) : null;

  const callModel = client
    ? async (prompt: string) => {
        const [systemLine, ...rest] = prompt.split('\n');
        const system = systemLine.trim();
        const userPrompt = rest.join('\n').trim();
        try {
          const response = await client.responses.create({
            model: HINT_MODEL,
            input: [
              { role: 'system', content: system },
              { role: 'user', content: userPrompt },
            ],
            ...(SAFE_MODE
              ? {
                  response_format: {
                    type: 'json_schema',
                    json_schema: {
                      name: 'ExplainResponse',
                      schema: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', maxLength: 200 },
                          pattern: {
                            type: 'string',
                            enum: ['typo', 'reversal', 'near-multiple', 'unknown'],
                          },
                        },
                        required: ['message'],
                        additionalProperties: false,
                      },
                    },
                  },
                }
              : {}),
            max_output_tokens: 200,
          });
          const text = response.output_text;
          if (!text) return null;
          return JSON.parse(text);
        } catch {
          return null;
        }
      }
    : undefined;

  const result = await explainError(
    { a: aa, b: bb, op: '*', typed: typedStr },
    callModel,
  );

  if (!validateExplain(result)) {
    await kvSet(key, fallback, TTL_SECONDS);
    return NextResponse.json(fallback);
  }

  await kvSet(key, result, TTL_SECONDS);
  return NextResponse.json(result);
}


