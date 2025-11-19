'use client';

import { useState } from 'react';
import Link from 'next/link';
import { activityHighlights } from '@/data/activityHighlights';
import { homeContent } from '@/data/homeContent';

export default function ParentsCorner() {
  const [isOpen, setIsOpen] = useState(false);
  const { callToAction } = homeContent;

  return (
    <section className="mt-24 border-t border-slate-200 bg-slate-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold text-slate-900">Parents Corner</h2>
          <p className="mt-2 text-slate-600">Manage your child&apos;s account, view progress, and get tips.</p>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-sky-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            {isOpen ? 'Hide Details' : 'Show Parent Dashboard'}
            <span className="text-lg">{isOpen ? '▴' : '▾'}</span>
          </button>
        </div>

        {isOpen && (
          <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Live Activity */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Live Activity Board</h3>
                  <Link
                    href="/account/parent"
                    className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    Full Dashboard →
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {activityHighlights.map((highlight) => (
                    <div
                      key={highlight.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-lg">
                            {highlight.icon}
                          </span>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {highlight.tag}
                            </p>
                            <h4 className="text-sm font-semibold text-slate-900">{highlight.title}</h4>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-500">{Math.round(highlight.progress * 100)}%</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-400 transition-all"
                          style={{ width: `${Math.round(highlight.progress * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links & Tips */}
              <div className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-base font-semibold text-slate-900 mb-4">Quick Wins</h3>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 text-lg">✨</span>
                      Brainstorm a new world with an AI friend to earn extra stardust.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 text-lg">🎯</span>
                      Try the calming breathing break before bedtime.
                    </li>
                  </ul>
                  <Link
                    href="/account"
                    className="mt-6 block w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Go to Account Settings
                  </Link>
                </div>

                <div className="rounded-2xl bg-sky-50 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-sky-800 mb-3">{callToAction.reasonsTitle}</h3>
                  <ul className="space-y-2 text-sm text-sky-900">
                    {callToAction.reasons.map((reason) => (
                      <li key={reason.text} className="flex items-center gap-2">
                        <span>{reason.icon}</span>
                        <span>{reason.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

