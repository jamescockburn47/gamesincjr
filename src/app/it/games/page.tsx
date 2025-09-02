import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { getGames } from '@/lib/games';

export const revalidate = 0;

export default function GiochiPage() {
  const games = getGames();
  return (
    <div className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="pixel-bounce mb-6"><div className="text-5xl">🎮</div></div>
          <h1 className="pixel-text text-5xl font-bold text-yellow-400 mb-6 tracking-wider">I NOSTRI GIOCHI</h1>
          <p className="text-xl text-cyan-300 max-w-3xl mx-auto leading-relaxed">
            Scopri fantastici giochi HTML5 da giocare subito nel browser!
            <span className="text-orange-400 font-bold"> Nessun download, solo divertimento!</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {games.map((game) => (
            <Link key={game.slug} href={`/games/${game.slug}`}>
              <Card className="game-card h-full cursor-pointer group">
                <CardHeader className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-xl overflow-hidden relative">
                    <img src={game.hero || '/placeholder-hero.jpg'} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    {game.status === 'coming-soon' && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">🚀 Prossimamente</span>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4"><div className="text-white font-bold text-lg">{game.title}</div></div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <h2 className="font-bold text-xl mb-3 text-gray-800 group-hover:text-orange-600 transition-colors">{game.title}</h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">{(game as unknown as { description_it?: string }).description_it || game.description || 'Descrizione non disponibile'}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {game.tags?.map((tag) => (
                      <span key={tag} className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">{tag}</span>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm font-semibold text-gray-700 bg-yellow-100 px-3 py-1 rounded-full">Incluso nell&apos;abbonamento</div>
                    <div className="text-sm text-gray-500">{game.gameType || 'html5'}</div>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


