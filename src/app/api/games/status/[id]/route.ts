import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const submission = await prisma.gameSubmission.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        gameTitle: true,
      }
    });
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    const progress = calculateProgress(submission.status);
    
    return NextResponse.json({
      submissionId: submission.id,
      status: submission.status,
      progress,
      createdAt: submission.createdAt,
      gameTitle: submission.gameTitle,
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}

function calculateProgress(status: string): number {
  const progressMap: Record<string, number> = {
    'pending': 10,
    'building': 50,
    'review': 95,
    'approved': 100,
    'rejected': 0,
    'live': 100
  };
  return progressMap[status] || 0;
}
