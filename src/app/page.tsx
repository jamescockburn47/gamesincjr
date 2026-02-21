import Link from 'next/link';
import Image from 'next/image';
import { getAllGames } from '@/lib/games';
import { homeContent } from '@/data/homeContent';
import ParentsCorner from '@/components/ParentsCorner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Gamepad2, Sparkles, Rocket, Star, Users, Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const allGames = await getAllGames();
  const displayGames = allGames.filter(g => !g.internal && g.status !== 'coming-soon');
  const comingSoonGames = allGames.filter(g => !g.internal && g.status === 'coming-soon');
  const featuredGame = displayGames[0];
  const otherGames = displayGames.slice(1);
  const { hero } = homeContent;

  return (
    <main className="min-h-screen overflow-hidden">
      {/* Enhanced Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white to-orange-50/30" />

        {/* Animated gradient blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Floating decorative shapes */}
        <div className="absolute top-32 left-[10%] w-16 h-16 rounded-full bg-secondary/20 animate-float" />
        <div className="absolute top-64 right-[15%] w-20 h-20 rounded-full bg-primary/15 animate-float-delayed" />
        <div className="absolute bottom-48 left-[20%] w-12 h-12 rounded-full bg-accent/20 animate-float-slow" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-6 pb-8 px-4 text-center sm:pt-12 sm:pb-16 lg:pt-24 lg:pb-24">
        <div className="container mx-auto max-w-5xl">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-md px-4 py-1.5 text-xs sm:text-sm font-bold text-primary shadow-lg ring-1 ring-primary/20 mb-4 sm:mb-6 animate-bounce-in">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
            {hero.eyebrow}
          </div>

          {/* Main Title — compact on mobile */}
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-7xl mb-3 sm:mb-5 drop-shadow-sm leading-tight animate-fade-in-up delay-100">
            <span className="text-gradient">{hero.title}</span>
          </h1>

          {/* Description — hidden on very small, visible from sm */}
          <p className="hidden sm:block text-lg md:text-xl text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            {hero.description}
          </p>

          {/* CTA Buttons — stacked on mobile, row on sm+ */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 animate-fade-in-up delay-300">
            <Link href="#games">
              <Button variant="fun" size="lg" className="rounded-full shadow-xl shadow-primary/25 w-full sm:w-auto">
                Play Now <Gamepad2 className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/imaginary-friends">
              <Button variant="bubble" size="lg" className="rounded-full w-full sm:w-auto">
                Magic Friends <Sparkles className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Stats Banner — hidden on mobile to save space */}
          <div className="hidden sm:flex flex-wrap items-center justify-center gap-6 mt-10 animate-fade-in-up delay-500">
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/60 backdrop-blur rounded-2xl shadow-sm">
              <div className="p-2 rounded-xl bg-primary/10">
                <Gamepad2 className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-slate-900">{displayGames.length}+</div>
                <div className="text-xs text-slate-500 font-medium">Games</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/60 backdrop-blur rounded-2xl shadow-sm">
              <div className="p-2 rounded-xl bg-secondary/10">
                <Users className="w-4 h-4 text-secondary" />
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-slate-900">1000+</div>
                <div className="text-xs text-slate-500 font-medium">Players</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/60 backdrop-blur rounded-2xl shadow-sm">
              <div className="p-2 rounded-xl bg-accent/10">
                <Trophy className="w-4 h-4 text-accent" />
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-slate-900">Fun</div>
                <div className="text-xs text-slate-500 font-medium">Guaranteed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Game Spotlight */}
      {featuredGame && (
        <section className="py-6 sm:py-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <Link href={`/games/${featuredGame.slug}`} className="group block">
              <Card className="overflow-hidden border-0 bg-white shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-[2.5rem]">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Image */}
                  <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden bg-slate-100">
                    {featuredGame.hero && (
                      <Image
                        src={featuredGame.hero}
                        alt={featuredGame.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent md:bg-gradient-to-l" />
                    <Badge variant="featured" className="absolute top-6 left-6 px-4 py-2">
                      <Star className="w-4 h-4 mr-1" /> Featured
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {featuredGame.tags?.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="tag">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 group-hover:text-primary transition-colors">
                      {featuredGame.title}
                    </h2>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                      {featuredGame.description}
                    </p>
                    <Button variant="game" size="lg" className="w-fit">
                      Play Now <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </section>
      )}

      {/* Games Grid */}
      <section id="games" className="py-10 sm:py-16 lg:py-24 px-4 bg-white/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 flex items-center gap-3">
              <span className="p-2 sm:p-3 rounded-2xl bg-primary/10 text-primary"><Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8" /></span>
              All Games
            </h2>
            <Link href="/games" className="text-primary font-bold hover:underline flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherGames.map((game) => (
              <Link key={game.slug} href={`/games/${game.slug}`} className="group block h-full">
                <Card className="h-full overflow-hidden border-0 bg-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-[2rem]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {game.hero && (
                      <Image
                        src={game.hero}
                        alt={game.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="absolute bottom-4 left-4 right-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0 opacity-0 group-hover:opacity-100">
                      <span className="inline-flex items-center justify-center w-full py-3 bg-white/90 backdrop-blur rounded-xl text-sm font-bold text-slate-900">
                        Play Now <ArrowRight className="ml-2 w-4 h-4" />
                      </span>
                    </div>

                    {/* Player made badge */}
                    {game.submissionId && (
                      <Badge variant="playerMade" className="absolute top-3 right-3">
                        Player Made
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="p-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {game.tags?.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="tag" className="group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors mb-2">
                      {game.title}
                    </CardTitle>
                    <p className="text-slate-500 line-clamp-2 leading-relaxed text-sm font-medium">
                      {game.description}
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {comingSoonGames.length > 0 && (
            <>
              <div className="flex items-center gap-6 my-20">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Coming Soon</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 opacity-60 hover:opacity-100 transition-opacity duration-500">
                {comingSoonGames.map((game) => (
                  <Card key={game.slug} className="h-full border-2 border-dashed border-slate-200 bg-transparent shadow-none rounded-[2rem] hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <CardHeader className="p-8 text-center">
                      <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl grayscale group-hover:grayscale-0">
                        <Rocket className="w-8 h-8 text-slate-400" />
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-700 mb-2">
                        {game.title}
                      </CardTitle>
                      <p className="text-sm text-slate-500">
                        {game.description}
                      </p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <ParentsCorner />
    </main>
  );
}
