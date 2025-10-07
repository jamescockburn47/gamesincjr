import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getGames, type Game } from "@/lib/games";

export const revalidate = 0;

function getItalianDescription(game: Game): string {
  return (game as Game & { description_it?: string }).description_it || game.description || "Descrizione non disponibile";
}

export default function GiochiPage() {
  const games = getGames();

  return (
    <PageShell>
      <div className="flex flex-col gap-16">
        <PageHeader
          eyebrow="Libreria"
          title="Tutti i nostri giochi nel browser"
          description="Scopri avventure colorate che partono direttamente dal browser. Ogni titolo offre il primo livello gratuito, così puoi scegliere il preferito prima di abbonarti."
          actions={
            <Link
              href="/it/about"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white/70 backdrop-blur")}
            >
              Scopri gli abbonamenti
            </Link>
          }
          align="left"
        />

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <Card key={game.slug} className="group overflow-hidden border-none bg-white/80 shadow-xl ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="relative h-48 overflow-hidden p-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 to-slate-900/60 opacity-0 transition group-hover:opacity-100" />
                <Image
                  src={game.hero || "/placeholder-hero.jpg"}
                  alt={game.title}
                  fill
                  sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                  priority={game.slug === "alien-unicorn-alliance"}
                />
                {game.status === "coming-soon" && (
                  <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Prossimamente
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-4 py-6">
                <h2 className="text-xl font-semibold text-slate-900">{game.title}</h2>
                <p className="text-sm leading-6 text-slate-600">{getItalianDescription(game)}</p>
                {game.tags && (
                  <div className="flex flex-wrap gap-2">
                    {game.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t border-slate-100/80 bg-slate-50/80 py-4">
                <span className="text-sm font-semibold text-slate-700">Incluso nell&apos;abbonamento</span>
                <Link
                  href={`/it/games/${game.slug}`}
                  className={cn(buttonVariants({ size: "sm" }), "bg-sky-500 text-white hover:bg-sky-500/90")}
                >
                  Dettagli
                </Link>
              </CardFooter>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl bg-white/80 p-8 text-center shadow-xl ring-1 ring-slate-100">
          <h2 className="text-2xl font-semibold text-slate-900">Vuoi proporre un nuovo gioco?</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Aggiungiamo novità ogni mese. Scrivici su <a className="font-semibold text-sky-600 underline" href="mailto:hello@gamesincjr.com">hello@gamesincjr.com</a> e costruiremo l&apos;idea insieme.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/it/community"
              className={cn(buttonVariants({ size: "lg" }), "bg-sky-500 text-white hover:bg-sky-500/90")}
            >
              Entra nella community
            </Link>
            <Link
              href="/it/tutorials"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white/70 backdrop-blur")}
            >
              Prenota un tutorial
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
