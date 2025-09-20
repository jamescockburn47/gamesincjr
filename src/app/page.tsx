import Link from 'next/link';

// Compact data sets keep the JSX below easy to scan.
const heroStats = [
  {
    value: '25+',
    label: 'Arcade, puzzles & story games',
    accent: 'text-sky-500',
  },
  {
    value: '8-13',
    label: 'Designed with players aged 8-13',
    accent: 'text-rose-500',
  },
  {
    value: '100%',
    label: 'Browser based, no installs',
    accent: 'text-amber-500',
  },
];

const featureCards = [
  {
    icon: '🌈',
    title: 'Kid-first design',
    description:
      'Rounded layouts, friendly animations and big tap targets make play comfortable on any screen.',
    bullets: [
      'Soft gradients keep focus on the action with playful colour pops.',
      'Accessibility-first type sizes and contrast for emerging readers.',
    ],
  },
  {
    icon: '🧭',
    title: 'Always know what to do next',
    description:
      'Guided mission cards and floating helpers turn every session into an easy-to-follow adventure.',
    bullets: [
      'Short quests with clear goals and celebratory feedback.',
      'Optional hints that explain concepts instead of giving away answers.',
    ],
  },
  {
    icon: '🛡️',
    title: 'Family friendly & safe',
    description:
      'We moderate experiences and keep everything in-browser so you can relax while they play.',
    bullets: [
      'No downloads, ads or surprise pop-ups—ever.',
      'Parent dashboards highlight progress, favourites and play time.',
    ],
  },
];

const collapsibleSections = [
  {
    icon: '🧠',
    title: 'Skill-building adventures',
    summary: 'Mini missions sharpen logic, creativity and teamwork.',
    details: [
      'Challenge cards break bigger ideas into manageable steps with colourful visual cues.',
      'Optional “level up” tasks appear once players feel ready for more complexity.',
      'Every mission ends with a reflective prompt so kids can share what they discovered.',
    ],
  },
  {
    icon: '🎨',
    title: 'Create, remix and show off',
    summary: 'Shareable studios let players tweak levels, stories and characters.',
    details: [
      'Templates, stickers and sound packs make it easy to customise without needing code.',
      'Collaborative rooms (with adult approval) encourage friends to co-create in real time.',
      'Built-in exports turn creations into printable zines or quick highlight reels.',
    ],
  },
  {
    icon: '👪',
    title: 'Made with families in mind',
    summary: 'Clear controls for grown-ups keep things safe and stress free.',
    details: [
      'Parent view summarises achievements, favourite genres and recommended next steps.',
      'Play-time reminders are gentle, customisable and pause the fun without fuss.',
      'You choose which community events or tutorials your child can join.',
    ],
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-rose-50">
      {/* Floating colour orbs add a playful backdrop without overpowering content. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-10 right-1/4 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute top-1/3 left-0 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pb-24 pt-16 lg:pt-24">
        {/* Hero section */}
        <section className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center rounded-full bg-white/80 px-4 py-1 text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-sky-100">
              Built by kids, guided by educators
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Ultra-clean play spaces crafted for curious minds
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Games inc. Jr blends imaginative worlds with smart guardrails. Kids get bright, responsive interfaces and mission-based challenges designed to grow with them—no downloads, no complicated menus.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/games"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                🎯 Browse all games
              </Link>
              <Link
                href="/games/space-runner"
                className="inline-flex items-center justify-center rounded-xl bg-white/80 px-8 py-4 text-base font-semibold text-slate-800 shadow-md ring-1 ring-sky-100 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                🚀 Jump into Space Runner
              </Link>
            </div>

            <dl className="mt-10 grid gap-6 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/80 p-5 text-center shadow-sm ring-1 ring-slate-100 backdrop-blur"
                >
                  <dt className={`text-3xl font-bold ${stat.accent}`}>{stat.value}</dt>
                  <dd className="mt-2 text-sm text-slate-600">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 via-indigo-400 to-purple-400 p-1 shadow-xl">
              <div className="space-y-6 rounded-[22px] bg-white/90 p-8 backdrop-blur">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-3xl">🌌</span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Featured world</p>
                    <p className="text-2xl font-bold text-slate-900">Space Runner</p>
                  </div>
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  Dash through nebula lanes, dodge comet clusters and unlock custom ships. Dynamic difficulty keeps the thrill alive while learning reflexes and planning skills.
                </p>
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-center text-sky-100 shadow-inner">
                  <p className="text-lg font-semibold tracking-wide text-white">Live mission: Cosmic Sprint</p>
                  <p className="mt-2 text-sm text-slate-300">Beat three star checkpoints in under 90 seconds to earn the Aurora badge.</p>
                </div>
                <Link
                  href="/games/space-runner"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-rose-400 via-amber-400 to-yellow-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:brightness-110"
                >
                  Start the launch countdown
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature summary cards */}
        <section className="mt-24">
          <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            Clean, modern UI with joyful colour moments
          </h2>
          <p className="mt-4 text-center text-base text-slate-600">
            Every screen favours clarity first—then adds sparkles of colour to celebrate wins and guide the eye.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="group flex h-full flex-col rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-3xl transition group-hover:scale-110">
                  {card.icon}
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                <ul className="mt-5 space-y-3 text-sm text-slate-600">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 text-lg text-amber-400">★</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Collapsible info panels keep details handy without overwhelming the page. */}
        <section className="mt-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Dive deeper when you&apos;re ready</h2>
            <p className="mt-4 text-base text-slate-600">
              Expand the sections below to explore how Games inc. Jr balances joyful exploration with thoughtful guardrails.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {collapsibleSections.map((section) => (
              <details
                key={section.title}
                className="group rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-sm transition hover:border-sky-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-2xl">
                      {section.icon}
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3>
                      <p className="text-sm text-slate-600">{section.summary}</p>
                    </div>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-lg text-sky-600 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
                  {section.details.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Closing call to action */}
        <section className="mt-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Ready for launch?</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Join a welcoming universe designed for curious kids and confident families. Explore solo, team up with friends or start designing your own mini worlds—the tools and tutorials are right inside your browser.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 via-purple-400 to-pink-400 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110"
                >
                  🌟 Meet the community
                </Link>
                <Link
                  href="/tutorials"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  📚 Explore tutorials
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-200 via-cyan-100 to-rose-200 p-1 shadow-xl">
              <div className="rounded-[26px] bg-white/90 p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Why kids come back</p>
                <ul className="mt-6 space-y-4 text-base leading-7 text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-lg">💬</span>
                    <span>Friendly reminders and celebration screens cheer on progress without overwhelming the experience.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-lg">🧩</span>
                    <span>Levels are intentionally bite-sized so kids can play a full loop in five minutes or less.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-lg">🎁</span>
                    <span>Earnable badges unlock new colour themes and stickers to personalise dashboards and avatars.</span>
                  </li>
                </ul>
                <p className="mt-6 text-sm text-slate-500">
                  Pro tip: Use the parent dashboard to schedule weekend challenges or quiet creativity time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
