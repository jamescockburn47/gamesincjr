import { deterministicHint } from "../core/hints";
import { sanitizeOperands, stripPII } from "./sanitize";
import { validateHint, validateExplain, type Hint, type Explain } from "./schemas";

type HintInput = { a: number; b: number; op: "*"; lastWrong?: number; theme?: string };
type ExplainInput = { a: number; b: number; op: "*"; typed: string };

export async function getHint(input: HintInput, callModel?: (prompt: string) => Promise<any>): Promise<Hint> {
  const { a, b } = sanitizeOperands(input.a, input.b);
  if (!callModel) return { hint: deterministicHint(a, b) };
  const sys = "You are a maths coach for 6–10 year-olds. Be concise, kind, concrete. Give one hint. No personal data.";
  const prompt = `${sys}\nOperands: ${a} x ${b}\nTheme: ${stripPII(input.theme || '')}`;
  try {
    const raw = await callModel(prompt);
    if (validateHint(raw)) return raw;
  } catch {}
  return { hint: deterministicHint(a, b) };
}

export async function explainError(input: ExplainInput, callModel?: (prompt: string) => Promise<any>): Promise<Explain> {
  const { a, b } = sanitizeOperands(input.a, input.b);
  if (!callModel) return { message: "Check your steps and try a strategy like splitting into tens.", pattern: "unknown" };
  const sys = "Explain the likely mistake in one sentence. Encourage strategy, not speed.";
  const prompt = `${sys}\nA: ${a} B: ${b} Typed: ${stripPII(input.typed || '')}`;
  try {
    const raw = await callModel(prompt);
    if (validateExplain(raw)) return raw;
  } catch {}
  return { message: "Try breaking the problem into smaller parts, like (a×10) − (a×(10−b)).", pattern: "unknown" };
}


