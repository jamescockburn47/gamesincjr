import GameGrid from '@/components/GameGrid';
import { getGames } from '@/lib/games';

export const revalidate = 0;

export default function GamesPage() {
  const games = getGames();

  return (
    <>
      <header className="rounded-[2.5rem] bg-white p-8 shadow-float">
        <h1 className="font-heading text-4xl font-semibold text-ink">Explore Every Game</h1>
        <p className="mt-3 font-body text-sm text-ink/70">
          Sort by age, genre, and trending adventures. New worlds unlock every week.
        </p>
      </header>
      <GameGrid games={games} showFilters />
    </>
  );
}
