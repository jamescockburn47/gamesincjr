import Hero from '@/components/Hero';
import StatsRow from '@/components/StatsRow';
import GameGrid from '@/components/GameGrid';
import AdventureBoard from '@/components/AdventureBoard';
import SafetySection from '@/components/SafetySection';
import { getGames, type Game } from '@/lib/games';

const fallbackGame: Game = {
  slug: 'coming-soon',
  title: 'New Adventure Coming Soon',
  description: 'Check back shortly for a fresh quest from the Games Inc Jr lab.',
  hero: '/logo.svg',
  tags: ['Preview'],
  status: 'coming-soon',
};

export default function HomePage() {
  const games = getGames();
  const featuredGame = games[0] ?? fallbackGame;
  const liveGames = games.length ? games.slice(0, 6) : [fallbackGame];

  return (
    <>
      <Hero featuredGame={featuredGame} />
      <StatsRow />
      <section className="mt-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-semibold text-ink">Live Games Ready to Play</h2>
            <p className="font-body text-sm text-ink/70">
              Every world blends playful design with frontier AI imagination. Try a free preview before you subscribe.
            </p>
          </div>
          <span className="rounded-2xl bg-white px-4 py-2 font-body text-xs font-semibold text-ink/70 shadow-sm">
            New adventures unlock weekly
          </span>
        </header>
        <GameGrid games={liveGames} />
      </section>
      <AdventureBoard />
      <SafetySection />
    </>
  );
}
