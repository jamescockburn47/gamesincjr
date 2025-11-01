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

    // On Vercel/serverless, use GitHub API to commit files automatically
    if (IS_SERVERLESS) {
      const githubToken = process.env.GITHUB_TOKEN;
      
      if (!githubToken) {
        const updated = await prisma.gameSubmission.update({
          where: { id: params.id },
          data: {
            status: SubmissionStatus.APPROVED,
            reviewNotes: `[DEPLOYMENT_REQUIRED] GITHUB_TOKEN not configured. Set GITHUB_TOKEN environment variable for automatic deployment.`,
          },
        });

        return NextResponse.json(
          {
            error: 'GitHub token not configured',
            details: 'Automatic deployment requires GITHUB_TOKEN environment variable. Set it in Vercel settings to enable automatic deployment.',
            instructions: {
              setup: 'Add GITHUB_TOKEN to Vercel environment variables with repo permissions',
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

      // Use GitHub API to deploy
      try {
        const repoOwner = 'jamescockburn47';
        const repoName = 'gamesincjr';
        const branch = 'master';

        // Get current games.json content
        const gamesJsonResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/contents/src/data/games.json?ref=${branch}`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!gamesJsonResponse.ok) {
          throw new Error(`Failed to fetch games.json: ${gamesJsonResponse.statusText}`);
        }

        const gamesJsonData = await gamesJsonResponse.json();
        const gamesContent = Buffer.from(gamesJsonData.content, 'base64').toString('utf-8');
        const gamesData = JSON.parse(gamesContent) as Array<{ slug: string }>;

        // Prepare game entry
        const newGameEntry = {
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
          gameType: 'html5' as const,
          engine: 'vanilla-js',
          version: '1.0.0',
          status: 'released' as const,
          submissionId: submission.id,
        };

        // Check if game already exists
        const existingIndex = gamesData.findIndex(
          (g: { slug: string }) => g.slug === submission.gameSlug
        );

        if (existingIndex >= 0) {
          gamesData[existingIndex] = newGameEntry;
        } else {
          gamesData.push(newGameEntry);
        }

        // Get latest commit SHA
        const refResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/git/ref/heads/${branch}`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!refResponse.ok) {
          throw new Error(`Failed to get branch ref: ${refResponse.statusText}`);
        }

        const refData = await refResponse.json();
        const baseSha = refData.object.sha;

        // Get commit tree
        const commitResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/git/commits/${baseSha}`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!commitResponse.ok) {
          throw new Error(`Failed to get commit: ${commitResponse.statusText}`);
        }

        const commitData = await commitResponse.json();
        const baseTreeSha = commitData.tree.sha;

        // Create blobs for new files
        const htmlContent = Buffer.from(submission.generatedCode).toString('base64');
        const gamesContentBase64 = Buffer.from(JSON.stringify(gamesData, null, 2)).toString('base64');

        // Create tree with new files
        const treeResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees`,
          {
            method: 'POST',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              base_tree: baseTreeSha,
              tree: [
                {
                  path: `public/demos/${submission.gameSlug}/index.html`,
                  mode: '100644',
                  type: 'blob',
                  content: submission.generatedCode,
                },
                {
                  path: 'src/data/games.json',
                  mode: '100644',
                  type: 'blob',
                  content: JSON.stringify(gamesData, null, 2),
                },
              ],
            }),
          }
        );

        if (!treeResponse.ok) {
          const treeError = await treeResponse.text();
          throw new Error(`Failed to create tree: ${treeResponse.statusText} - ${treeError}`);
        }

        const treeData = await treeResponse.json();
        const newTreeSha = treeData.sha;

        // Create commit
        const newCommitResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/git/commits`,
          {
            method: 'POST',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Deploy game: ${submission.gameTitle}`,
              tree: newTreeSha,
              parents: [baseSha],
            }),
          }
        );

        if (!newCommitResponse.ok) {
          const commitError = await newCommitResponse.text();
          throw new Error(`Failed to create commit: ${newCommitResponse.statusText} - ${commitError}`);
        }

        const newCommitData = await newCommitResponse.json();
        const newCommitSha = newCommitData.sha;

        // Update branch reference
        const updateRefResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${branch}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sha: newCommitSha,
            }),
          }
        );

        if (!updateRefResponse.ok) {
          const refError = await updateRefResponse.text();
          throw new Error(`Failed to update branch: ${updateRefResponse.statusText} - ${refError}`);
        }

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
            commitSha: newCommitSha,
            githubUrl: `https://github.com/${repoOwner}/${repoName}/commit/${newCommitSha}`,
          },
          message: 'Game deployed successfully via GitHub API! Vercel will auto-deploy.',
        });
      } catch (githubError) {
        console.error('[Admin] GitHub API deployment error:', githubError);
        
        const updated = await prisma.gameSubmission.update({
          where: { id: params.id },
          data: {
            status: SubmissionStatus.APPROVED,
            reviewNotes: `[DEPLOYMENT_FAILED] GitHub API error: ${githubError instanceof Error ? githubError.message : 'Unknown error'}`,
          },
        });

        return NextResponse.json(
          {
            error: 'GitHub API deployment failed',
            details: githubError instanceof Error ? githubError.message : 'Unknown error',
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
          { status: 500 }
        );
      }
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
