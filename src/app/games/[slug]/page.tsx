import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getGameBySlug } from '@/lib/games';
import ComingSoon from '@/components/ComingSoon';
import GamePlayer from '@/components/GamePlayer';
import type { Metadata } from 'next';
import { getUserFromCookies, hasAccessToGame } from '@/lib/user-session';
import { Suspense } from 'react';

interface GamePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const game = getGameBySlug(params.slug);
  
  if (!game) {
    return {
      title: 'Game Not Found - Games Inc Jr',
      description: 'The requested game could not be found.',
    };
  }

  return {
    title: `${game.title} - Games Inc Jr`,
    description: game.description || `Play ${game.title} - an exciting HTML5 game available now!`,
    openGraph: {
      title: `${game.title} - Games Inc Jr`,
      description: game.description || `Play ${game.title} - an exciting HTML5 game available now!`,
      type: 'website',
      siteName: 'Games Inc Jr',
      images: game.hero ? [{ url: game.hero }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${game.title} - Games Inc Jr`,
      description: game.description || `Play ${game.title} - an exciting HTML5 game available now!`,
      images: game.hero ? [game.hero] : undefined,
    },
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const game = getGameBySlug(params.slug);
  const user = await getUserFromCookies();

  if (!game) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{game.title}</h1>
        <p className="text-lg text-gray-600">{game.description || 'No description available'}</p>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Left: Hero Image */}
        <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
          <img
            src={game.hero || '/placeholder-hero.jpg'}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right: Tags, Price, Buy Button */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex flex-wrap gap-2">
            {game.tags?.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          
          {/* Pricing moved to subscriptions; no per-game price */}
          
          <Button size="lg" className="w-fit">
            Buy
          </Button>
        </div>
      </div>

      {/* Game Player Section */}
      <div className="mb-12" data-demo-section>
        {/* Show a notice for non-subscribers, but ALWAYS render the demo */}
        {!hasAccessToGame(user.tier, 0) && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-4 mb-4">
            <p className="modern-text">
              Preview mode: you can play level 1 here. To unlock all levels, please{' '}
              <a className="underline" href="/about">choose a subscription tier</a> and then sign in on the{' '}
              <a className="underline" href="/account">Account</a> page.
            </p>
          </div>
        )}
        <GamePlayer game={game} />
        {/* Scoreboard */}
        <Suspense>
          <Scores slug={game.slug} />
        </Suspense>
      </div>

      {/* Screenshots Grid */}
      {game.screenshots && game.screenshots.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Screenshots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {game.screenshots.map((screen, index) => (
              <div key={index} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={screen}
                  alt={`${game.title} screenshot ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon Section */}
      <div className="mt-12">
        <ComingSoon 
          gameTitle={game.title} 
          hasDemo={!!game.demoPath} 
        />
      </div>
    </div>
  );
}

async function Scores({ slug }: { slug: string }) {
  try {
    const res = await fetch(`${process.env.APP_URL || ''}/api/scores/top?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    const data = await res.json();
    const top: Array<{ name: string; score: number }> = data?.top || [];
    if (!top.length) return null;
    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">Top Scores</h3>
        <ul className="divide-y divide-gray-200 rounded-lg border">
          {top.map((row, i) => (
            <li key={i} className="flex items-center justify-between px-4 py-2 bg-white">
              <span className="font-medium text-gray-700">#{i + 1} {row.name}</span>
              <span className="font-bold text-gray-900">{row.score}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  } catch {
    return null;
  }
}
