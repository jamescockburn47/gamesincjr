export const metadata = { title: 'Comunità • Games Inc Jr' };
import CommunityClient from '../../community/section-client';

export default function CommunityIt() {
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-16">
        <CommunityClient />
      </div>
    </main>
  );
}


