import ImaginaryFriendsApp from '@/features/imaginary-friends/ImaginaryFriendsApp';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Magic AI Friends • Games Inc Jr' };

export default function Page() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <ImaginaryFriendsApp />
    </main>
  );
}


