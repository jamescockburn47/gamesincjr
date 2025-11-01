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
      return NextResponse.json(
        { error: 'Game not found or not approved' },
        { status: 404 }
      );
    }

    // Serve the HTML code
    return new NextResponse(submission.generatedCode, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[API] Game demo error:', error);
    return NextResponse.json(
      { error: 'Failed to load game' },
      { status: 500 }
    );
  }
}
