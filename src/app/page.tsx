import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="mb-20">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-10 text-center text-gray-800">
            <div className="pixel-bounce mb-4">
              <div className="text-6xl">🎮</div>
            </div>
            <h1 className="pixel-text text-5xl text-gray-900 mb-4">GAMES inc. Jr</h1>
            <p className="modern-text text-lg mb-6">
              Welcome to the ultimate gaming playground! 🚀 Experience amazing HTML5 games,
              from retro arcade classics to cutting-edge AI adventures.
              <span className="font-semibold"> No downloads, just pure fun!</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/games" className="gaming-btn gaming-glow text-lg px-8 py-4">🎯 Browse All Games</Link>
              <Link href="/games/space-runner" className="clean-btn text-lg px-8 py-4">🚀 Try Space Runner</Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="game-card p-8 text-center">
            <div className="text-5xl mb-6 pixel-bounce">⚡</div>
            <h3 className="heading-text text-2xl text-gray-800 mb-4">Instant Play</h3>
            <p className="modern-text text-gray-600">
              No downloads, no installations. Just click and play amazing games directly in your browser. 
              <span className="text-orange-500 font-semibold"> Ready in seconds!</span>
            </p>
          </div>
          <div className="game-card p-8 text-center">
            <div className="text-5xl mb-6 pixel-bounce">🤖</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">AI-Powered</h3>
            <p className="text-gray-600 leading-relaxed">
              Experience the future of gaming with AI-generated content and intelligent gameplay. 
              <span className="text-cyan-500 font-semibold"> Every play is unique!</span>
            </p>
          </div>
          <div className="game-card p-8 text-center">
            <div className="text-5xl mb-6 pixel-bounce">🎨</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Beautiful Design</h3>
            <p className="text-gray-600 leading-relaxed">
              Stunning visuals and smooth animations. Games that look as good as they play. 
              <span className="text-yellow-500 font-semibold"> Eye candy included!</span>
            </p>
          </div>
        </div>

        {/* Featured Game */}
        <div className="text-center">
          <h2 className="pixel-text text-4xl font-bold text-yellow-400 mb-12 tracking-wider">
            FEATURED GAME
          </h2>
          <div className="game-card p-10 max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <div className="flex items-center mb-6">
                  <div className="text-4xl mr-4">🚀</div>
                  <h3 className="text-3xl font-bold text-gray-800">Space Runner</h3>
                </div>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  Dash between asteroids in this procedurally generated arcade adventure! 
                  Features AI-generated levels that adapt to your skill level. 
                  <span className="text-orange-500 font-semibold">Can you survive the cosmic chaos?</span>
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-full text-sm font-bold">Arcade</span>
                  <span className="bg-gradient-to-r from-green-500 to-emerald-400 text-white px-4 py-2 rounded-full text-sm font-bold">Runner</span>
                  <span className="bg-gradient-to-r from-purple-500 to-pink-400 text-white px-4 py-2 rounded-full text-sm font-bold">8+</span>
                  <span className="bg-gradient-to-r from-orange-500 to-red-400 text-white px-4 py-2 rounded-full text-sm font-bold">AI-Generated</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/games/space-runner" 
                    className="gaming-btn gaming-glow text-lg px-8 py-4"
                  >
                    🎮 Play Now - £2.99
                  </Link>
                  <Link 
                    href="/games/space-runner" 
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    📖 Learn More
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl h-80 flex items-center justify-center border-4 border-orange-200 shadow-2xl">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🌌</div>
                    <div className="text-cyan-300 font-bold text-lg">Space Runner</div>
                    <div className="text-gray-400 text-sm">Game Preview</div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full gaming-glow"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-orange-400 rounded-full gaming-glow"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Suggest a Game Callout (About has full details) */}
        <div className="mt-20 mb-12">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-10">
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="text-5xl text-center md:text-left">💡</div>
              <div className="md:col-span-2">
                <h3 className="heading-text text-2xl text-gray-900 mb-2">Suggest a Game</h3>
                <p className="modern-text text-gray-700">Have an idea? <a className="underline" href="mailto:hello@gamesincjr.com">Contact us</a> and we&apos;ll try to build it. If we ship it, it&apos;s added to your subscription for free.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing removed from homepage (see About) */}

        {/* Call to Action */}
        <div className="text-center">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-10 shadow-xl">
            <h2 className="pixel-text text-3xl text-gray-900 mb-4">Ready to Play?</h2>
            <p className="modern-text text-gray-700 text-lg mb-6">Join our community of young gamers and developers! 🎉</p>
            <Link href="/games" className="gaming-btn gaming-glow text-xl px-12 py-5">🎯 Start Gaming Now!</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
