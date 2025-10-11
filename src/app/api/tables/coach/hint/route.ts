import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { isAIEnabled } from '@/lib/tables/ai/featureFlags';
import { deterministicHint } from '@/lib/tables/core/hints';
import { getHint } from '@/lib/tables/ai/coach';
import { kvGet, kvSet } from '@/lib/tables/ai/kvCache';
import { getAIUserFromCookies } from '@/lib/tables/ai/user';
import { validateHint } from '@/lib/tables/ai/schemas';

export const runtime = 'nodejs';

const TTL_SECONDS = Number(process.env.AI_CACHE_TTL_SECONDS || 604800);
const HINT_MODEL = process.env.AI_MODEL_HINTS || 'gpt-4o-mini';
const SAFE_MODE = process.env.AI_SAFE_MODE !== 'false';

function cacheKey(a: number, b: number, theme?: string, lastWrong?: number) {
  return `tables:hint:${a}x${b}:${theme || 'none'}:${lastWrong ?? 'none'}`;
}

export async function POST(req: NextRequest) {
  const { a, b, lastWrong, theme } = (await req.json()) as {
    a: number;
    b: number;
    lastWrong?: number;
    theme?: string;
  };
  const aa = Number(a);
  const bb = Number(b);

  const key = cacheKey(aa, bb, theme, lastWrong);
  const cached = await kvGet<{ hint: string }>(key);
  if (cached) {
    return NextResponse.json(cached);
  }

  const user = await getAIUserFromCookies();
  const ai = await isAIEnabled(user);
  const fallback = { hint: deterministicHint(aa, bb) };

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
                      name: 'HintResponse',
                      schema: {
                        type: 'object',
                        properties: {
                          hint: { type: 'string', maxLength: 160 },
                          teacher_note: { type: 'string', maxLength: 160 },
                        },
                        required: ['hint'],
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
          const parsed = JSON.parse(text);
          return parsed;
        } catch {
          return null;
        }
      }
    : undefined;

  const result = await getHint({ a: aa, b: bb, op: '*', lastWrong, theme }, callModel);
  if (!validateHint(result)) {
    await kvSet(key, fallback, TTL_SECONDS);
    return NextResponse.json(fallback);
  }

  await kvSet(key, result, TTL_SECONDS);
  return NextResponse.json(result);
}


