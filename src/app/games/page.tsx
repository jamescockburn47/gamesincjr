import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import GameFilters from "@/components/GameFilters";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAllGames } from "@/lib/games";
import { ArrowRight, Sparkles, Users } from "lucide-react";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function GamesPage() {
  const allGames = await getAllGames();
  // Filter out internal games (like happy-birthday-monkey)
  const publicGames = allGames.filter(game => !game.internal);
  const regularGames = publicGames.filter(game => !game.submissionId);
  const playerGames = publicGames.filter(game => game.submissionId);

  // Get all unique tags
  const allTags = Array.from(
    new Set(publicGames.flatMap(game => game.tags || []))
  ).sort();

  return (
    <PageShell>
      <div className="flex flex-col gap-16">
        <PageHeader
          eyebrow="Game Library"
          title="Discover Amazing Games"
          description="Jump into colorful adventures that run right in your browser. Every title is designed for fun, learning, and creativity."
          actions={
            <Link
              href="/make-your-game"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white/70 backdrop-blur rounded-full")}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Make Your Own Game
            </Link>
          }
        />

        {/* Filters */}
        <Suspense fallback={<div className="h-20 animate-pulse bg-slate-100 rounded-2xl" />}>
          <GameFilters allTags={allTags} gameCount={publicGames.length} />
        </Suspense>

        {/* Regular Games Section */}
        {regularGames.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-2xl font-black text-slate-900">Our Games</h2>
              <Badge variant="default" className="rounded-full">
                {regularGames.length} games
              </Badge>
            </div>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {regularGames.map((game) => (
                <Link key={game.slug} href={`/games/${game.slug}`} className="group block">
                  <Card className="h-full overflow-hidden border-0 bg-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-[2rem]">
                    <CardHeader className="relative aspect-[16/10] overflow-hidden p-0">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10" />
                      <Image
                        src={game.hero || "/placeholder-hero.jpg"}
                        alt={game.title}
                        fill
                        sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        priority={game.slug === "alien-unicorn-alliance"}
                      />
                      {game.status === "coming-soon" && (
                        <Badge variant="secondary" className="absolute right-4 top-4 z-20">
                          Coming soon
                        </Badge>
                      )}

                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <span className="flex items-center gap-2 px-6 py-3 bg-white/90 backdrop-blur rounded-full font-bold text-slate-900 shadow-lg">
                          Play Now <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                          {game.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-2">
                          {game.description || "No description available"}
                        </p>
                      </div>
                      {game.tags && (
                        <div className="flex flex-wrap gap-2">
                          {game.tags.map((tag) => (
                            <Badge key={tag} variant="tag" className="group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                      <span className="text-sm font-bold text-slate-500">Free to play</span>
                      <Button variant="game" size="sm">
                        Play
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Made by Players Section */}
        {playerGames.length > 0 && (
          <section>
            <div className="mb-8 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Made by Players</h2>
              <Badge variant="playerMade">
                {playerGames.length} {playerGames.length === 1 ? 'game' : 'games'}
              </Badge>
            </div>
            <p className="mb-8 text-base leading-7 text-slate-600 max-w-2xl">
              Games created by our community members using our AI game builder. Try them out and see what&apos;s possible!
            </p>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {playerGames.map((game) => (
                <Link key={game.slug} href={`/games/${game.slug}`} className="group block">
                  <Card className="h-full overflow-hidden border-2 border-purple-100 bg-white shadow-lg hover:shadow-2xl hover:border-purple-300 transition-all duration-500 hover:-translate-y-2 rounded-[2rem]">
                    <CardHeader className="relative aspect-[16/10] overflow-hidden p-0">
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10" />
                      <Image
                        src={game.hero || "/placeholder-hero.jpg"}
                        alt={game.title}
                        fill
                        sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <Badge variant="playerMade" className="absolute left-4 top-4 z-20">
                        Player Made
                      </Badge>

                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <span className="flex items-center gap-2 px-6 py-3 bg-white/90 backdrop-blur rounded-full font-bold text-purple-700 shadow-lg">
                          Play Now <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                          {game.title}
                        </h3>
                        {game.creatorName && (
                          <p className="mt-1 text-sm font-bold text-purple-600">
                            by {game.creatorName}
                          </p>
                        )}
                        <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-2">
                          {game.description || "No description available"}
                        </p>
                      </div>
                      {game.tags && (
                        <div className="flex flex-wrap gap-2">
                          {game.tags.map((tag) => (
                            <Badge key={tag} variant="tag" className="bg-purple-50 text-purple-600">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t border-purple-100 bg-purple-50/50 p-4">
                      <span className="text-sm font-bold text-purple-500">Free to play</span>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white" size="sm">
                        Play
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="rounded-[2rem] bg-gradient-to-br from-primary/5 via-white to-accent/5 p-8 md:p-12 text-center shadow-xl border border-primary/10">
          <h2 className="text-3xl font-black text-slate-900">Want to Create Your Own Game?</h2>
          <p className="mt-4 text-lg leading-7 text-slate-600 max-w-2xl mx-auto">
            Use our AI-powered game builder to create your own browser games. No coding experience needed!
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/make-your-game">
              <Button variant="fun" size="lg" className="rounded-full">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Creating
              </Button>
            </Link>
            <Link href="/community">
              <Button variant="bubble" size="lg" className="rounded-full">
                <Users className="w-5 h-5 mr-2" />
                Join Community
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
