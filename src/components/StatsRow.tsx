const stats = [
  { label: 'Magical Games', value: '100+' },
  { label: 'Kid Creators', value: '200K+' },
  { label: 'Daily Adventures', value: '50+' },
  { label: 'AI Sidekicks', value: '6' },
];

export default function StatsRow() {
  return (
    <section className="mt-14 grid gap-4 rounded-[2.25rem] bg-white p-6 shadow-float sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-cream px-5 py-6 text-center shadow-inner">
          <p className="font-heading text-3xl font-semibold text-lagoon">{stat.value}</p>
          <p className="mt-1 font-body text-sm text-ink/70">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}
