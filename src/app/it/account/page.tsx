import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { getUserFromCookies, type Tier } from "@/lib/user-session";

export const metadata = { title: "Account • Games Inc Jr" };

export default async function AccountItPage() {
  const user = await getUserFromCookies();

  return (
    <PageShell>
      <div className="mx-auto flex max-w-xl flex-col gap-10">
        <PageHeader
          align="left"
          eyebrow="Gestisci accesso"
          title="Impostazioni account"
          description={`Accesso come ${user.email || "ospite"}. Aggiorna email e livello di abbonamento qui sotto.`}
        />

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
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
              <label className="text-sm font-semibold text-slate-700" htmlFor="account-email-it">
                Email
              </label>
              <input
                id="account-email-it"
                name="email"
                defaultValue={user.email}
                placeholder="tu@esempio.com"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="account-tier-it">
                Livello abbonamento
              </label>
              <select
                id="account-tier-it"
                name="tier"
                defaultValue={user.tier}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="free">Free (solo anteprime)</option>
                <option value="starter">Starter (1 gioco)</option>
                <option value="explorer">Explorer (3 giochi)</option>
                <option value="champion">Champion (10 giochi)</option>
                <option value="premium_ai">Premium AI (tutti i giochi + AI)</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-500/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Salva impostazioni
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white/70 p-6 text-sm text-slate-600 shadow-inner ring-1 ring-slate-100">
          <form
            action={async () => {
              "use server";
              await fetch("/api/auth/logout", { method: "POST" });
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Esci
            </button>
          </form>
          <p className="mt-4 leading-6">
            Conserviamo il livello scelto in un cookie per sapere quali livelli sbloccare. Svuotare i dati del browser termina l&apos;accesso.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
