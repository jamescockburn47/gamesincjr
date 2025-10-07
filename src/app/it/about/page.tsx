import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";

const tiers = [
  { name: "Starter", price: "£1 / anno", access: "Accesso completo a 1 gioco" },
  { name: "Explorer", price: "£2 / anno", access: "Sblocca 3 giochi completi" },
  { name: "Champion", price: "£3 / anno", access: "Accedi a 10 giochi completi" },
];

const categories = [
  "Classici retrò rivisitati",
  "Missioni educative (matematica, parole, logica)",
  "Sandbox creativi",
  "Esperimenti con AI attiva",
];

const safetyPoints = [
  "Nessun download: tutto gira nel browser.",
  "Le anteprime si aprono in un iframe con permessi ridotti.",
  "Abilitiamo intestazioni di sicurezza come Referrer-Policy e Permissions-Policy.",
  "Mantieni il browser aggiornato per la protezione migliore.",
];

export const metadata = {
  title: "Informazioni • Games Inc Jr",
  description: "La nostra storia, gli abbonamenti, le categorie e come suggerire giochi.",
};

export default function AboutItPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-16">
        <PageHeader
          align="left"
          eyebrow="Dentro lo studio"
          title="Cos’è Games inc. Jr"
          description="Games inc. Jr è uno studio giocoso guidato da una bambina determinata e supportato da educatori. Prototipiamo con strumenti AI per pubblicare velocemente e ogni gioco riceve aggiornamenti gratuiti."
        />

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
            <h2 className="text-2xl font-semibold text-slate-900">Suggerisci un gioco</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Hai un&apos;idea? <a className="font-semibold text-sky-600 underline" href="mailto:hello@gamesincjr.com">Scrivici</a> e proveremo a realizzarla. Se la pubblichiamo verrà aggiunta al tuo abbonamento <strong>senza costi</strong>.
            </p>
            <p className="mt-3 text-sm text-slate-500">Ci piace costruire con la community.</p>
          </div>
          <div className="rounded-3xl bg-sky-50/70 p-8 shadow-lg ring-1 ring-sky-100">
            <h3 className="text-lg font-semibold text-slate-900">Punti rapidi</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>✓ Rilasciamo giochi nuovi regolarmente, senza costi extra per chi è già abbonato.</li>
              <li>✓ Il primo livello è sempre gratuito per provare prima di decidere.</li>
              <li>✓ I genitori vedono progressi, preferiti e tempo di gioco.</li>
            </ul>
          </div>
        </section>

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-2xl font-semibold text-slate-900">Abbonamenti semplici</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Prova il primo livello di ogni gioco gratis. Quando vuoi continuare scegli il livello che si adatta alla tua famiglia.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {tiers.map((tier) => (
              <div key={tier.name} className="rounded-2xl bg-slate-50/60 p-5 text-center shadow-inner ring-1 ring-slate-100">
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">{tier.name}</p>
                <p className="mt-3 text-xl font-bold text-slate-900">{tier.price}</p>
                <p className="mt-2 text-sm text-slate-600">{tier.access}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 text-sm leading-6 text-slate-600">
            <p>
              <strong>Premium AI</strong> è un livello aggiuntivo facoltativo per coprire i costi delle funzionalità AI sempre attive.
            </p>
            <p>Gli abbonamenti non si rinnovano automaticamente: ti avvisiamo prima della scadenza.</p>
            <p>Se acquisti un gioco, riceverai comunque i nuovi livelli senza pagare altro.</p>
          </div>
        </section>

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-2xl font-semibold text-slate-900">Cosa ci piace creare</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <div key={category} className="rounded-2xl bg-slate-50/70 p-5 text-sm font-medium text-slate-700 ring-1 ring-slate-100">
                {category}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-2xl font-semibold text-slate-900">Come funzionano le anteprime</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-base leading-7 text-slate-600">
            <li>Clicca sul gioco per attivare i controlli. Su mobile usiamo pulsanti a schermo.</li>
            <li>Puoi giocare il primo livello per capire ritmo e meccaniche.</li>
            <li>Accedi e scegli un livello di abbonamento per sbloccare tutto.</li>
          </ol>
        </section>

        <section className="rounded-3xl bg-slate-900 p-8 text-slate-100 shadow-2xl ring-1 ring-slate-900/50">
          <h2 className="text-2xl font-semibold text-white">Sicurezza</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
            {safetyPoints.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-0.5 text-lg text-amber-300">★</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs leading-6 text-slate-500">
          Le idee della community sono benvenute. Se una proposta ispira un nuovo gioco, la proprietà intellettuale rimane di Games inc. Jr.
        </p>
      </div>
    </PageShell>
  );
}
