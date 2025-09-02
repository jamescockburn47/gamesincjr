import Link from 'next/link';
import Logo from './Logo';
import { getUserFromCookies } from '@/lib/user-session';
import LangSwitch from './LangSwitch';

export default async function Header() {
  const user = await getUserFromCookies();
  return (
    <header className="gaming-bg border-b-2 border-orange-200 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200">
            <Logo size="md" className="controller-glow" />
            <div className="hidden sm:block">
              <div className="pixel-text text-yellow-400 text-sm">GAMES inc.</div>
              <div className="heading-text text-orange-400 text-xl">Jr</div>
            </div>
          </Link>
          
          <nav className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="modern-text text-cyan-300 hover:text-yellow-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Home
            </Link>
            <Link 
              href="/games" 
              className="modern-text text-cyan-300 hover:text-yellow-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Games
            </Link>
            <Link 
              href="/community" 
              className="modern-text text-cyan-300 hover:text-yellow-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Community
            </Link>
            <Link 
              href="/tutorials" 
              className="modern-text text-cyan-300 hover:text-yellow-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Tutorials
            </Link>
            <Link 
              href="/about" 
              className="modern-text text-cyan-300 hover:text-yellow-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
            >
              About
            </Link>
            <Link 
              href="/games/space-runner" 
              className="gaming-btn gaming-glow"
            >
              🎮 Play Now
            </Link>
            <LangSwitch />
            <Link href="/account" className="text-gray-300 hover:text-white transition-colors text-sm px-2 py-1 rounded hover:bg-white/10">
              {user.email ? 'Account' : 'Sign In'}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
