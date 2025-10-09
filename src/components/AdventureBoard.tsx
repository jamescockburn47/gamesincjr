import { adventures } from '@/data/adventures';

export default function AdventureBoard() {
  return (
    <section className="mt-14 rounded-[2.5rem] bg-white p-8 shadow-float">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl font-semibold text-ink">Adventure Board</h2>
          <p className="font-body text-sm text-ink/70">Live quests updated in real time.</p>
        </div>
        <button
          type="button"
          className="rounded-2xl bg-mango px-5 py-2 font-body text-sm font-semibold text-white shadow-float transition hover:-translate-y-1"
        >
          View all adventures
        </button>
      </header>
      <div className="mt-6 space-y-4">
        {adventures.map((adventure) => (
          <div
            key={adventure.id}
            className="rounded-[2rem] border border-ink/10 bg-cream px-5 py-4 transition hover:-translate-y-1 hover:shadow-float"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 font-body text-xs font-semibold text-lagoon">
                    {adventure.status}
                  </span>
                  <p className="font-heading text-lg font-semibold text-ink">{adventure.title}</p>
                </div>
                <p className="mt-2 max-w-2xl font-body text-sm text-ink/70">{adventure.description}</p>
              </div>
              <div className="w-full max-w-xs">
                <div className="flex items-center justify-between font-body text-xs text-ink/60">
                  <span>Progress</span>
                  <span>{Math.round(adventure.progress * 100)}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lagoon via-mango to-sun"
                    style={{ width: `${Math.round(adventure.progress * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
