import { notFound } from 'next/navigation';
import { getGameBySlug } from '@/lib/games';
import GamePlayer from '@/components/GamePlayer';

interface Params { params: { slug: string } }

export default function GiocoIt({ params }: Params) {
  const game = getGameBySlug(params.slug);
  if (!game) notFound();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{game.title}</h1>
        <p className="text-lg text-gray-600">{game.description || 'Nessuna descrizione disponibile'}</p>
      </div>
      <div className="mb-12" data-demo-section>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-4 mb-4">
          <p>Modalità anteprima: gioca il livello 1. Per sbloccare tutti i livelli, scegli un abbonamento nella pagina Informazioni.</p>
        </div>
        <GamePlayer game={game} />
      </div>
    </div>
  );
}


