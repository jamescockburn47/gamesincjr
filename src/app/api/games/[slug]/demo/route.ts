import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/tables/db/prisma';
import { SubmissionStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    
    // Validate slug
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug' },
        { status: 400 }
      );
    }

    // Find approved submission with this slug
    const submission = await prisma.gameSubmission.findFirst({
      where: {
        gameSlug: slug,
        status: SubmissionStatus.APPROVED,
      },
      orderBy: {
        approvedAt: 'desc',
      },
    });

    if (!submission || !submission.generatedCode) {
      return new NextResponse('Game not found or not approved', {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // Serve the HTML code with proper headers for iframe embedding
    return new NextResponse(submission.generatedCode, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[API] Game demo error:', error);
    return new NextResponse('Failed to load game', {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }
}
