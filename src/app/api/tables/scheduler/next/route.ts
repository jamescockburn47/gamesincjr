import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  // Cycle through full 1..12 x 1..12 facts deterministically
  const facts: { id: string; a: number; b: number; op: '*' }[] = [];
  for (let a = 1; a <= 12; a++) {
    for (let b = 1; b <= 12; b++) {
      facts.push({ id: `f_${a}x${b}`, a, b, op: '*' });
    }
  }
  // Pick 10 focusing on lower mastery first (placeholder: simple slice with offset)
  const offset = 0;
  const targets = facts.slice(offset, offset + 10);
  return NextResponse.json({ targets });
}


