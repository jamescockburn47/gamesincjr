export const metadata = { title: 'Informazioni • Games Inc Jr' };

export default function AboutIt() {
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="pixel-text text-5xl text-gray-900 mb-4">Chi siamo</h1>
          <p className="modern-text text-gray-700 text-lg">
            Games inc. Jr è uno studio di gioco gestito da un talentuoso bambino di 7 anni che crea
            giochi con strumenti di intelligenza artificiale. Aggiungiamo nuovi giochi regolarmente e,
            se acquisti un gioco, riceverai <strong>nuovi livelli gratuiti</strong> nel tempo.
          </p>
        </div>

        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow">
          <h2 className="heading-text text-2xl text-gray-900 mb-3">Suggerisci un gioco</h2>
          <p className="modern-text text-gray-700">Hai un&apos;idea? Scrivici a <a className="underline" href="mailto:hello@gamesincjr.com">hello@gamesincjr.com</a>. Se la realizziamo, sarà aggiunta al tuo abbonamento senza costi aggiuntivi.</p>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow">
          <h2 className="heading-text text-2xl text-gray-900 mb-3">Abbonamenti</h2>
          <ul className="modern-text text-gray-800 grid sm:grid-cols-3 gap-4">
            <li className="bg-gray-50 rounded-xl p-4 border">Starter — £1/anno • 1 gioco</li>
            <li className="bg-gray-50 rounded-xl p-4 border">Explorer — £2/anno • 3 giochi</li>
            <li className="bg-gray-50 rounded-xl p-4 border">Champion — £3/anno • 10 giochi</li>
          </ul>
          <p className="modern-text text-gray-700 mt-4"><strong>Livello AI Premium</strong> — per funzionalità AI in tempo reale potrebbe essere applicato un piccolo costo ricorrente per coprire le API.</p>
          <p className="modern-text text-gray-600 mt-2 text-sm">Gli abbonamenti non si rinnovano automaticamente: ti chiederemo a fine anno se vuoi rinnovare.</p>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow">
          <h2 className="heading-text text-2xl text-gray-900 mb-3">Sicurezza</h2>
          <ul className="list-disc pl-5 modern-text text-gray-700 space-y-2">
            <li>Nessun download — tutto nel browser.</li>
            <li>Giochi in iframe sandbox con permessi limitati.</li>
            <li>Header di sicurezza attivi.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}


