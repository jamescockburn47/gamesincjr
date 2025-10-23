import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/tables/db/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { SubmissionStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Re-enable auth after testing
    // const isAuthenticated = await isAdminAuthenticated();
    // if (!isAuthenticated) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const params = await context.params;
    const body = await request.json();
    const { reviewNotes } = body;

    if (!reviewNotes) {
      return NextResponse.json(
        { error: 'Review notes are required for rejection' },
        { status: 400 }
      );
    }

    const submission = await prisma.gameSubmission.findUnique({
      where: { id: params.id },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Update submission to REJECTED status
    const updated = await prisma.gameSubmission.update({
      where: { id: params.id },
      data: {
        status: SubmissionStatus.REJECTED,
        reviewNotes: `[REJECTED] ${reviewNotes}`,
      },
    });

    console.log(`[Admin] Rejected submission: ${params.id} (${submission.gameSlug})`);

    return NextResponse.json({
      success: true,
      submission: updated,
    });
  } catch (error) {
    console.error('[Admin] Reject submission error:', error);
    return NextResponse.json(
      { error: 'Failed to reject submission' },
      { status: 500 }
    );
  }
}
