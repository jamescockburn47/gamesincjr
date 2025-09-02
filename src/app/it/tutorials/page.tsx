export const metadata = { title: 'Tutorial • Games Inc Jr' };

export default function TutorialsIt() {
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow">
          <h1 className="pixel-text text-4xl text-gray-900 mb-4">Tutorial di Coding</h1>
          <p className="modern-text text-gray-700 mb-6">
            Offriamo sessioni remote di 30 minuti a <strong>£25 per studente</strong> per mostrare ai
            bambini (7+) come iniziare con il coding basato su prompt e l&apos;AI.
          </p>
          <h2 className="heading-text text-2xl text-gray-900 mb-2">Perché adesso?</h2>
          <p className="modern-text text-gray-700 mb-6">
            L&apos;industria è cambiata con l&apos;AI. Il “vibe coding” — descrivere chiaramente cosa si vuole e
            iterare velocemente — è usato sia dalle big tech che dagli sviluppatori indipendenti. Non
            serve esperienza: visione chiara, comunicazione, attenzione ai dettagli e curiosità bastano.
          </p>
          <h2 className="heading-text text-2xl text-gray-900 mb-2">Cosa vedremo</h2>
          <ul className="modern-text text-gray-700 list-disc pl-5 mb-6">
            <li>Basi del prompting e sicurezza</li>
            <li>Creare un mini-gioco browser con AI</li>
            <li>Iterare su grafica, controlli e difficoltà</li>
            <li>Pubblicare un&apos;anteprima giocabile</li>
          </ul>
          <h2 className="heading-text text-2xl text-gray-900 mb-2">Prenota</h2>
          <p className="modern-text text-gray-700">Scrivi a <a href="mailto:hello@gamesincjr.com" className="underline">hello@gamesincjr.com</a>. Consenso dei genitori richiesto per i minori.</p>
        </div>
      </div>
    </main>
  );
}


