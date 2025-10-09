import Link from 'next/link';

import { getUserFromCookies } from '@/lib/user-session';
import { getUserProgressSnapshot } from '@/lib/progress';

function buildProgressStyle(percent: number) {
  const clamped = Math.max(4, Math.min(96, percent));
  return {
    background: `conic-gradient(var(--brand-sky) ${clamped * 3.6}deg, rgba(148, 163, 184, 0.35) 0deg)`,
  };
}

export default async function ProgressWidget() {
  const user = await getUserFromCookies();
  const snapshot = await getUserProgressSnapshot(user.tier);
  const percent = Math.round(snapshot.dailyGoalPercent * 100);

  return (
    <Link
      aria-label="View your progress dashboard"
      href="/account#progress"
      className="group flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-white/40 backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: 'rgba(255,255,255,0.78)' }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-inner transition group-hover:scale-105"
        style={buildProgressStyle(percent)}
      >
        <span className="text-xs font-semibold text-slate-900">{percent}%</span>
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">Daily quest</p>
        <p className="text-sm font-semibold text-slate-900">
          Level {snapshot.level}{' '}
          <span className="text-xs font-medium text-slate-500">
            · {snapshot.streak}-day streak · {snapshot.stars}⭐
          </span>
        </p>
        <p className="text-[11px] text-slate-500">
          Next reward: <span className="font-medium text-slate-700">{snapshot.nextReward}</span>
        </p>
      </div>
    </Link>
  );
}
