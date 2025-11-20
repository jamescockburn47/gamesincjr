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
import { ArrowLeft, Trophy, Star, Share2 } from "lucide-react";
import Link from "next/link";

interface GamePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

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
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  const user = await getUserFromCookies();

  if (!game) {
    notFound();
  }

  const description = game.description || "No description available";

  return (
    <PageShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-10 pb-20">
        {/* Back Button */}
        <div>
          <Link href="/#games" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Link>
        </div>

        {/* Game Header Section */}
        <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  {game.gameType?.toUpperCase() || "HTML5"}
                </span>
                {game.status === "coming-soon" && (
                  <span className="inline-flex items-center rounded-lg bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
                    Coming soon
                  </span>
                )}
              </div>

              <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-tight">
                {game.title}
              </h1>

              <p className="text-xl leading-relaxed text-slate-600 max-w-2xl">
                {description}
              </p>
            </div>

            {game.tags && (
              <div className="flex flex-wrap gap-2">
                {game.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:scale-105 transition-all">
                <a href="#demo">Play Now</a>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg font-bold border-2 hover:bg-slate-50">
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Hero Image Card */}
          <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
            <Image
              src={game.hero || "/placeholder-hero.jpg"}
              alt={game.title}
              fill
              sizes="(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-yellow-100">Featured Game</span>
              </div>
            </div>
          </div>
        </section>

        {/* Game Player Section */}
        <section id="demo" className="mt-8 space-y-6" data-demo-section>
          {!hasAccessToGame(user.tier, 0) && (
            <div className="rounded-2xl bg-amber-50 px-6 py-4 text-base font-medium text-amber-900 ring-1 ring-amber-200/70 flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <p>
                Preview mode: play level one here. To unlock all levels, <a className="font-bold underline hover:text-amber-700" href="/about">choose a tier</a> and <a className="font-bold underline hover:text-amber-700" href="/account">sign in</a>.
              </p>
            </div>
          )}

          <div className="rounded-[2.5rem] bg-slate-900 p-4 shadow-2xl ring-4 ring-slate-900/10">
            <GamePlayerErrorBoundary>
              <GamePlayer game={game} />
            </GamePlayerErrorBoundary>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Suspense fallback={<div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />}>
              <Scores slug={slug} />
            </Suspense>

            <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎮</span> Controls
              </h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <kbd className="px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-700">WASD</kbd>
                  <span>or</span>
                  <kbd className="px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-700">Arrows</kbd>
                  <span>to move</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-700">Space</kbd>
                  <span>to jump / action</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-700">P</kbd>
                  <span>to pause</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Screenshots */}
        {game.screenshots?.length ? (
          <section className="space-y-8 mt-12">
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <span className="text-primary">📸</span> Screenshots
            </h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {game.screenshots.map((screen, index) => (
                <figure key={screen} className="group overflow-hidden rounded-3xl bg-slate-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                  <Image
                    src={screen}
                    alt={`${game.title} screenshot ${index + 1}`}
                    width={640}
                    height={360}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-[2rem] bg-gradient-to-br from-slate-50 to-white p-10 shadow-lg ring-1 ring-slate-100">
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

    if (!top.length) {
      return (
        <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-100 h-full flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-3xl">
            🏆
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Scores Yet</h3>
          <p className="text-slate-500">Be the first to set a high score!</p>
        </div>
      );
    }

    return (
      <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" /> Top Scores
        </h3>
        <ul className="space-y-3">
          {top.map((row, index) => (
            <li key={row.name + row.score} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  index === 0 ? "bg-yellow-100 text-yellow-700" :
                    index === 1 ? "bg-slate-200 text-slate-700" :
                      index === 2 ? "bg-orange-100 text-orange-800" :
                        "bg-slate-100 text-slate-500"
                )}>
                  #{index + 1}
                </span>
                <span className="font-bold text-slate-700">{row.name}</span>
              </div>
              <span className="font-black text-primary">{row.score.toLocaleString()}</span>
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
