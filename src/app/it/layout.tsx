import type { Metadata } from 'next';
import '../globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Games Inc Jr',
  description: 'Gioca a fantastici giochi HTML5 online. Space Runner e altro ancora!',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}


