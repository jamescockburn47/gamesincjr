import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const storageMode = (process.env.IMAGINARY_FRIENDS_STORAGE || 'auto').toLowerCase();
  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_RW_TOKEN);
  return NextResponse.json({
    ok: true,
    openai: hasOpenAI ? 'configured' : 'missing',
    storageMode,
    blobToken: hasBlobToken ? 'present' : 'missing',
  });
}


