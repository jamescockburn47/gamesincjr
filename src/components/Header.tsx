import Link from 'next/link';
import Logo from './Logo';
import { getUserFromCookies } from '@/lib/user-session';
import LangSwitch from './LangSwitch';
import MobileNav from './MobileNav';
import ProgressWidget from './ProgressWidget';
import NotificationCenter from './NotificationCenter';

export default async function Header() {
  const user = await getUserFromCookies();
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/games', label: 'Games' },
    { href: '/tables', label: 'Times Tables Super Stars' },
    { href: '/community', label: 'Community' },
    { href: '/tutorials', label: 'Tutorials' },
    { href: '/imaginary-friends', label: 'Magic AI Friends' },
    { href: '/tech', label: 'How it works' },
    { href: '/about', label: 'About' },
    { href: '/account/parent', label: 'Parent Dashboard' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/65">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Logo size="md" className="drop-shadow-sm" />
            <div className="hidden sm:block leading-tight">
              <span className="text-xs font-semibold uppercase tracking-widest text-sky-500">Games inc.</span>
              <div className="text-xl font-bold text-slate-900">Jr</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/games/alien-unicorn-alliance"
              className="ml-2 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              🦄 Play Alien Unicorn Alliance
            </Link>
            <ProgressWidget />
            <NotificationCenter />
            <LangSwitch />
            <Link
              href="/account"
              className="rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-sky-50 hover:text-sky-700"
            >
              {user.email ? `Hi, ${user.email}` : 'Sign in'}
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <LangSwitch />
            <NotificationCenter />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
