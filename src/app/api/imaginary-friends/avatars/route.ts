import { NextResponse } from 'next/server';


export const runtime = 'nodejs';

export async function GET() {
  try {
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
    console.error('Failed to list avatars', error);
    return NextResponse.json({ avatars: {} }, { status: 500 });
  }
}
