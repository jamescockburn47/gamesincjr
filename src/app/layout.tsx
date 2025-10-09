import type { Metadata } from 'next';
import { Fredoka, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';

const heading = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
});

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Games Inc Jr',
  description: 'Bright, safe, and imaginative games kids can play right in the browser.',
  openGraph: {
    title: 'Games Inc Jr',
    description: 'Bright, safe, and imaginative games kids can play right in the browser.',
    type: 'website',
    siteName: 'Games Inc Jr',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Games Inc Jr',
    description: 'Bright, safe, and imaginative games kids can play right in the browser.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${heading.variable} ${body.variable} font-body text-ink`}>
        <div className="min-h-screen bg-cream">
          <TopBar />
          <main className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
