'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/home', label: 'Home' },
  { href: '/games', label: 'Games' },
  { href: '/about', label: 'About' },
  { href: '/parents', label: 'Parents' },
  { href: '/contact', label: 'Contact' },
];

export default function TopBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/home' && (pathname === '/' || pathname === '/home')) return true;
    return pathname === href;
  };

  return (
    <header className="border-b border-white/70 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/home"
          className="flex items-center gap-4 rounded-[2rem] bg-white px-6 py-4 shadow-float ring-1 ring-white/70 transition hover:-translate-y-1"
        >
          <span className="relative h-16 w-16 sm:h-20 sm:w-20">
            <Image src="/logo.svg" alt="Games Inc Jr" fill priority />
          </span>
          <div className="leading-tight">
            <span className="font-heading text-2xl font-semibold text-ink sm:text-3xl">Games Inc Jr</span>
            <p className="font-body text-sm text-ink/60">Play Fun Games!</p>
          </div>
        </Link>

        <nav className="flex flex-wrap justify-center gap-2 font-body text-sm font-medium text-ink/70">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-4 py-2 transition ${
                  active ? 'bg-white text-ink shadow-sm ring-1 ring-white/70' : 'hover:bg-white/80 hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
