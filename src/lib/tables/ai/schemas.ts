// Minimal local schema checks without zod dependency for now

export type Hint = { hint: string; teacher_note?: string };
export type Explain = { message: string; pattern?: "typo" | "reversal" | "near-multiple" | "unknown" };
export type WordProblem = { problem: string; operands: [number, number]; op: "*"; cultural_check?: boolean };

export function validateHint(v: any): v is Hint {
  return v && typeof v.hint === 'string' && v.hint.length <= 160;
}

export function validateExplain(v: any): v is Explain {
  if (!v || typeof v.message !== 'string' || v.message.length > 200) return false;
  if (v.pattern && !["typo","reversal","near-multiple","unknown"].includes(v.pattern)) return false;
  return true;
}

export function validateWordProblem(v: any): v is WordProblem {
  if (!v || typeof v.problem !== 'string' || v.problem.length > 160) return false;
  if (!Array.isArray(v.operands) || v.operands.length !== 2) return false;
  if (typeof v.operands[0] !== 'number' || typeof v.operands[1] !== 'number') return false;
  return v.op === '*';
}


