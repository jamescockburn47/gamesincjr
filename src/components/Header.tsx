import Link from 'next/link';
import Logo from './Logo';
import { getUserFromCookies } from '@/lib/user-session';
import MobileNav from './MobileNav';
import ProgressWidget from './ProgressWidget';
import NotificationCenter from './NotificationCenter';
import { navCategories } from '@/data/gameCategories';
import { Gamepad2, Wrench, GraduationCap, ChevronDown } from 'lucide-react';

const categoryIcons = {
  Play: Gamepad2,
  Create: Wrench,
  Learn: GraduationCap,
};

export default async function Header() {
  const user = await getUserFromCookies();

  return (
    <header className="sticky top-0 z-50 bg-[#FFFBF5]/80 backdrop-blur-lg border-b-2 border-slate-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo Area */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <div className="relative transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
              <Logo size="md" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-heading font-bold text-slate-800 leading-none tracking-tight group-hover:text-primary transition-colors">
                Games Inc<span className="text-primary">.</span>
              </span>
              <span className="text-sm font-heading font-bold text-primary leading-none uppercase tracking-widest">
                Junior
              </span>
            </div>
          </Link>

          {/* Desktop Navigation with Dropdowns */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Home link */}
            <Link
              href="/"
              className="px-5 py-2.5 rounded-full text-base font-heading font-bold text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all duration-200"
            >
              Home
            </Link>

            {/* Category Dropdowns */}
            {navCategories.map((category) => {
              const Icon = categoryIcons[category.label as keyof typeof categoryIcons];
              return (
                <div key={category.label} className="relative group">
                  <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-base font-heading font-bold text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all duration-200">
                    {Icon && <Icon className="w-4 h-4" />}
                    {category.label}
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 min-w-[200px]">
                      {category.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                          <span className="text-lg">{item.emoji}</span>
                          <span className="font-bold">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Admin link (if needed) */}
            <Link
              href="/admin-console"
              className="px-5 py-2.5 rounded-full text-base font-heading font-bold text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all duration-200"
            >
              Admin
            </Link>
          </nav>

          {/* Action Area */}
          <div className="hidden md:flex items-center gap-3">
            <ProgressWidget />
            <NotificationCenter />

            {user.email ? (
              <Link
                href="/account"
                className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-white border-2 border-slate-100 hover:border-primary/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                  👤
                </div>
                <span className="text-sm font-heading font-bold text-slate-700">
                  {user.email.split('@')[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-primary text-white px-6 py-2.5 text-sm font-bold rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
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
