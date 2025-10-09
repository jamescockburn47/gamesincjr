const sections = [
  {
    title: 'How it works',
    copy: 'We blend handcrafted level design with language-first AI collaborators. Each story beat is playtested by kids, tuned by educators, and guarded by trust layers.',
  },
  {
    title: 'Our mission',
    copy: 'Games Inc Jr sparks curiosity, resilience, and giggles. We imagine playful futures where any child can co-create worlds safely with AI friends.',
  },
  {
    title: 'AI co-creators',
    copy: 'Characters like Luna the owl and Shadow the cat use curated prompts, narrative scaffolds, and moderation to stay on-tone while feeling alive and surprising.',
  },
  {
    title: 'Safety & privacy',
    copy: 'We log interactions securely, give parents full oversight, and keep personal data minimal. No ads, no dark patterns—just wholesome, transparent fun.',
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <header className="rounded-[2.5rem] bg-white p-8 shadow-float">
        <h1 className="font-heading text-4xl font-semibold text-ink">About Games Inc Jr</h1>
        <p className="mt-3 font-body text-sm text-ink/70">
          Behind the scenes of our AI-guided creativity studio, co-built with educators, kids, and technologists.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[2rem] bg-cream p-6 shadow-inner">
            <h2 className="font-heading text-2xl font-semibold text-ink">{section.title}</h2>
            <p className="mt-3 font-body text-sm text-ink/75">{section.copy}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
