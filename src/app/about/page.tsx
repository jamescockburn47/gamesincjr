export const metadata = {
  title: 'About • Games Inc Jr',
  description: 'Our story, subscriptions, categories, previews, and how to suggest games.'
};

export default function AboutPage() {
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="pixel-text text-5xl text-gray-900 mb-4">About Games inc. Jr</h1>
          <p className="modern-text text-gray-700 text-lg">
            Games inc. Jr is a playful game studio run by a talented 7-year-old who builds games using AI tools.
            We release new games regularly, and any game you purchase will receive <span className="font-semibold">free new levels</span> over time.
          </p>
        </div>

        {/* Suggest a Game - Callout */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow">
          <h2 className="heading-text text-2xl text-gray-900 mb-3">Suggest a Game</h2>
          <p className="modern-text text-gray-700 mb-2">
            Got an idea? <a className="underline" href="mailto:hello@gamesincjr.com">Contact us</a> with your dream game and we will try to build it. If we ship it, we&apos;ll add it to your subscription <span className="font-semibold">for free</span>.
          </p>
          <p className="modern-text text-gray-600 text-sm">We love building with the community.</p>
        </section>

        {/* Subscriptions */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow">
          <h2 className="heading-text text-2xl text-gray-900 mb-3">Subscriptions</h2>
          <p className="modern-text text-gray-700 mb-4">Try level 1 of each game for free, then subscribe to unlock the remaining levels. Simple, affordable tiers:</p>
          <ul className="modern-text text-gray-800 grid sm:grid-cols-3 gap-4">
            <li className="bg-gray-50 rounded-xl p-4 border border-gray-200"><strong>Starter</strong> — £1/year • Access 1 game</li>
            <li className="bg-gray-50 rounded-xl p-4 border border-gray-200"><strong>Explorer</strong> — £2/year • Access 3 games</li>
            <li className="bg-gray-50 rounded-xl p-4 border border-gray-200"><strong>Champion</strong> — £3/year • Access 10 games</li>
          </ul>
          <div className="modern-text text-gray-700 mt-4">
            <p className="mb-1"><strong>Premium AI Tier</strong> — For games with live AI features (e.g., smart NPCs or generative levels), a small recurring add‑on may apply to cover API costs.</p>
            <p>We&apos;ll always keep prices as low as possible.</p>
          </div>
          <p className="modern-text text-gray-700 mt-4">Own a game? You&apos;ll get <strong>free level updates</strong> forever.</p>
        </section>

        {/* Categories */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow">
          <h2 className="heading-text text-2xl text-gray-900 mb-3">Categories</h2>
          <div className="grid md:grid-cols-4 gap-4 modern-text">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">🎮 Retro Classics (simple, fun remixes)</div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">📚 Educational (math, words, logic)</div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">🧱 Building & Creativity (sandboxes)</div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">🤖 AI-Integrated (smart NPCs, gen levels)</div>
          </div>
        </section>

        {/* How Previews Work */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow">
          <h2 className="heading-text text-2xl text-gray-900 mb-3">How Previews Work</h2>
          <ol className="list-decimal pl-5 space-y-2 modern-text text-gray-700">
            <li>Click or tap the game area to focus controls. On mobile, use the on-screen buttons.</li>
            <li>You can play level 1 for a limited time to try the mechanics.</li>
            <li>Subscribe to unlock all levels for the games in your tier.</li>
          </ol>
        </section>

        {/* Security & Safety */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow">
          <h2 className="heading-text text-2xl text-gray-900 mb-3">Security & Safety</h2>
          <ul className="list-disc pl-5 modern-text text-gray-700 space-y-2">
            <li>No downloads — everything runs in your web browser.</li>
            <li>Games load in a browser sandbox (iframe) with restricted permissions.</li>
            <li>We set security headers (e.g., Referrer-Policy, X-Frame-Options, Permissions-Policy) to reduce risk.</li>
            <li>We never ask you to install executables to play a game.</li>
          </ul>
          <p className="modern-text text-gray-500 text-sm mt-3">While browser sandboxing greatly reduces malware risk, no system is 100% immune. Always keep your browser up to date.</p>
        </section>

        {/* Footnote */}
        <p className="modern-text text-gray-500 text-xs max-w-3xl">
          Note: We welcome ideas and suggestions from our community. If your suggestion inspires a game we develop,
          all intellectual property (IP) in the resulting game will be owned by Games inc. Jr.
        </p>
      </div>
    </main>
  );
}


