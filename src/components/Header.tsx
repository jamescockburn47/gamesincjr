import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            Games Inc Jr
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/games" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Games
            </Link>
            <Link 
              href="/games/space-runner" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Play Now
            </Link>
            <Link 
              href="/admin/login" 
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
