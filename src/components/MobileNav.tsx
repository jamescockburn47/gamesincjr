'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!panelRef.current) return;
      if (open && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur hover:bg-white/20"
        aria-label="Open menu"
        aria-expanded={open ? 'true' : 'false'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm.75 4.5a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/40" />
      )}

      {/* Drawer */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 z-[70] h-full w-72 translate-x-full bg-[#0f172a] text-white shadow-xl transition-transform duration-200 ${open ? '!translate-x-0' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <span className="font-semibold tracking-wide">Menu</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md border border-white/20 bg-white/10 p-2 hover:bg-white/20"
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-2 p-4">
          <Link href="/" className="rounded-lg px-3 py-3 text-cyan-300 hover:bg-white/10 hover:text-yellow-400" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/games" className="rounded-lg px-3 py-3 text-cyan-300 hover:bg-white/10 hover:text-yellow-400" onClick={() => setOpen(false)}>Games</Link>
          <Link href="/community" className="rounded-lg px-3 py-3 text-cyan-300 hover:bg-white/10 hover:text-yellow-400" onClick={() => setOpen(false)}>Community</Link>
          <Link href="/tutorials" className="rounded-lg px-3 py-3 text-cyan-300 hover:bg-white/10 hover:text-yellow-400" onClick={() => setOpen(false)}>Tutorials</Link>
          <Link href="/about" className="rounded-lg px-3 py-3 text-cyan-300 hover:bg-white/10 hover:text-yellow-400" onClick={() => setOpen(false)}>About</Link>
          <Link href="/games/space-runner" className="gaming-btn gaming-glow mt-2 text-center" onClick={() => setOpen(false)}>🎮 Play Now</Link>
        </nav>
      </div>
    </div>
  );
}


