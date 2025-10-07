import Link from 'next/link';

import { homeContent } from '@/data/homeContent';

const { heroStats, featureCards, collapsibleSections, hero, callToAction } = homeContent;

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
              {hero.eyebrow}
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{hero.description}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={hero.primaryCta.href}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                {hero.primaryCta.label}
              </Link>
              <Link
                href={hero.secondaryCta.href}
                className="inline-flex items-center justify-center rounded-xl bg-white/80 px-8 py-4 text-base font-semibold text-slate-800 shadow-md ring-1 ring-sky-100 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                {hero.secondaryCta.label}
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
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-3xl">🦄</span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">{hero.featuredWorld.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{hero.featuredWorld.title}</p>
                  </div>
                </div>
                <p className="text-sm leading-6 text-slate-600">{hero.featuredWorld.description}</p>
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-center text-sky-100 shadow-inner">
                  <p className="text-lg font-semibold tracking-wide text-white">{hero.featuredWorld.liveMissionTitle}</p>
                  <p className="mt-2 text-sm text-slate-300">{hero.featuredWorld.liveMissionDescription}</p>
                </div>
                <Link
                  href={hero.featuredWorld.ctaHref}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-rose-400 via-amber-400 to-yellow-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:brightness-110"
                >
                  {hero.featuredWorld.ctaLabel}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature summary cards */}
        <section className="mt-24">
          <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            Discover the worlds our young studios are shipping
          </h2>
          <p className="mt-4 text-center text-base text-slate-600">
            Every release combines kid-led storytelling, educator oversight and AI copilots tuned for emerging players.
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
              Explore how Games inc. Jr combines child-led creativity, thoughtful AI and safe community spaces.
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
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{callToAction.title}</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{callToAction.description}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={callToAction.primaryCta.href}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 via-purple-400 to-pink-400 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110"
                >
                  {callToAction.primaryCta.label}
                </Link>
                <Link
                  href={callToAction.secondaryCta.href}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  {callToAction.secondaryCta.label}
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-200 via-cyan-100 to-rose-200 p-1 shadow-xl">
              <div className="rounded-[26px] bg-white/90 p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">{callToAction.reasonsTitle}</p>
                <ul className="mt-6 space-y-4 text-base leading-7 text-slate-700">
                  {callToAction.reasons.map((reason) => (
                    <li key={reason.text} className="flex items-start gap-3">
                      <span className="mt-1 text-lg">{reason.icon}</span>
                      <span>{reason.text}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-slate-500">{callToAction.tip}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
