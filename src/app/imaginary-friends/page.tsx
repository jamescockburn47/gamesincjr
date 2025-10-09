import ImaginaryFriendsApp from '@/features/imaginary-friends/ImaginaryFriendsApp';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Magic AI Friends • Games Inc Jr' };

export default async function Page() {
  const jar = await cookies();
  const user = jar.get('gi_user')?.value || '';
  if (!user) {
    return (
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-3xl bg-white/80 p-8 text-center shadow-lg ring-1 ring-slate-100">
          <h1 className="mb-3 text-2xl font-bold text-slate-900">Magic AI Friends</h1>
          <p className="mb-6 text-slate-600">Please sign in with a username to start chatting.</p>
          <a href="/account" className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-500/90">
            Go to Account
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <ImaginaryFriendsApp />
    </main>
  );
}


