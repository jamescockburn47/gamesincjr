import { getUserFromCookies, type Tier } from '@/lib/user-session';

export const metadata = { title: 'Account • Games Inc Jr' };

export default async function AccountIt() {
  const user = await getUserFromCookies();
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 shadow">
          <h1 className="pixel-text text-3xl text-gray-900 mb-4">Account</h1>
          <p className="modern-text text-gray-700 mb-6">Accesso come: {user.email || 'Ospite'}</p>
          <form className="space-y-4" action={async (fd: FormData) => { 'use server'; const email=String(fd.get('email')||''); const tier=String(fd.get('tier')||'free') as Tier; await fetch('/api/auth/login',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email, tier})}); }}>
            <div><label className="block text-sm text-gray-700 mb-1">Email</label><input name="email" defaultValue={user.email} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm text-gray-700 mb-1">Livello</label>
              <select name="tier" defaultValue={user.tier} className="w-full border rounded px-3 py-2">
                <option value="free">Gratis (anteprime)</option>
                <option value="starter">Starter (1 gioco)</option>
                <option value="explorer">Explorer (3 giochi)</option>
                <option value="champion">Champion (10 giochi)</option>
                <option value="premium_ai">AI Premium</option>
              </select>
            </div>
            <button className="gaming-btn" type="submit">Salva</button>
          </form>
          <form className="mt-6" action={async ()=>{ 'use server'; await fetch('/api/auth/logout',{method:'POST'}); }}>
            <button className="clean-btn" type="submit">Esci</button>
          </form>
        </div>
      </div>
    </main>
  );
}


