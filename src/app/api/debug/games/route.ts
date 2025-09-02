import { NextResponse } from 'next/server';
import { getGames } from '@/lib/games';

export const revalidate = 0;

export async function GET() {
  try {
    const games = getGames();
    return NextResponse.json({ count: games.length, slugs: games.map(g => g.slug), games });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


