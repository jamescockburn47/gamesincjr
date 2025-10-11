import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getGames } from "@/lib/games";

export const revalidate = 0;

export default function GamesPage() {
  const games = getGames();

  return (
    <PageShell>
      <div className="flex flex-col gap-16">
        <PageHeader
          eyebrow="Play library"
          title="All of our browser-friendly games"
          description="Jump into colourful adventures that run right in your browser. Every title includes a free level one preview so you can find new favourites before subscribing."
          actions={
            <Link
              href="/about"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white/70 backdrop-blur")}
            >
              Learn about subscriptions
            </Link>
          }
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
                    Coming soon
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-4 py-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{game.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {game.description || "No description available"}
                  </p>
                </div>
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
                <span className="text-sm font-semibold text-slate-700">Included with membership</span>
                <Link
                  href={`/games/${game.slug}`}
                  className={cn(buttonVariants({ size: "sm" }), "bg-sky-500 text-white hover:bg-sky-500/90")}
                >
                  View details
                </Link>
              </CardFooter>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl bg-white/80 p-8 text-center shadow-xl ring-1 ring-slate-100">
          <h2 className="text-2xl font-semibold text-slate-900">Want to request a game?</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            We add new adventures every month. Send ideas to <a className="font-semibold text-sky-600 underline" href="mailto:hello@gamesincjr.com">hello@gamesincjr.com</a> and we&apos;ll explore them together.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/community"
              className={cn(buttonVariants({ size: "lg" }), "bg-sky-500 text-white hover:bg-sky-500/90")}
            >
              Join the community chat
            </Link>
            <Link
              href="/tutorials"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white/70 backdrop-blur")}
            >
              Book a coding tutorial
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
