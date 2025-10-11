import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const targets = Array.from({ length: 10 }).map((_, i) => ({ id: `f_${i}`, a: 1 + (i % 12), b: 1 + ((i * 3) % 12), op: '*' }));
  return NextResponse.json({ targets });
}


