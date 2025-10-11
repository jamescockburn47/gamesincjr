import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";

const tiers = [
  { name: "Starter", price: "£1 / year", access: "Play 1 full game" },
  { name: "Explorer", price: "£2 / year", access: "Unlock 3 full games" },
  { name: "Champion", price: "£3 / year", access: "Enjoy 10 full games" },
];

const categories = [
  "Retro remixes for quick wins",
  "Educational quests (math, words, logic)",
  "Build & create sandboxes",
  "AI-assisted experiments",
];

const safetyPoints = [
  "No downloads – everything runs inside the browser sandbox.",
  "Playable previews load inside an iframe with restricted permissions.",
  "Security headers such as Referrer-Policy and Permissions-Policy are enabled by default.",
  "Keeping your browser up to date gives the best protection.",
];

export const metadata = {
  title: "About • Games Inc Jr",
  description: "Our story, subscriptions, categories, previews, and how to suggest games.",
};

export default function AboutPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-16">
        <PageHeader
          align="left"
          eyebrow="Inside the studio"
          title="Games Inc Jr in a nutshell"
          description="Games inc. Jr is a playful studio led by a very determined 7-year-old and guided by educators. We prototype with AI tools so ideas can ship quickly, and every released game keeps receiving free level updates."
        />

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
            <h2 className="text-2xl font-semibold text-slate-900">Suggest a game</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Got an idea? <a className="font-semibold text-sky-600 underline" href="mailto:hello@gamesincjr.com">Email us</a> with your dream game and we&apos;ll see if we can bring it to life. If we ship it, it&apos;s added to your subscription <strong>for free</strong>.
            </p>
            <p className="mt-3 text-sm text-slate-500">We love building with the community.</p>
          </div>
          <div className="rounded-3xl bg-sky-50/70 p-8 shadow-lg ring-1 ring-sky-100">
            <h3 className="text-lg font-semibold text-slate-900">Quick facts</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>✓ New games drop regularly with no extra charge for existing owners.</li>
              <li>✓ Level one is always free so families can test before subscribing.</li>
              <li>✓ Parent dashboards highlight play time, favourites and achievements.</li>
            </ul>
          </div>
        </section>

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-2xl font-semibold text-slate-900">Subscriptions that stay simple</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Try the first level of every game for free. When you&apos;re ready for more, choose a tier that fits how much you want to explore.
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
              <strong>Premium AI</strong> is an optional add-on tier. It keeps always-on AI features running smoothly by covering the API costs.
            </p>
            <p>Subscriptions do not auto-renew—we&apos;ll check in before the year ends.</p>
            <p>If you purchase a game outright you keep receiving new levels at no extra cost.</p>
          </div>
        </section>

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-2xl font-semibold text-slate-900">What we love to build</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <div key={category} className="rounded-2xl bg-slate-50/70 p-5 text-sm font-medium text-slate-700 ring-1 ring-slate-100">
                {category}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-2xl font-semibold text-slate-900">Previewing games</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-base leading-7 text-slate-600">
            <li>Click the game area to focus controls. On mobile, on-screen buttons help out.</li>
            <li>Level one is available to try so you can feel the mechanics and pacing.</li>
            <li>Sign in and upgrade your tier to unlock every level.</li>
          </ol>
        </section>

        <section className="rounded-3xl bg-slate-900 p-8 text-slate-100 shadow-2xl ring-1 ring-slate-900/50">
          <h2 className="text-2xl font-semibold text-white">Security &amp; safety</h2>
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
          We welcome ideas and suggestions from our community. If your suggestion inspires a game we develop, all intellectual property (IP) in the resulting game belongs to Games inc. Jr.
        </p>
      </div>
    </PageShell>
  );
}
