import { z } from 'zod';
import gamesData from '@/data/games.json';

// Zod schema for runtime validation - prevents XSS, path traversal, malformed data
const GameSchema = z.object({
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only')
    .min(1)
    .max(50),
  title: z.string().min(1).max(60),
  description: z.string().max(200).optional(),
  description_it: z.string().max(200).optional(),
  price: z.number().nonnegative().optional(),
  tags: z.array(z.string().max(20)).max(10).optional(),
  hero: z.string().regex(/^\/games\/[a-z0-9-]+\/[a-z0-9.-]+$/).optional(),
  screenshots: z.array(z.string().regex(/^\/games\/[a-z0-9-]+\/[a-z0-9.-]+$/)).max(10).optional(),
  demoPath: z.string().optional(), // Made optional to support API-served games
  status: z.enum(['released', 'coming-soon']).optional(),
  gameType: z.enum(['html5', 'video-preview', 'download', 'ai-powered']).optional(),
  videoPreview: z.string().url().optional(),
  downloadUrl: z.string().url().optional(),
  downloadSize: z.string().max(20).optional(),
  aiProvider: z.enum(['openai', 'anthropic', 'custom']).optional(),
  apiCostPerPlay: z.number().nonnegative().optional(),
  engine: z.enum(['unity', 'godot', 'phaser', 'vanilla-js', 'react', 'vue']).optional(),
  version: z.string().max(20).optional(),
  localPath: z.string().optional(),
  submissionId: z.string().optional(), // Track if game comes from database
  creatorName: z.string().optional(), // Player who created the game
});

export type Game = z.infer<typeof GameSchema>;

// Runtime validation for all games - throws descriptive error if validation fails
function validateGame(game: unknown, index: number): Game {
  try {
    return GameSchema.parse(game);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new Error(`Game at index ${index} is invalid: ${issues}`);
    }
    throw new Error(`Game at index ${index}: Unknown validation error`);
  }
}

// Validate all games on import (build-time check)
const validatedGames: Game[] = gamesData.map((game, index) => {
  return validateGame(game, index);
});

// Helper functions
export function getGames(): Game[] {
  return [...validatedGames];
}

export async function getAllGames(): Promise<Game[]> {
  const staticGames = [...validatedGames];
  
  // Also fetch approved user-generated games from database
  try {
    const { prisma } = await import('@/lib/tables/db/prisma');
    const { SubmissionStatus } = await import('@prisma/client');
    
    const approvedSubmissions = await prisma.gameSubmission.findMany({
      where: {
        status: SubmissionStatus.APPROVED,
        generatedCode: { not: null },
      },
      orderBy: {
        approvedAt: 'desc',
      },
      select: {
        id: true,
        gameSlug: true,
        gameTitle: true,
        gameDescription: true,
        gameType: true,
        creatorName: true,
      },
    });
    
    const userGames: Game[] = approvedSubmissions.map((submission) => ({
      slug: submission.gameSlug,
      title: submission.gameTitle,
      description: submission.gameDescription,
      description_it: submission.gameDescription,
      tags: [submission.gameType, 'user-generated'],
      hero: `/games/${submission.gameSlug}/hero.svg`,
      screenshots: [
        `/games/${submission.gameSlug}/s1.svg`,
        `/games/${submission.gameSlug}/s2.svg`,
      ],
      demoPath: `/api/games/${submission.gameSlug}/demo`,
      gameType: 'html5',
      engine: 'vanilla-js',
      version: '1.0.0',
      status: 'released',
      submissionId: submission.id,
      creatorName: submission.creatorName,
    }));
    
    return [...staticGames, ...userGames];
  } catch (error) {
    console.error('[Games] Error fetching user-generated games:', error);
    return staticGames; // Fallback to static games only
  }
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  // Additional slug validation at query time to prevent injection
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }
  
  // First check static games.json
  const staticGame = validatedGames.find(game => game.slug === slug);
  if (staticGame) {
    return staticGame;
  }
  
  // If not found, check database for approved user-generated games
  try {
    const { prisma } = await import('@/lib/tables/db/prisma');
    const { SubmissionStatus } = await import('@prisma/client');
    
    const submission = await prisma.gameSubmission.findFirst({
      where: {
        gameSlug: slug,
        status: SubmissionStatus.APPROVED,
      },
      orderBy: {
        approvedAt: 'desc',
      },
    });
    
    if (submission && submission.generatedCode) {
      // Return game object that will be served from API
      return {
        slug: submission.gameSlug,
        title: submission.gameTitle,
        description: submission.gameDescription,
        description_it: submission.gameDescription,
        tags: [submission.gameType, 'user-generated'],
        hero: `/games/${submission.gameSlug}/hero.svg`,
        screenshots: [
          `/games/${submission.gameSlug}/s1.svg`,
          `/games/${submission.gameSlug}/s2.svg`,
        ],
        demoPath: `/api/games/${submission.gameSlug}/demo`, // API endpoint instead of static file
        gameType: 'html5',
        engine: 'vanilla-js',
        version: '1.0.0',
        status: 'released',
        submissionId: submission.id,
        creatorName: submission.creatorName,
      };
    }
  } catch (error) {
    console.error('[Games] Error checking database for game:', error);
    // Fall through to return null
  }
  
  return null;
}

export function getGamePaths(): { slug: string }[] {
  return validatedGames.map(game => ({ slug: game.slug }));
}