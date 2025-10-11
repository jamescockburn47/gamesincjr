// Minimal local schema checks without zod dependency for now

export type Hint = { hint: string; teacher_note?: string };
export type Explain = { message: string; pattern?: "typo" | "reversal" | "near-multiple" | "unknown" };
export type WordProblem = { problem: string; operands: [number, number]; op: "*"; cultural_check?: boolean };

export function validateHint(v: unknown): v is Hint {
  if (typeof v !== 'object' || v === null) return false;
  const anyV = v as Record<string, unknown>;
  return typeof anyV.hint === 'string' && anyV.hint.length <= 160;
}

export function validateExplain(v: unknown): v is Explain {
  if (typeof v !== 'object' || v === null) return false;
  const anyV = v as Record<string, unknown>;
  if (typeof anyV.message !== 'string' || anyV.message.length > 200) return false;
  if (anyV.pattern && !["typo","reversal","near-multiple","unknown"].includes(String(anyV.pattern))) return false;
  return true;
}

export function validateWordProblem(v: unknown): v is WordProblem {
  if (typeof v !== 'object' || v === null) return false;
  const anyV = v as Record<string, unknown>;
  if (typeof anyV.problem !== 'string' || (anyV.problem as string).length > 160) return false;
  const ops = anyV.operands as unknown;
  if (!Array.isArray(ops) || ops.length !== 2) return false;
  if (typeof ops[0] !== 'number' || typeof ops[1] !== 'number') return false;
  return anyV.op === '*';
}


