import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { isAIEnabled } from '@/lib/tables/ai/featureFlags';
import { kvGet, kvSet } from '@/lib/tables/ai/kvCache';
import { generateDeterministicProblem } from '@/lib/tables/core/problems';
import { getAIUserFromCookies } from '@/lib/tables/ai/user';
import { validateWordProblem } from '@/lib/tables/ai/schemas';

export const runtime = 'nodejs';

const TTL_SECONDS = Number(process.env.AI_CACHE_TTL_SECONDS || 604800);
const CONTENT_MODEL = process.env.AI_MODEL_CONTENT || process.env.AI_MODEL_HINTS || 'gpt-4o-mini';
const SAFE_MODE = process.env.AI_SAFE_MODE !== 'false';

function hashKey(a: number, b: number, theme?: string, age?: string) {
  return `tables:wp:${a}x${b}:${theme || 'default'}:${age || 'all'}`;
}

export async function POST(req: NextRequest) {
  const { a, b, theme, ageBand } = (await req.json()) as { a: number; b: number; theme?: string; ageBand?: string };
  const aa = Number(a);
  const bb = Number(b);
  const key = hashKey(aa, bb, theme, ageBand);

  const cached = await kvGet<ReturnType<typeof generateDeterministicProblem>>(key);
  if (cached) return NextResponse.json(cached);

  const user = await getAIUserFromCookies();
  const ai = await isAIEnabled(user);
  const fallback = generateDeterministicProblem(aa, bb, theme);

  if (!ai) {
    await kvSet(key, fallback, TTL_SECONDS);
    return NextResponse.json(fallback);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const client = apiKey ? new OpenAI({ apiKey }) : null;

  if (!client) {
    await kvSet(key, fallback, TTL_SECONDS);
    return NextResponse.json(fallback);
  }

  try {
    const system = 'Generate one 15-20 word story problem that uses A×B (both ≤12). Avoid brand names & sensitive topics.';
    const userPrompt = `A=${aa} B=${bb} Theme=${theme || 'default'} Age=${ageBand || 'all'}\nRespond with JSON containing problem (<=160 chars) and operands array.`;

    const response = await client.responses.create({
      model: CONTENT_MODEL,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      ...(SAFE_MODE
        ? {
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'WordProblem',
                schema: {
                  type: 'object',
                  properties: {
                    problem: { type: 'string', maxLength: 160 },
                    operands: {
                      type: 'array',
                      items: { type: 'integer' },
                      minItems: 2,
                      maxItems: 2,
                    },
                    op: { type: 'string', enum: ['*'] },
                    cultural_check: { type: 'boolean' },
                  },
                  required: ['problem', 'operands', 'op'],
                  additionalProperties: false,
                },
              },
            },
          }
        : {}),
      max_output_tokens: 300,
    });

    const text = response.output_text;
    if (text) {
      const parsed = JSON.parse(text);
      if (validateWordProblem(parsed)) {
        const [oa, ob] = parsed.operands;
        if ((oa === aa && ob === bb) || (oa === bb && ob === aa)) {
          const verified = {
            problem: parsed.problem.slice(0, 160),
            operands: [aa, bb] as [number, number],
            op: '*',
            cultural_check: parsed.cultural_check ?? true,
          };
          await kvSet(key, verified, TTL_SECONDS);
          return NextResponse.json(verified);
        }
      }
    }
  } catch {
    // swallow and use fallback
  }

  await kvSet(key, fallback, TTL_SECONDS);
  return NextResponse.json(fallback);
}


