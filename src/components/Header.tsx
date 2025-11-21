import Link from 'next/link';
import Logo from './Logo';
import { getUserFromCookies } from '@/lib/user-session';

import MobileNav from './MobileNav';
import ProgressWidget from './ProgressWidget';
import NotificationCenter from './NotificationCenter';

export default async function Header() {
  const user = await getUserFromCookies();
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/games', label: 'Games' },
    { href: '/imaginary-friends', label: 'Friends' },
    { href: '/make-your-game', label: 'Create' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-lg border-b-2 border-slate-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo Area */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <div className="relative transition-transform group-hover:scale-110 duration-300">
              <Logo size="md" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-heading font-bold text-slate-800 leading-none tracking-tight group-hover:text-sky-500 transition-colors">
                Games Inc<span className="text-sky-500">.</span>
              </span>
              <span className="text-sm font-heading font-bold text-sky-500 leading-none uppercase tracking-widest">
                Junior
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-5 py-2.5 rounded-full text-base font-heading font-bold text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Area */}
          <div className="hidden md:flex items-center gap-3">
            <ProgressWidget />
            <NotificationCenter />

            {user.email ? (
              <Link
                href="/account"
                className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-white border-2 border-slate-100 hover:border-sky-200 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-lg">
                  👤
                </div>
                <span className="text-sm font-heading font-bold text-slate-700">
                  {user.email.split('@')[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn-fun bg-sky-500 text-white px-6 py-2.5 text-sm hover:bg-sky-400"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <NotificationCenter />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
