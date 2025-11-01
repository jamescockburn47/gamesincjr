import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/tables/db/prisma';
// import { isAdminAuthenticated } from '@/lib/admin-auth'; // TODO: Re-enable for production
import { SubmissionStatus } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

// Check if we're in a serverless environment (read-only filesystem)
const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_REGION || process.env.NEXT_RUNTIME === 'edge';

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
    const submission = await prisma.gameSubmission.findUnique({
      where: { id: params.id },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.status !== SubmissionStatus.APPROVED) {
      return NextResponse.json(
        { error: 'Only approved submissions can be deployed' },
        { status: 400 }
      );
    }

    if (!submission.generatedCode) {
      return NextResponse.json(
        { error: 'No generated code available' },
        { status: 400 }
      );
    }

    // On Vercel/serverless, filesystem is read-only - provide deployment instructions
    if (IS_SERVERLESS) {
      const updated = await prisma.gameSubmission.update({
        where: { id: params.id },
        data: {
          status: SubmissionStatus.APPROVED, // Keep as approved
          reviewNotes: `[DEPLOYMENT_REQUIRED] Files need to be deployed locally. Vercel filesystem is read-only. Use the deployment scripts or manual git deployment.`,
        },
      });

      return NextResponse.json(
        {
          error: 'File system deployment not available in serverless environment',
          details: 'Vercel has a read-only filesystem. To deploy this game, you need to run the deployment locally or use git.',
          instructions: {
            local: `Run locally: pnpm run deploy:make-your-game ${submission.gameSlug}`,
            manual: [
              `1. Create: public/demos/${submission.gameSlug}/index.html`,
              `2. Add game entry to src/data/games.json`,
              `3. Commit and push: git add . && git commit -m "Deploy game: ${submission.gameTitle}" && git push`,
            ],
          },
          submission: updated,
          gameData: {
            slug: submission.gameSlug,
            code: submission.generatedCode,
            gameEntry: {
              slug: submission.gameSlug,
              title: submission.gameTitle,
              tags: [submission.gameType, 'user-generated'],
              description: submission.gameDescription,
              description_it: submission.gameDescription,
              hero: `/games/${submission.gameSlug}/hero.svg`,
              screenshots: [
                `/games/${submission.gameSlug}/s1.svg`,
                `/games/${submission.gameSlug}/s2.svg`,
              ],
              demoPath: `/demos/${submission.gameSlug}/index.html`,
              gameType: 'html5',
              engine: 'vanilla-js',
              version: '1.0.0',
              status: 'released',
              submissionId: submission.id,
            },
          },
        },
        { status: 400 }
      );
    }

    // Create demo directory path
    const demoDir = path.join(process.cwd(), 'public', 'demos', submission.gameSlug);
    const demoFile = path.join(demoDir, 'index.html');

    try {
      // Ensure directory exists
      await fs.mkdir(demoDir, { recursive: true });

      // Write HTML file
      await fs.writeFile(demoFile, submission.generatedCode, 'utf-8');
      console.log(`[Admin] Deployed game HTML: ${demoFile}`);

      // Update games.json
      const gamesJsonPath = path.join(process.cwd(), 'src', 'data', 'games.json');
      const gamesData = JSON.parse(await fs.readFile(gamesJsonPath, 'utf-8')) as Array<{ slug: string }>;

      // Check if game already exists
      const existingIndex = gamesData.findIndex(
        (g: { slug: string }) => g.slug === submission.gameSlug
      );

      const newGameEntry = {
        slug: submission.gameSlug,
        title: submission.gameTitle,
        tags: [submission.gameType, 'user-generated'],
        description: submission.gameDescription,
        description_it: submission.gameDescription, // Use same description for Italian
        hero: `/games/${submission.gameSlug}/hero.svg`,
        screenshots: [
          `/games/${submission.gameSlug}/s1.svg`,
          `/games/${submission.gameSlug}/s2.svg`,
        ],
        demoPath: `/demos/${submission.gameSlug}/index.html`,
        gameType: 'html5',
        engine: 'vanilla-js',
        version: '1.0.0',
        status: 'released',
        submissionId: submission.id, // Track the submission
      };

      if (existingIndex >= 0) {
        gamesData[existingIndex] = newGameEntry;
      } else {
        gamesData.push(newGameEntry);
      }

      await fs.writeFile(gamesJsonPath, JSON.stringify(gamesData, null, 2), 'utf-8');
      console.log(`[Admin] Updated games.json with: ${submission.gameSlug}`);

      // Update submission status
      const updated = await prisma.gameSubmission.update({
        where: { id: params.id },
        data: {
          status: SubmissionStatus.LIVE,
          liveUrl: `/demos/${submission.gameSlug}/index.html`,
          approvedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        submission: updated,
        deployed: {
          slug: submission.gameSlug,
          demoPath: `/demos/${submission.gameSlug}/index.html`,
          gamesJsonUpdated: true,
        },
        message: 'Game deployed successfully! Please commit changes to git.',
      });
    } catch (fileError) {
      console.error('[Admin] File system error during deployment:', fileError);

      // If file system operations fail but we can still update DB
      const updated = await prisma.gameSubmission.update({
        where: { id: params.id },
        data: {
          status: SubmissionStatus.APPROVED, // Keep as approved, not live
          reviewNotes: `[DEPLOYMENT_PENDING] Files need manual deployment. Error: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`,
        },
      });

      return NextResponse.json(
        {
          error: 'File system deployment failed',
          details: 'Game marked as approved but not live. Manual deployment required.',
          submission: updated,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Admin] Deploy submission error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy submission' },
      { status: 500 }
    );
  }
}
