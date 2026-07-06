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
          title="Make Your Own Game — With AI"
          description="This is where you actually practise AI-coding: describe your idea, build a draft, play it, and tell the AI what to change. Real games take a few tries — that's the whole point."
        />

        <section className="mx-auto w-full max-w-3xl rounded-3xl bg-white/80 p-8 shadow-xl ring-1 ring-slate-100">
          <div className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">How It Works</h2>
            <ol className="space-y-3 text-base leading-7 text-slate-600">
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">1</span>
                <span><strong>Describe your idea</strong> - Your title, what happens, and the one extra thing you can do</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">2</span>
                <span><strong>Build your first draft</strong> - The AI builds exactly what you described in under a minute</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">3</span>
                <span><strong>Play it, then change it</strong> - Say what&apos;s wrong or what you&apos;d like different, and get an updated draft</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">4</span>
                <span><strong>Submit when you&apos;re happy</strong> - Our team reviews it, then it goes live with your name on it</span>
              </li>
            </ol>
          </div>

          <div className="mb-6 rounded-2xl bg-sky-50/70 p-6 ring-1 ring-sky-100">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky-700">Kid-Friendly & Safe</h3>
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              <li>✓ Every draft and every change is checked before it&apos;s built</li>
              <li>✓ Games are reviewed by a real person before going live</li>
              <li>✓ Games are built using our tested template for safety</li>
              <li>✓ A daily limit keeps things fair and fast for everyone</li>
            </ul>
          </div>

          <MakeYourGameForm />
        </section>

        <section className="rounded-3xl bg-white/80 p-8 text-center shadow-xl ring-1 ring-slate-100">
          <h2 className="text-2xl font-semibold text-slate-900">What Happens Next?</h2>
          <div className="mt-6 grid gap-6 text-left sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50/60 p-5 ring-1 ring-slate-100">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-2xl">🔨</div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Build & Iterate (minutes)</h3>
              <p className="text-sm text-slate-600">You play every draft yourself before deciding it&apos;s ready</p>
            </div>
            <div className="rounded-2xl bg-slate-50/60 p-5 ring-1 ring-slate-100">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl">👀</div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Review (1-2 days)</h3>
              <p className="text-sm text-slate-600">Our team checks the game to make sure it&apos;s fun and safe</p>
            </div>
            <div className="rounded-2xl bg-slate-50/60 p-5 ring-1 ring-slate-100">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">🎮</div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Play!</h3>
              <p className="text-sm text-slate-600">Once approved, we&apos;ll email you a link to play and share your game</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            We&apos;ll email you at every step of the process.
          </p>
        </section>

        <section className="rounded-3xl bg-gradient-to-br from-sky-50 to-purple-50 p-8 shadow-xl ring-1 ring-sky-100">
          <h2 className="text-2xl font-semibold text-slate-900">Tips for Great Games</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-700">
              <strong className="text-sky-700">🎯 Be specific about your second verb</strong>
              <p className="mt-1 text-slate-600">&quot;Dash through walls for 1 second&quot; beats &quot;do something cool&quot;</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-700">
              <strong className="text-sky-700">📝 Describe changes precisely</strong>
              <p className="mt-1 text-slate-600">&quot;The boss dies too fast&quot; is more useful than &quot;make it better&quot;</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-700">
              <strong className="text-sky-700">🔁 Don&apos;t stop at draft one</strong>
              <p className="mt-1 text-slate-600">Every real game gets played and changed a few times before it&apos;s good</p>
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
