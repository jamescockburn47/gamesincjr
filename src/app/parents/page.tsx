import Link from 'next/link';

const cards = [
  {
    title: 'Safety Controls',
    copy: 'Toggle safe chat, block specific themes, and moderate AI companions with one tap.',
    icon: '🧷',
  },
  {
    title: 'Screen Time',
    copy: 'Schedule play windows, set daily limits, and receive gentle reminders for wind-down time.',
    icon: '⏰',
  },
  {
    title: 'Privacy',
    copy: 'Minimal data collection, encrypted storage, and detailed transparency reports.',
    icon: '🔐',
  },
  {
    title: 'Feedback & Support',
    copy: 'Chat with our team, suggest new features, or flag anything that needs attention.',
    icon: '💬',
  },
];

export default function ParentsPage() {
  return (
    <div className="space-y-10">
      <header className="rounded-[2.5rem] bg-white p-8 shadow-float">
        <h1 className="font-heading text-4xl font-semibold text-ink">Parents &amp; Caregivers</h1>
        <p className="mt-3 font-body text-sm text-ink/70">
          Your co-pilot for confident, playful screen time. Explore controls, privacy, and support resources.
        </p>
        <Link
          href="/account#parent-dashboard"
          className="mt-6 inline-flex rounded-2xl bg-mango px-5 py-3 font-body text-sm font-semibold text-white shadow-float transition hover:-translate-y-1"
        >
          Open Parent Dashboard
        </Link>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card.title} className="rounded-[2rem] bg-white p-6 shadow-float">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{card.icon}</span>
              <h2 className="font-heading text-xl font-semibold text-ink">{card.title}</h2>
            </div>
            <p className="mt-3 font-body text-sm text-ink/70">{card.copy}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
