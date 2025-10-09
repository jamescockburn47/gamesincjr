const pillars = [
  {
    title: 'Kid-safe AI playmates',
    body: 'Each companion follows playful guardrails crafted with child psychologists and educators.',
    icon: '🛡️',
  },
  {
    title: 'Grown-up controls',
    body: 'Set screen limits, pause instantly, and review chats whenever you like.',
    icon: '🕒',
  },
  {
    title: 'Transparency & privacy',
    body: 'Minimal data, encrypted storage, and full deletion tools keep families in charge.',
    icon: '🔍',
  },
];

export default function SafetySection() {
  return (
    <section className="mt-16 rounded-[2.5rem] bg-white p-8 shadow-float">
      <header className="mb-8 text-center">
        <h2 className="font-heading text-3xl font-semibold text-ink">Safe and Fun for Everyone</h2>
        <p className="mt-3 font-body text-sm text-ink/70">
          Games Inc Jr balances kid-sized freedom with thoughtful safeguards parents trust.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="rounded-[2rem] bg-cream p-6 shadow-inner transition hover:-translate-y-1">
            <span className="text-3xl">{pillar.icon}</span>
            <h3 className="mt-4 font-heading text-xl font-semibold text-ink">{pillar.title}</h3>
            <p className="mt-3 font-body text-sm text-ink/70">{pillar.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
