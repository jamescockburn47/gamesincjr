export const metadata = {
  title: 'About • Games Inc Jr',
  description: 'Our story, subscriptions, categories, previews, and how to suggest games.'
};

export default function AboutPage() {
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-16">
        <h1 className="pixel-text text-5xl text-gray-100 mb-8">About Games inc. Jr</h1>
        <p className="modern-text text-gray-200 text-lg mb-10 max-w-3xl">
          Games inc. Jr is a playful game studio run by a talented 7-year-old who builds games using AI tools.
          We release new games regularly, and any game you purchase will receive <span className="font-semibold text-yellow-300">free new levels</span> over time.
        </p>

        {/* Suggest a Game - Callout */}
        <section className="bg-white/10 rounded-2xl border border-white/20 p-6 mb-8">
          <h2 className="heading-text text-2xl text-gray-100 mb-3">Suggest a Game</h2>
          <p className="modern-text text-gray-200 mb-4">
            Got an idea? <a className="underline text-yellow-300" href="mailto:hello@gamesincjr.com">Contact us</a> with your dream game and we will try to build it. If we ship it, we&apos;ll add it to your subscription <span className="font-semibold text-gray-100">for free</span>.
          </p>
        </section>

        {/* Subscriptions */}
        <section className="bg-white/10 rounded-2xl border border-white/20 p-6 mb-8">
          <h2 className="heading-text text-2xl text-gray-100 mb-3">Subscriptions</h2>
          <p className="modern-text text-gray-200 mb-4">Try level 1 of each game for free, then subscribe to unlock the remaining levels. Simple, affordable tiers:</p>
          <ul className="modern-text text-gray-200 grid sm:grid-cols-3 gap-4">
            <li className="bg-white/10 rounded-xl p-4"><strong className="text-yellow-300">Starter</strong> — £1/year • Access 1 game</li>
            <li className="bg-white/10 rounded-xl p-4"><strong className="text-yellow-300">Explorer</strong> — £2/year • Access 3 games</li>
            <li className="bg-white/10 rounded-xl p-4"><strong className="text-yellow-300">Champion</strong> — £3/year • Access 10 games</li>
          </ul>
          <p className="modern-text text-gray-200 mt-4">Own a game? You&apos;ll get <strong className="text-gray-100">free level updates</strong> forever.</p>
        </section>

        {/* Categories */}
        <section className="bg-white/10 rounded-2xl border border-white/20 p-6 mb-8">
          <h2 className="heading-text text-2xl text-gray-100 mb-3">Categories</h2>
          <div className="grid md:grid-cols-4 gap-4 text-gray-200 modern-text">
            <div className="bg-white/5 rounded-xl p-4">🎮 Retro Classics (simple, fun remixes)</div>
            <div className="bg-white/5 rounded-xl p-4">📚 Educational (math, words, logic)</div>
            <div className="bg-white/5 rounded-xl p-4">🧱 Building & Creativity (sandboxes)</div>
            <div className="bg-white/5 rounded-xl p-4">🤖 AI-Integrated (smart NPCs, gen levels)</div>
          </div>
        </section>

        {/* How Previews Work */}
        <section className="bg-white/10 rounded-2xl border border-white/20 p-6 mb-6">
          <h2 className="heading-text text-2xl text-gray-100 mb-3">How Previews Work</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-200 modern-text">
            <li>Click or tap the game area to focus controls. On mobile, use the on-screen buttons.</li>
            <li>You can play level 1 for a limited time to try the mechanics.</li>
            <li>Subscribe to unlock all levels for the games in your tier.</li>
          </ol>
        </section>

        {/* Footnote */}
        <p className="modern-text text-gray-400 text-xs max-w-3xl">
          Note: We welcome ideas and suggestions from our community. If your suggestion inspires a game we develop,
          all intellectual property (IP) in the resulting game will be owned by Games inc. Jr.
        </p>
      </div>
    </main>
  );
}


