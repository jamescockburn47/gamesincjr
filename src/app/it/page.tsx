import Link from "next/link";
import PageShell from "@/components/PageShell";

const features = [
  {
    icon: "⚡",
    title: "Gioco immediato",
    description: "Nessuna installazione. Clicchi e giochi direttamente nel browser.",
  },
  {
    icon: "🤖",
    title: "AI‑assistita",
    description: "Usiamo l’AI per prototipare e iterare le idee velocemente.",
  },
  {
    icon: "🎯",
    title: "Chiaro e giocabile",
    description: "Controlli semplici, grafica leggibile, sessioni brevi.",
  },
];

const highlightTags = ["Azione", "Volo", "Combo"];

export default function HomeIt() {
  return (
    <PageShell tone="vibrant" className="space-y-20">
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-10 text-center">
        <span className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 shadow-sm ring-1 ring-sky-100">
          Per bambini, da bambini
        </span>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Games inc. Jr
          </h1>
          <p className="mx-auto max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            L&apos;immaginazione è l&apos;unico limite. Gioca a titoli HTML5 nel browser: dalle idee retrò agli esperimenti assistiti dall&apos;AI.
            <span className="font-semibold text-slate-900"> Niente download.</span>
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/games"
            className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-500/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            🎯 Sfoglia i giochi
          </Link>
          <Link
            href="/games/alien-unicorn-alliance"
            className="inline-flex items-center justify-center rounded-xl bg-white/80 px-8 py-3 text-sm font-semibold text-slate-800 shadow-lg ring-1 ring-slate-200 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            🦄 Prova Alien Unicorn Alliance
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="flex h-full flex-col items-center gap-4 rounded-3xl bg-white/80 p-8 text-center shadow-lg ring-1 ring-slate-100"
          >
            <span className="text-4xl">{feature.icon}</span>
            <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
            <p className="text-sm leading-6 text-slate-600">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl rounded-3xl bg-white/80 p-10 shadow-xl ring-1 ring-slate-100">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-3 text-slate-800">
              <span className="text-3xl">🦄</span>
              <h2 className="text-3xl font-bold">Alien Unicorn Alliance</h2>
            </div>
            <p className="text-base leading-7 text-slate-600">
              Scivola tra praterie al neon, raccogli cristalli armonici e usa l&apos;impulso stellare per trasformare i droni in bonus scintillanti.
            </p>
            <div className="flex flex-wrap gap-2">
              {highlightTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/games/alien-unicorn-alliance"
                className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-500/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                🎮 Gioca ora
              </Link>
              <Link
                href="/games/alien-unicorn-alliance"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                📖 Dettagli
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-center text-sky-100 shadow-2xl">
            <div className="space-y-3">
              <div className="text-5xl">🌈</div>
              <p className="text-lg font-semibold text-white">Alien Unicorn Alliance</p>
              <p className="text-sm text-slate-200">Anteprima giocabile nel browser</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
        <div className="grid gap-6 sm:grid-cols-[auto,1fr] sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl">💡</div>
          <div className="space-y-3 text-left">
            <h2 className="text-2xl font-semibold text-slate-900">Suggerisci un gioco</h2>
            <p className="text-sm leading-6 text-slate-600">
              Hai un&apos;idea? <a className="font-semibold text-sky-600 underline" href="mailto:hello@gamesincjr.com">Scrivici</a> e, se la realizziamo, la aggiungeremo al tuo abbonamento senza costi extra.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl rounded-3xl bg-white/80 p-10 text-center shadow-xl ring-1 ring-slate-100">
        <h2 className="text-3xl font-bold text-slate-900">Pronto a giocare?</h2>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Unisciti alla community di giovani giocatori e creatori! Niente download: i giochi girano nel browser con permessi limitati.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/games"
            className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-500/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            🎯 Inizia ora
          </Link>
          <Link
            href="/community"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            💬 Community
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
