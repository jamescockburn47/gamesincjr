'use client';

import { useMemo, useState } from 'react';

import type { NotificationItem } from '@/data/notifications';
import { notifications as notificationSeed } from '@/data/notifications';

function badgeClasses(importance: NotificationItem['importance']) {
  if (importance === 'success') {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (importance === 'reminder') {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-sky-100 text-sky-700';
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [items] = useState(notificationSeed);

  const unreadCount = useMemo(
    () => items.slice(0, 3).length,
    [items],
  );

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="notification-popover"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-sky-600 shadow-sm ring-1 ring-white/40 transition hover:-translate-y-0.5 hover:text-sky-700"
      >
        <span aria-hidden="true" className="text-lg">
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="notification-popover"
          role="region"
          className="absolute right-0 z-50 mt-3 w-80 max-w-sm origin-top-right rounded-3xl border border-white/60 bg-white/90 p-4 text-sm text-slate-700 shadow-2xl ring-1 ring-white/50 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Activity feed</p>
            <button
              type="button"
              className="text-xs font-medium text-sky-600 underline-offset-2 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>

          <ul className="mt-3 space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-slate-100 transition hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.message}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${badgeClasses(item.importance)}`}>
                    {item.timeAgo}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
          >
            View parent dashboard
          </button>
        </div>
      )}
    </div>
  );
}
