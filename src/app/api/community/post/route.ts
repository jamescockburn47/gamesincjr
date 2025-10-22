import { NextRequest, NextResponse } from 'next/server';
import { addMessage } from '@/lib/community-store';

// Simple in-memory rate limiter (production should use Upstash Ratelimit)
// Maps IP -> array of timestamps
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 posts per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(ip) || [];
  
  // Remove timestamps outside the window
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (recent.length >= MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }
  
  recent.push(now);
  rateLimitStore.set(ip, recent);
  return true;
}

export async function POST(req: NextRequest) {
  // Extract IP address
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  // Check rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a minute before posting again.' }, 
      { status: 429 }
    );
  }

  const { name, text } = await req.json();
  
  // Input validation
  if (!text || String(text).trim().length === 0) {
    return NextResponse.json({ error: 'Text required' }, { status: 400 });
  }
  
  // Length validation (prevent spam)
  if (String(text).trim().length > 500) {
    return NextResponse.json({ error: 'Text too long (max 500 characters)' }, { status: 400 });
  }
  
  // Sanitize input
  const sanitizedText = String(text).trim()
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .slice(0, 500);
  
  const sanitizedName = String(name || 'Anon').trim()
    .replace(/<[^>]*>/g, '')
    .slice(0, 50);
  
  const msg = {
    id: crypto.randomUUID(),
    name: sanitizedName,
    text: sanitizedText,
    ts: Date.now(),
  };
  
  await addMessage(msg);
  return NextResponse.json({ ok: true, item: msg });
}
