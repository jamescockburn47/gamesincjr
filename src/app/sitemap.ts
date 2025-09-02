import type { MetadataRoute } from 'next';
import { getGames } from '@/lib/games';

export default function sitemap(): MetadataRoute.Sitemap {
  const games = getGames();
  
  const gameUrls = games.map((game) => ({
    url: `https://www.gamesincjr.com/games/${game.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: 'https://www.gamesincjr.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.gamesincjr.com/games',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...gameUrls,
  ];
}
