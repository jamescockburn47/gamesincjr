import gamesData from '@/data/games.json';

export type Game = {
  slug: string;
  title: string;
  description?: string;
  price?: number;
  tags?: readonly string[];
  hero?: string;
  screenshots?: string[];
  demoPath?: string;
  status?: 'released' | 'coming-soon';
  // Game integration types
  gameType?: 'html5' | 'video-preview' | 'download' | 'ai-powered';
  // For video previews
  videoPreview?: string;
  // For downloadable games
  downloadUrl?: string;
  downloadSize?: string;
  // For AI-powered games
  aiProvider?: 'openai' | 'anthropic' | 'custom';
  apiCostPerPlay?: number; // in cents
  // Game engine/platform
  engine?: 'unity' | 'godot' | 'phaser' | 'vanilla-js' | 'react' | 'vue';
  // Local development path (for reference)
  localPath?: string;
};

// Runtime validation for required fields
function validateGame(game: unknown): Game {
  if (!game || typeof game !== 'object') {
    throw new Error('Invalid game data: must be an object');
  }
  
  const gameObj = game as Record<string, unknown>;
  
  if (!gameObj.slug || typeof gameObj.slug !== 'string') {
    throw new Error('Invalid game data: slug is required and must be a string');
  }
  
  if (!gameObj.title || typeof gameObj.title !== 'string') {
    throw new Error('Invalid game data: title is required and must be a string');
  }
  
  // demoPath is optional now since we support different game types
  if (gameObj.demoPath && typeof gameObj.demoPath !== 'string') {
    throw new Error('Invalid game data: demoPath must be a string if provided');
  }
  
  return game as Game;
}

// Validate all games on import
const validatedGames: Game[] = gamesData.map((game, index) => {
  try {
    return validateGame(game);
  } catch (error) {
    throw new Error(`Game at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Helper functions
export function getGames(): Game[] {
  return [...validatedGames];
}

export function getGameBySlug(slug: string): Game | null {
  return validatedGames.find(game => game.slug === slug) || null;
}

export function getGamePaths(): { slug: string }[] {
  return validatedGames.map(game => ({ slug: game.slug }));
}
