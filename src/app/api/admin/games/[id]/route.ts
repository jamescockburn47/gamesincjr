import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/tables/db/prisma';
import { SubmissionStatus } from '@prisma/client';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const submission = await prisma.gameSubmission.findUnique({
      where: { id: params.id },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error('[Admin] Get submission error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const body = await request.json();

    // Whitelist updatable fields — never pass the raw body to Prisma.
    const data: { status?: SubmissionStatus; reviewNotes?: string } = {};
    if (typeof body.status === 'string') {
      if (!Object.values(SubmissionStatus).includes(body.status as SubmissionStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      data.status = body.status as SubmissionStatus;
    }
    if (typeof body.reviewNotes === 'string') {
      data.reviewNotes = body.reviewNotes.slice(0, 2000);
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const updated = await prisma.gameSubmission.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      success: true,
      submission: updated,
    });
  } catch (error) {
    console.error('[Admin] Update submission error:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}
