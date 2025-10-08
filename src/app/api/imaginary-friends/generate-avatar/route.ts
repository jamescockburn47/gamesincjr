import { NextRequest, NextResponse } from 'next/server';
import { generateAvatar } from '../_lib/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const appearance = String(body.appearance || '').trim();
    if (!name || !appearance) {
      return NextResponse.json({ error: 'Missing name or appearance' }, { status: 400 });
    }
    const avatarUrl = await generateAvatar({ name, appearance, emoji: body.emoji });
    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error('Avatar generation failed', error);
    return NextResponse.json(
      { error: 'Failed to generate avatar' },
      { status: 500 },
    );
  }
}
