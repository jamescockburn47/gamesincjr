import Link from 'next/link';
import Image from 'next/image';
import { getAllGames } from '@/lib/games';
import { homeContent } from '@/data/homeContent';
import ParentsCorner from '@/components/ParentsCorner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Gamepad2, Sparkles, Rocket } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const allGames = await getAllGames();
  const displayGames = allGames.filter(g => !g.internal && g.status !== 'coming-soon');
  const comingSoonGames = allGames.filter(g => !g.internal && g.status === 'coming-soon');
  const { hero } = homeContent;

  return (
    <main className="min-h-screen overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-accent/10 blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 text-center lg:pt-32 lg:pb-32">
        <div className="container mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/50 backdrop-blur-md px-4 py-1.5 text-sm font-bold text-primary shadow-sm ring-1 ring-primary/20 mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            {hero.eyebrow}
          </div>

          <h1 className="text-6xl font-black tracking-tight text-slate-900 sm:text-7xl lg:text-8xl mb-8 drop-shadow-sm leading-tight animate-fade-in-up delay-100">
            <span className="text-gradient">{hero.title}</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            {hero.description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 animate-fade-in-up delay-300">
            <Link href="#games">
              <Button size="lg" className="h-16 px-10 rounded-full text-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 hover:scale-105 transition-all duration-300">
                Play Now <Gamepad2 className="ml-3 w-6 h-6" />
              </Button>
            </Link>
            <Link href="/imaginary-friends">
              <Button size="lg" variant="outline" className="h-16 px-10 rounded-full text-xl font-bold border-2 bg-white/50 backdrop-blur hover:bg-white hover:text-primary transition-all duration-300">
                Magic Friends <Sparkles className="ml-3 w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section id="games" className="py-24 px-4 bg-white/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-black text-slate-900 flex items-center gap-4">
              <span className="p-3 rounded-2xl bg-primary/10 text-primary"><Gamepad2 className="w-8 h-8" /></span>
              Featured Games
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayGames.map((game) => (
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
                  </div>
                  <CardHeader className="p-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {game.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {tag}
                        </span>
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
