import { NextResponse } from 'next/server';


export const runtime = 'nodejs';

export async function POST() {
  try {
    // For now avatars are static emoji placeholders; return the same mapping.
    const avatars = {
      luna: '🦉',
      shadow: '🐱',
      oak: '🦌',
      spark: '🐦',
      coral: '🐬',
      ember: '🦊',
    };
    return NextResponse.json({ avatars });
  } catch (error) {
    console.error('Failed to refresh avatars', error);
    return NextResponse.json({ error: 'Failed to refresh avatars' }, { status: 500 });
  }
}
