import Link from 'next/link';

export default function HomeIt() {
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-20">
        {/* Hero */}
        <div className="mb-20">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-10 text-center text-gray-800">
            <div className="pixel-bounce mb-4"><div className="text-6xl">🎮</div></div>
            <h1 className="pixel-text text-5xl text-gray-900 mb-2">GAMES inc. Jr</h1>
            <div className="modern-text text-gray-600 mb-4">per bambini, da bambini. l&apos;immaginazione è l&apos;unico limite</div>
            <p className="modern-text text-lg mb-6">
              Benvenuto. Gioca a titoli HTML5 nel browser — da idee retrò semplici a esperimenti assistiti dall&apos;AI.
              <span className="font-semibold"> Niente download.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/games" className="gaming-btn gaming-glow text-lg px-8 py-4">🎯 Sfoglia i giochi</Link>
              <Link href="/games/alien-unicorn-alliance" className="clean-btn text-lg px-8 py-4">🦄 Prova Alien Unicorn Alliance</Link>
            </div>
          </div>
        </div>

        {/* Caratteristiche */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="game-card p-8 text-center">
            <div className="text-5xl mb-6 pixel-bounce">⚡</div>
            <h3 className="heading-text text-2xl text-gray-800 mb-4">Gioco immediato</h3>
            <p className="modern-text text-gray-600">Nessuna installazione. Clicca e gioca direttamente nel browser.</p>
          </div>
          <div className="game-card p-8 text-center">
            <div className="text-5xl mb-6 pixel-bounce">🤖</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">AI‑assistita</h3>
            <p className="text-gray-600 leading-relaxed">Usiamo l&apos;AI per prototipare e iterare le idee più velocemente.</p>
          </div>
          <div className="game-card p-8 text-center">
            <div className="text-5xl mb-6 pixel-bounce">🎯</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Chiaro & giocabile</h3>
            <p className="text-gray-600 leading-relaxed">Controlli semplici, grafica leggibile, sessioni brevi.</p>
          </div>
        </div>

        {/* Gioco in evidenza */}
        <div className="text-center">
          <h2 className="pixel-text text-4xl font-bold text-yellow-400 mb-12 tracking-wider">GIOCO IN EVIDENZA</h2>
          <div className="game-card p-10 max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <div className="flex items-center mb-6"><div className="text-4xl mr-4">🦄</div><h3 className="text-3xl font-bold text-gray-800">Alien Unicorn Alliance</h3></div>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">Scivola tra le praterie al neon, raccogli cristalli armonici e usa l&apos;impulso stellare per trasformare i droni alieni in bonus scintillanti.</p>
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-full text-sm font-bold">Azione</span>
                  <span className="bg-gradient-to-r from-violet-500 to-purple-400 text-white px-4 py-2 rounded-full text-sm font-bold">Volo</span>
                  <span className="bg-gradient-to-r from-rose-500 to-pink-400 text-white px-4 py-2 rounded-full text-sm font-bold">Combo</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/games/alien-unicorn-alliance" className="gaming-btn gaming-glow text-lg px-8 py-4">🎮 Gioca ora</Link>
                  <Link href="/games/alien-unicorn-alliance" className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">📖 Dettagli</Link>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl h-80 flex items-center justify-center border-4 border-orange-200 shadow-2xl">
                  <div className="text-center"><div className="text-6xl mb-4">🌈</div><div className="text-cyan-300 font-bold text-lg">Alien Unicorn Alliance</div><div className="text-gray-400 text-sm">Anteprima</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suggerisci un gioco */}
        <div className="mt-20 mb-12">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-10">
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="text-5xl text-center md:text-left">💡</div>
              <div className="md:col-span-2">
                <h3 className="heading-text text-2xl text-gray-900 mb-2">Suggerisci un gioco</h3>
                <p className="modern-text text-gray-700">Hai un&apos;idea? <a className="underline" href="mailto:hello@gamesincjr.com">Contattaci</a>. Se lo realizziamo, sarà aggiunto al tuo abbonamento senza costi.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-10 shadow-xl">
            <h2 className="pixel-text text-3xl text-gray-900 mb-4">Pronto a giocare?</h2>
            <p className="modern-text text-gray-700 text-lg mb-2">Unisciti alla community di giovani giocatori e creatori! 🎉</p>
            <p className="modern-text text-gray-600 text-sm mb-6">Niente download — più sicuro. I giochi girano nel browser con permessi limitati.</p>
            <Link href="/games" className="gaming-btn gaming-glow text-xl px-12 py-5">🎯 Inizia ora</Link>
          </div>
        </div>
      </div>
    </main>
  );
}


