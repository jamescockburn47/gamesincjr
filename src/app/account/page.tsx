import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { getUserFromCookies, type Tier } from "@/lib/user-session";
import { cookies as serverCookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync } from "crypto";

export const metadata = { title: "Account • Games Inc Jr" };

export default async function AccountPage() {
  const user = await getUserFromCookies();

  return (
    <PageShell>
      <div className="mx-auto flex max-w-xl flex-col gap-10">
        <PageHeader
          align="left"
          eyebrow="Manage access"
          title="Account settings"
          description={`Signed in as ${user.email || "a guest"}. Update your email and membership tier below.`}
        />

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Sign in / Sign up</h2>
          <form
            className="mb-8 space-y-5"
            action={async (formData: FormData) => {
              "use server";
              const mode = String(formData.get("mode") || "login");
              const usernameRaw = String(formData.get("username") || "");
              const passwordRaw = String(formData.get("password") || "");
              const username = usernameRaw.trim().slice(0, 40).replace(/[^a-zA-Z0-9_\-\s]/g, "");
              const password = passwordRaw.trim();
              if (!username || !password) return;

              type UserRecord = { username: string; passwordHash: string; salt: string; createdAt: string };

              async function readUser(u: string): Promise<UserRecord | null> {
                const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_RW_TOKEN || '';
                try {
                  if (token) {
                    const { list } = await import("@vercel/blob");
                    const prefix = `auth/users/${u}.json`;
                    const { blobs } = await list({ prefix, token });
                    if (blobs.length) {
                      const res = await fetch(blobs[0].url, { cache: 'no-store' });
                      if (res.ok) return (await res.json()) as UserRecord;
                    }
                    return null;
                  }
                } catch {}
                return null;
              }

              async function writeUser(u: string, record: UserRecord) {
                const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_RW_TOKEN || '';
                if (!token) return;
                const { put } = await import("@vercel/blob");
                await put(`auth/users/${u}.json`, JSON.stringify(record), { access: 'private', token, contentType: 'application/json' });
              }

              function hashPassword(pw: string, salt?: string) {
                const s = salt || randomBytes(16).toString('hex');
                const hash = scryptSync(pw, s, 32).toString('hex');
                return { salt: s, hash };
              }

              if (mode === 'signup') {
                const existing = await readUser(username);
                if (existing) return; // user exists; ignore for now
                const { salt, hash } = await hashPassword(password);
                const record = { username, passwordHash: hash, salt, createdAt: new Date().toISOString() };
                await writeUser(username, record);
              } else {
                const existing = await readUser(username);
                if (!existing) return;
                const { salt, passwordHash } = existing;
                const { hash } = await hashPassword(password, salt);
                if (hash !== passwordHash) return; // invalid
              }

              const jar = await serverCookies();
              jar.set("gi_user", username, { httpOnly: false, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
              redirect("/imaginary-friends");
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                defaultValue={user.email}
                placeholder="e.g. LunaFan"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">Mode</label>
              <select name="mode" className="rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-xs">
                <option value="login">Sign in</option>
                <option value="signup">Sign up</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-500/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Continue
            </button>
          </form>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Access tier</h3>
          <form
            className="space-y-5"
            action={async (formData: FormData) => {
              "use server";
              const email = String(formData.get("email") || "");
              const tier = String(formData.get("tier") || "free") as Tier;
              await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, tier }),
              });
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="account-email">Email (optional)</label>
              <input
                id="account-email"
                name="email"
                defaultValue={user.email}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="account-tier">
                Membership tier
              </label>
              <select
                id="account-tier"
                name="tier"
                defaultValue={user.tier}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="free">Free (previews only)</option>
                <option value="starter">Starter (1 game)</option>
                <option value="explorer">Explorer (3 games)</option>
                <option value="champion">Champion (10 games)</option>
                <option value="premium_ai">Premium AI (all games + AI extras)</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-500/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Save settings
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white/70 p-6 text-sm text-slate-600 shadow-inner ring-1 ring-slate-100">
          <form
            action={async () => {
              "use server";
              const jar = await serverCookies();
              jar.delete("gi_user");
              jar.delete("if_user_id");
              redirect("/");
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
          <p className="mt-4 leading-6">
            We store your chosen tier in a cookie so game pages know which levels to unlock. Clearing browser data will sign you out.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
