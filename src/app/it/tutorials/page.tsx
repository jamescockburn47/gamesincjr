import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";

export const metadata = { title: "Tutorial • Games Inc Jr" };

export default function TutorialsItPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <PageHeader
          align="left"
          eyebrow="Sessioni da 30 minuti"
          title="Tutorial di coding per piccoli curiosi"
          description="Offriamo sessioni remote mirate (£25 a studente) per mostrare a chi ha 7+ anni come trasformare un’idea in un prototipo con workflow assistiti dall’AI."
        />

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">Perché adesso?</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Il settore sta cambiando rapidamente grazie all’AI. Il “vibe coding” — descrivere ciò che vuoi in modo chiaro e iterare velocemente — è ormai normale. Non serve esperienza: basta una visione, comunicazione chiara e voglia di sperimentare.
          </p>
        </section>

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">Cosa impariamo</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-base leading-7 text-slate-600">
            <li>Basi del prompting e pratiche di sicurezza.</li>
            <li>Creare un mini gioco browser con l’aiuto dell’AI.</li>
            <li>Iterare su grafica, controlli e difficoltà.</li>
            <li>Pubblicare un’anteprima giocabile da condividere.</li>
          </ul>
        </section>

        <section className="rounded-3xl bg-sky-50/70 p-8 shadow-lg ring-1 ring-sky-100">
          <h2 className="text-xl font-semibold text-slate-900">Prenota una sessione</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Scrivi a <a className="font-semibold text-sky-600 underline" href="mailto:hello@gamesincjr.com">hello@gamesincjr.com</a> con gli orari preferiti. Per i minori serve il consenso dei genitori.
          </p>
          <p className="mt-3 text-sm text-slate-500">Le sessioni individuali o per piccoli gruppi (fino a 3) hanno lo stesso prezzo.</p>
        </section>
      </div>
    </PageShell>
  );
}
