// Force dynamic rendering for game pages - ensures new games appear immediately
export const dynamic = 'force-dynamic';

import Image from "next/image";
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import { Button, buttonVariants } from "@/components/ui/button";
import ComingSoon from "@/components/ComingSoon";
import GamePlayer from "@/components/GamePlayer";
import { GamePlayerErrorBoundary } from "@/components/GamePlayerErrorBoundary";
import { getGameBySlug } from "@/lib/games";
import { cn } from "@/lib/utils";
import { getUserFromCookies, hasAccessToGame } from "@/lib/user-session";

interface GamePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const game = getGameBySlug(params.slug);

  if (!game) {
    return {
      title: "Game Not Found - Games Inc Jr",
      description: "The requested game could not be found.",
    };
  }

  return {
    title: `${game.title} - Games Inc Jr`,
    description: game.description || `Play ${game.title} - an exciting HTML5 game available now!`,
    openGraph: {
      title: `${game.title} - Games Inc Jr`,
      description: game.description || `Play ${game.title} - an exciting HTML5 game available now!`,
      type: "website",
      siteName: "Games Inc Jr",
      images: game.hero ? [{ url: game.hero }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
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

  const description = game.description || "No description available";

  return (
    <PageShell>
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                {game.gameType?.toUpperCase() || "HTML5"}
              </span>
              {game.status === "coming-soon" && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Coming soon
                </span>
              )}
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{game.title}</h1>
              <p className="text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
            </div>
            {game.tags && (
              <div className="flex flex-wrap gap-2">
                {game.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-600 ring-1 ring-sky-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="bg-sky-500 text-white hover:bg-sky-500/90">
                <a href="#demo">Play the demo</a>
              </Button>
              <a
                href="/about"
                className={cn(buttonVariants({ variant: "outline" }), "bg-white/80 backdrop-blur")}
              >
                View membership tiers
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-1 shadow-2xl">
            <div className="rounded-[26px] bg-slate-900/70 p-6">
              <div className="relative h-72 w-full overflow-hidden rounded-2xl">
                <Image
                  src={game.hero || "/placeholder-hero.jpg"}
                  alt={game.title}
                  fill
                  sizes="(min-width: 1280px) 480px, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-5 space-y-2 rounded-2xl bg-slate-800/60 p-5 text-slate-100">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Included with membership</p>
                <p className="text-sm text-slate-300">Try level one free, then sign in to unlock more worlds.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="space-y-6 rounded-3xl bg-white/80 p-8 shadow-xl ring-1 ring-slate-100" data-demo-section>
          {!hasAccessToGame(user.tier, 0) && (
            <div className="rounded-2xl bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200/70">
              Preview mode: play level one here. To unlock all levels, choose a tier on the <a className="font-semibold text-amber-900 underline" href="/about">About</a> page and then sign in on the <a className="font-semibold text-amber-900 underline" href="/account">Account</a> page.
            </div>
          )}
          <GamePlayerErrorBoundary>
            <GamePlayer game={game} />
          </GamePlayerErrorBoundary>
          <Suspense>
            <Scores slug={game.slug} />
          </Suspense>
        </section>

        {game.screenshots?.length ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Screenshots</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {game.screenshots.map((screen, index) => (
                <figure key={screen} className="overflow-hidden rounded-2xl bg-slate-100">
                  <Image
                    src={screen}
                    alt={`${game.title} screenshot ${index + 1}`}
                    width={640}
                    height={360}
                    className="h-full w-full object-cover"
                  />
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <ComingSoon gameTitle={game.title} hasDemo={!!game.demoPath} />
        </section>
      </div>
    </PageShell>
  );
}

async function Scores({ slug }: { slug: string }) {
  try {
    const res = await fetch(`${process.env.APP_URL || ""}/api/scores/top?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
    const data = await res.json();
    const top: Array<{ name: string; score: number }> = data?.top || [];
    if (!top.length) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Top scores</h3>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl ring-1 ring-slate-100">
          {top.map((row, index) => (
            <li key={row.name + row.score} className="flex items-center justify-between bg-white/70 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold">#{index + 1} {row.name}</span>
              <span className="font-bold text-slate-900">{row.score}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  } catch (error) {
    console.error(error);
    return null;
  }
}
