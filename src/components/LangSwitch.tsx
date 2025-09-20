'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function toggleLocalePath(pathname: string): { target: string; isIt: boolean } {
  if (pathname === '/') return { target: '/it', isIt: false };
  if (pathname.startsWith('/it')) {
    const rest = pathname.slice(3) || '/';
    return { target: rest, isIt: true };
  }
  return { target: '/it' + pathname, isIt: false };
}

export default function LangSwitch() {
  const pathname = usePathname() || '/';
  const { target, isIt } = toggleLocalePath(pathname);
  return (
    <Link
      href={target}
      className="inline-flex items-center justify-center rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:bg-white hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      aria-label={isIt ? 'Passa a Inglese' : 'Switch to Italian'}
    >
      {isIt ? 'EN' : 'IT'}
    </Link>
  );
}
