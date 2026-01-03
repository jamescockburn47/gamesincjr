'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { navCategories } from '@/data/gameCategories';
import { ChevronDown, X, Menu, Gamepad2, Home, Settings } from 'lucide-react';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const toggleCategory = (label: string) => {
    setExpandedCategory(expandedCategory === label ? null : label);
  };

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl border border-primary/10 bg-white/80 p-2 text-slate-600 shadow-sm transition hover:bg-white hover:text-primary"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={panelRef}
        className={`fixed inset-x-0 bottom-0 z-[70] max-h-[85vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>

        {/* Quick Play Banner */}
        <div className="px-4 pb-4">
          <Link
            href="/games"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl text-white font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform"
          >
            <Gamepad2 className="w-6 h-6" />
            Play Now
          </Link>
        </div>

        {/* Navigation */}
        <nav className="overflow-y-auto max-h-[calc(85vh-140px)] px-4 pb-8">
          {/* Home Link */}
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors font-bold"
            onClick={() => setOpen(false)}
          >
            <Home className="w-5 h-5" />
            Home
          </Link>

          {/* Category Accordions */}
          {navCategories.map((category) => (
            <div key={category.label} className="border-t border-slate-100">
              <button
                onClick={() => toggleCategory(category.label)}
                className="flex items-center justify-between w-full px-4 py-4 text-slate-700 hover:bg-primary/5 transition-colors"
              >
                <span className="font-bold">{category.label}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    expandedCategory === category.label ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Accordion Content */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  expandedCategory === category.label ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="pb-2 pl-4">
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-primary/5 hover:text-primary transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Additional Links */}
          <div className="border-t border-slate-100 pt-2 mt-2">
            <Link
              href="/about"
              className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-600 hover:bg-primary/5 hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              <span className="text-xl">ℹ️</span>
              <span className="font-medium">About</span>
            </Link>
            <Link
              href="/admin-console"
              className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-600 hover:bg-primary/5 hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Admin</span>
            </Link>
          </div>
        </nav>

        {/* Close Button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
