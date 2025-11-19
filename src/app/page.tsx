import Link from 'next/link';
import Image from 'next/image';
import { getAllGames } from '@/lib/games';
import { homeContent } from '@/data/homeContent';
import ParentsCorner from '@/components/ParentsCorner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const allGames = await getAllGames();
  const displayGames = allGames.filter(g => !g.internal && g.status !== 'coming-soon');
  const comingSoonGames = allGames.filter(g => !g.internal && g.status === 'coming-soon');
  const { hero } = homeContent;

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      {/* Playful Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-sky-100/50 blur-3xl opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-rose-100/50 blur-3xl opacity-60" />
      </div>

      {/* Hero Section */}
      <section className="pt-12 pb-16 px-4 text-center lg:pt-24 lg:pb-20">
        <div className="container mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-sky-600 shadow-sm ring-1 ring-sky-100 mb-8 backdrop-blur-sm">
            <span className="text-lg">🚀</span>
            {hero.eyebrow}
          </div>
          
          <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl mb-6 drop-shadow-sm">
            {hero.title}
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {hero.description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="#games">
              <Button size="lg" className="h-14 px-8 rounded-2xl text-lg bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95">
                Play Now 🎮
              </Button>
            </Link>
            <Link href="/imaginary-friends">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-lg border-2 bg-white hover:bg-slate-50 hover:text-sky-600 shadow-sm transition-all hover:scale-105 active:scale-95">
                Meet Magic Friends ✨
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section id="games" className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <span className="text-4xl">🎮</span> All Games
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayGames.map((game) => (
              <Link key={game.slug} href={`/games/${game.slug}`} className="group block h-full">
                <Card className="h-full overflow-hidden border-2 border-slate-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-sky-200 hover:ring-4 hover:ring-sky-100 rounded-3xl">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {game.hero && (
                      <Image
                        src={game.hero}
                        alt={game.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <CardHeader className="p-5 pb-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {game.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                      {game.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-2">
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {game.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {comingSoonGames.length > 0 && (
            <>
              <div className="flex items-center gap-4 my-12">
                <div className="h-px flex-1 bg-slate-200" />
                <h3 className="text-lg font-bold uppercase tracking-widest text-slate-400">Coming Soon</h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 opacity-75">
                {comingSoonGames.map((game) => (
                  <Card key={game.slug} className="h-full border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-3xl">
                    <CardHeader className="p-5">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-2xl grayscale">
                        🚀
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-700">
                        {game.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <p className="text-sm text-slate-500">
                        {game.description}
                      </p>
                    </CardContent>
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
