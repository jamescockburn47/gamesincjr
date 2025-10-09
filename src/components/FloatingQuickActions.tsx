'use client';

import Link from 'next/link';
import { useState } from 'react';

const actions = [
  {
    href: '/imaginary-friends',
    label: 'Chat with a friend',
    description: 'Start an imaginative conversation.',
    icon: '💬',
  },
  {
    href: '/ai-games',
    label: 'Play an AI game',
    description: 'Jump into a creative challenge.',
    icon: '🎮',
  },
  {
    href: '/tutorials',
    label: 'Learn something new',
    description: 'Pick a guided activity for today.',
    icon: '🌟',
  },
];

export default function FloatingQuickActions() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 sm:right-6 sm:left-auto sm:w-auto sm:justify-end">
      <div className="flex max-w-lg flex-1 flex-col items-stretch gap-3 sm:max-w-none sm:items-end">
        {expanded && (
          <div className="pointer-events-auto flex w-full flex-col gap-3 rounded-3xl border border-white/60 bg-white/90 p-3 shadow-2xl ring-1 ring-white/40 backdrop-blur-md sm:w-80">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:ring-sky-200"
              >
                <span aria-hidden="true" className="text-xl">
                  {action.icon}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                  <p className="text-[11px] text-slate-500">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-xl transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
          aria-expanded={expanded}
        >
          <span aria-hidden="true">{expanded ? '✖️' : '🚀'}</span>
          {expanded ? 'Hide quick actions' : 'Open quick actions'}
        </button>
      </div>
    </div>
  );
}
