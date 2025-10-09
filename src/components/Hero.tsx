import Link from 'next/link';
import type { Game } from '@/lib/games';

type HeroProps = {
  featuredGame: Game;
};

export default function Hero({ featuredGame }: HeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-white px-6 py-16 shadow-float">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(0,182,214,0.18),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(255,138,52,0.2),_transparent_60%)]" />
      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full bg-lagoon/15 px-4 py-1 font-body text-sm font-semibold text-lagoon">
            Play • Create • Imagine
          </span>
          <h1 className="font-heading text-5xl font-bold text-ink sm:text-6xl">
            Adventures that giggle, glow, and grow with your imagination.
          </h1>
          <p className="max-w-2xl font-body text-lg text-ink/70">
            Dive into vibrant worlds where dragons dance, robots bubble-build, and your curiosity
            drives the story. Every game is co-crafted with friendly AI companions that play nicely.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/games"
              className="rounded-2xl bg-lagoon px-6 py-3 font-body text-base font-semibold text-white shadow-float transition hover:-translate-y-1"
            >
              Start Playing
            </Link>
            <Link
              href="/about"
              className="rounded-2xl border border-ink/10 bg-white px-6 py-3 font-body text-base font-semibold text-ink transition hover:-translate-y-1"
            >
              Learn how it works
            </Link>
          </div>
        </div>
        <div className="relative h-80 overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-lagoon via-mango to-sun shadow-float">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.45),_transparent_55%),radial-gradient(circle_at_70%_80%,_rgba(255,255,255,0.35),_transparent_60%)]" />
          <div className="absolute inset-6 rounded-[1.75rem] bg-white/92 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lagoon/15 text-4xl">🎮</div>
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-lagoon">
                  Featured World
                </p>
                <h3 className="font-heading text-2xl font-semibold text-ink">{featuredGame.title}</h3>
              </div>
            </div>
            <p className="mt-6 font-body text-sm text-ink/70">
              {featuredGame.description ??
                'Leap into a co-op quest packed with silly surprises and sparkling rewards.'}
            </p>
            <div className="mt-6 rounded-2xl bg-ink px-5 py-4 text-sun shadow-inner">
              <p className="font-heading text-lg font-semibold text-white">
                Daily challenge: Sneak past the Glitter Geyser without losing your giggles.
              </p>
            </div>
            <Link
              href={`/games/${featuredGame.slug}`}
              className="mt-6 inline-flex rounded-2xl bg-white px-4 py-2 font-body text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-1"
            >
              Explore {featuredGame.title}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
