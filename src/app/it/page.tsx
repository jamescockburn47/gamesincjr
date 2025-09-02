import Link from 'next/link';

export default function HomeIt() {
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-20">
        <div className="mb-20">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-10 text-center text-gray-800">
            <div className="pixel-bounce mb-4"><div className="text-6xl">🎮</div></div>
            <h1 className="pixel-text text-5xl text-gray-900 mb-2">GAMES inc. Jr</h1>
            <div className="modern-text text-gray-600 mb-4">per bambini, da bambini. l&apos;immaginazione è l&apos;unico limite</div>
            <p className="modern-text text-lg mb-6">
              Benvenuto nel parco giochi definitivo! 🚀 Prova fantastici giochi HTML5,
              dai classici retrò alle avventure potenziate dall&apos;AI.
              <span className="font-semibold"> Nessun download: solo divertimento!</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/games" className="gaming-btn gaming-glow text-lg px-8 py-4">🎯 Sfoglia i Giochi</Link>
              <Link href="/games/space-runner" className="clean-btn text-lg px-8 py-4">🚀 Prova Space Runner</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


