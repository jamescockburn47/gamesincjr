export function sanitizeOperands(a: number, b: number): { a: number; b: number } {
  const aa = Number.isFinite(a) ? Math.max(0, Math.min(12, Math.floor(a))) : 0;
  const bb = Number.isFinite(b) ? Math.max(0, Math.min(12, Math.floor(b))) : 0;
  return { a: aa, b: bb };
}

export function stripPII(input: string): string {
  if (!input) return '';
  return input.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted]');
}


