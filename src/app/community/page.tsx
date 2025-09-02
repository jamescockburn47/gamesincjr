export const metadata = { title: 'Community • Games Inc Jr' };

import CommunityClient from './section-client';

export default function CommunityPage() {
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-16">
        <CommunityClient />
      </div>
    </main>
  );
}


