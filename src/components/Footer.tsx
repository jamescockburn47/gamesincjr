import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-cream">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-heading text-2xl font-semibold">Games Inc Jr</h3>
          <p className="mt-2 max-w-md font-body text-sm text-cream/70">
            Joyful, AI-guided play spaces designed for curious kids and confident parents.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 font-body text-sm text-cream/70">
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <Link href="/parents" className="hover:text-white">
            Parents
          </Link>
          <Link href="/contact" className="hover:text-white">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/10 py-4 text-center font-body text-xs text-cream/60">
        © {new Date().getFullYear()} Games Inc Jr. Built with kids, carers, and creators in mind.
      </div>
    </footer>
  );
}
