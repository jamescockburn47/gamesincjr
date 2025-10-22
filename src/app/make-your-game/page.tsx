import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import MakeYourGameForm from "@/components/MakeYourGameForm";

export const metadata = {
  title: "Make Your Game • Games Inc Jr",
  description: "Design and build your own game in minutes with AI. Choose your style, difficulty, and gameplay - we'll generate a playable game for you!",
};

export default function MakeYourGamePage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-16">
        <PageHeader
          align="center"
          eyebrow="Game Creator Studio"
          title="Make Your Own Game!"
          description="Tell us what kind of game you want to create, and our AI will build it for you. Choose everything from the art style to the difficulty. Your game will be ready to play in just a few minutes!"
        />

        <section className="mx-auto w-full max-w-3xl rounded-3xl bg-white/80 p-8 shadow-xl ring-1 ring-slate-100">
          <div className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">How It Works</h2>
            <ol className="space-y-3 text-base leading-7 text-slate-600">
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">1</span>
                <span><strong>Tell us about yourself</strong> - Your name and email so we can send you the game</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">2</span>
                <span><strong>Design your game</strong> - Choose the type, style, colors, and difficulty</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">3</span>
                <span><strong>Pick what to collect and avoid</strong> - Select collectibles, hazards, and features</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">4</span>
                <span><strong>We build it for you</strong> - Our AI creates a custom game in 3-5 minutes</span>
              </li>
            </ol>
          </div>

          <div className="mb-6 rounded-2xl bg-sky-50/70 p-6 ring-1 ring-sky-100">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky-700">Kid-Friendly & Safe</h3>
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              <li>✓ All games are reviewed before going live</li>
              <li>✓ Content moderation ensures age-appropriate gameplay</li>
              <li>✓ Limited to 3 games per day to keep quality high</li>
              <li>✓ Games are built using our tested template for safety</li>
            </ul>
          </div>

          <MakeYourGameForm />
        </section>

        <section className="rounded-3xl bg-white/80 p-8 text-center shadow-xl ring-1 ring-slate-100">
          <h2 className="text-2xl font-semibold text-slate-900">What Happens Next?</h2>
          <div className="mt-6 grid gap-6 text-left sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50/60 p-5 ring-1 ring-slate-100">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-2xl">🔨</div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Building (3-5 min)</h3>
              <p className="text-sm text-slate-600">Our AI generates your custom game code with all your chosen features</p>
            </div>
            <div className="rounded-2xl bg-slate-50/60 p-5 ring-1 ring-slate-100">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl">👀</div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Review (1-2 days)</h3>
              <p className="text-sm text-slate-600">Our team checks the game to make sure it's fun and safe</p>
            </div>
            <div className="rounded-2xl bg-slate-50/60 p-5 ring-1 ring-slate-100">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">🎮</div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Play!</h3>
              <p className="text-sm text-slate-600">Once approved, we'll email you a link to play and share your game</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Games typically go live within 2-3 days. We'll email you at every step of the process.
          </p>
        </section>

        <section className="rounded-3xl bg-gradient-to-br from-sky-50 to-purple-50 p-8 shadow-xl ring-1 ring-sky-100">
          <h2 className="text-2xl font-semibold text-slate-900">Tips for Great Games</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-700">
              <strong className="text-sky-700">✨ Be creative with your title!</strong>
              <p className="mt-1 text-slate-600">&quot;Space Pizza Rescue&quot; is more fun than &quot;Space Game&quot;</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-700">
              <strong className="text-sky-700">📝 Write a clear description</strong>
              <p className="mt-1 text-slate-600">Tell us what makes your game special and exciting</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-700">
              <strong className="text-sky-700">⚖️ Balance difficulty</strong>
              <p className="mt-1 text-slate-600">Start with medium difficulty - you can always request changes</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-700">
              <strong className="text-sky-700">🎨 Mix and match!</strong>
              <p className="mt-1 text-slate-600">Try unexpected combinations - pixel art + space + racing can be amazing!</p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
