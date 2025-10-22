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
  demoPath: z.string()
    .regex(/^\/demos\/[a-z0-9-]+\/index\.html$/, 'demoPath must be /demos/[slug]/index.html')
    .optional(),
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

export function getGameBySlug(slug: string): Game | null {
  // Additional slug validation at query time to prevent injection
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }
  return validatedGames.find(game => game.slug === slug) || null;
}

export function getGamePaths(): { slug: string }[] {
  return validatedGames.map(game => ({ slug: game.slug }));
}
