import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { getGames } from '@/lib/games';

export default function GamesPage() {
  const games = getGames();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Games</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game) => (
          <Link key={game.slug} href={`/games/${game.slug}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="p-0">
                <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                  <img
                    src={game.hero || '/placeholder-hero.jpg'}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <h2 className="font-semibold text-lg mb-2 line-clamp-1">
                  {game.title}
                </h2>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {game.description || 'No description available'}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {game.status === 'coming-soon' && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Coming Soon
                    </span>
                  )}
                  {game.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0">
                <div className="text-lg font-bold text-green-600">
                  {game.price ? `£${game.price}` : 'Free'}
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}