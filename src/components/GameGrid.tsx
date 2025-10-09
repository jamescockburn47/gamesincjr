import Image from 'next/image';
import Link from 'next/link';
import type { Game } from '@/lib/games';

type Props = {
  games: Game[];
  showFilters?: boolean;
};

const filters = {
  age: ['All', '5+', '7+', '9+', '11+'],
  genre: ['All', 'Adventure', 'STEM', 'Creative', 'Puzzle', 'Music'],
  popularity: ['Top', 'Rising', 'New'],
};

export default function GameGrid({ games, showFilters = false }: Props) {
  return (
    <section className="mt-14 space-y-8">
      {showFilters && (
        <div className="grid gap-4 rounded-[2.25rem] bg-white p-6 shadow-float sm:grid-cols-3">
          {Object.entries(filters).map(([group, options]) => (
            <div key={group}>
              <p className="font-body text-sm font-semibold text-ink/80 capitalize">{group}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="rounded-xl border border-ink/10 bg-cream px-3 py-1.5 font-body text-xs font-medium text-ink/70 transition hover:border-lagoon hover:text-ink"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <article
            key={game.slug}
            className="group hover-lift rounded-[2.5rem] bg-white shadow-float ring-1 ring-white/70"
          >
            <div className="relative h-44 overflow-hidden rounded-t-[2.5rem]">
              <Image
                src={game.hero ?? '/logo.svg'}
                alt={game.title}
                fill
                className="object-cover transition duration-500 ease-out group-hover:scale-105"
              />
              <span className="absolute left-5 top-5 inline-flex items-center rounded-full bg-lagoon px-3 py-1 font-body text-xs font-semibold text-white shadow-sm">
                Browser
              </span>
              {game.status === 'coming-soon' && (
                <span className="absolute right-5 top-5 inline-flex items-center rounded-full bg-mango px-3 py-1 font-body text-xs font-semibold text-white shadow-sm">
                  Coming soon
                </span>
              )}
            </div>
            <div className="space-y-4 p-6">
              <div>
                <h3 className="font-heading text-xl font-semibold text-ink">{game.title}</h3>
                <p className="mt-2 font-body text-sm text-ink/70">
                  {game.description ?? 'Playtest a whimsical mini world crafted with gentle AI.'}
                </p>
              </div>
              {game.tags && (
                <div className="flex flex-wrap gap-2">
                  {game.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-cream px-3 py-1 font-body text-xs font-medium text-ink/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <Link
                  href={`/games/${game.slug}`}
                  className="flex-1 rounded-2xl bg-lagoon px-4 py-2 text-center font-body text-sm font-semibold text-white transition hover:-translate-y-1"
                >
                  Play
                </Link>
                <Link
                  href={`/games/${game.slug}#details`}
                  className="rounded-2xl border border-ink/10 bg-white px-4 py-2 font-body text-sm font-semibold text-ink transition hover:-translate-y-1"
                >
                  Details
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
