import Link from 'next/link';

import { homeContent } from '@/data/homeContent';
import { activityHighlights } from '@/data/activityHighlights';

const { heroStats, hero, callToAction } = homeContent;

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

        {/* Live activity & progress */}
        <section className="mt-16">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Today&apos;s adventure board</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Track live events, studio playtests, and parent reminders&mdash;all in one kid-friendly stream.
                  </p>
                </div>
                <Link
                  href="/account/parent"
                  className="inline-flex items-center justify-center rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 shadow-sm ring-1 ring-slate-100 transition hover:bg-white"
                >
                  Parent dashboard
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {activityHighlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="group relative overflow-hidden rounded-3xl border border-sky-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-xl">
                          {highlight.icon}
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500">
                            {highlight.tag}
                          </p>
                          <h3 className="text-base font-semibold text-slate-900">{highlight.title}</h3>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-400">{Math.round(highlight.progress * 100)}%</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{highlight.description}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 transition-all"
                        style={{ width: `${Math.round(highlight.progress * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="rounded-3xl bg-white/90 p-6 shadow-lg ring-1 ring-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Quick wins</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">✨</span>
                    Brainstorm a new world with an AI friend to earn extra stardust.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">🎯</span>
                    Try the calming breathing break before bedtime&mdash;available in the parent dashboard.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">🎯</span>
                    Complete today&apos;s studio challenge to boost your streak multiplier.
                  </li>
                </ul>
                <Link
                  href="/community"
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
                >
                  View all challenges
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








