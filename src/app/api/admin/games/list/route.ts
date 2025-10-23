import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/tables/db/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { SubmissionStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const isAuthenticated = await isAdminAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status && status !== 'all') {
      where.status = status as SubmissionStatus;
    }

    if (search) {
      where.OR = [
        { gameTitle: { contains: search, mode: 'insensitive' } },
        { creatorEmail: { contains: search, mode: 'insensitive' } },
        { creatorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch submissions
    const [submissions, total] = await Promise.all([
      prisma.gameSubmission.findMany({
        where,
        select: {
          id: true,
          status: true,
          gameTitle: true,
          gameSlug: true,
          creatorName: true,
          creatorEmail: true,
          createdAt: true,
          updatedAt: true,
          approvedAt: true,
          reviewNotes: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.gameSubmission.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      submissions,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('[Admin] List submissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
