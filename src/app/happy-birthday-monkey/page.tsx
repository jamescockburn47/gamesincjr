import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";

export const metadata = {
  title: "Happy Birthday Monkey • Games Inc Jr",
  description: "A special custom game for Monkey's birthday celebration!",
};

export default function HappyBirthdayMonkeyPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-16">
        <PageHeader
          align="center"
          eyebrow="Special Game"
          title="Happy Birthday Monkey!"
          description="A custom game created especially for Monkey's birthday celebration. Play and have fun!"
        />

        <section className="mx-auto w-full max-w-3xl rounded-3xl bg-white/80 p-8 shadow-xl ring-1 ring-slate-100">
          <div className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Game Area</h2>
            <p className="text-base leading-7 text-slate-600">
              Game elements will be added here soon!
            </p>
          </div>

          {/* Game scaffold placeholder */}
          <div className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50">
            <div className="aspect-video flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-6xl">🎮</div>
                <p className="text-lg font-semibold text-slate-700">Game Coming Soon</p>
                <p className="text-sm text-slate-500">Game elements will be implemented here</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

