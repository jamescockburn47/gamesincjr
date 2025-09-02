import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Games Inc Jr',
  description: 'Gioca a fantastici giochi HTML5 online. Space Runner e altro ancora!',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}


