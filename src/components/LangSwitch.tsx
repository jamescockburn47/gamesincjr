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
      className="modern-text text-xs px-2 py-1 rounded border border-white/20 bg-white/10 text-white hover:bg-white/20"
      aria-label={isIt ? 'Passa a Inglese' : 'Switch to Italian'}
    >
      {isIt ? 'EN' : 'IT'}
    </Link>
  );
}


