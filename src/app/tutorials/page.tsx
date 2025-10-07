import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";

export const metadata = { title: "Tutorials • Games Inc Jr" };

export default function TutorialsPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <PageHeader
          align="left"
          eyebrow="30-minute sessions"
          title="Coding tutorials for curious kids"
          description="We run focused, remote sessions (£25 per student) that show 7+ learners how to bring ideas to life with AI-assisted, prompt-based workflows."
        />

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">Why now?</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            The industry is shifting fast with AI. Vibe coding—describing what you want clearly and iterating quickly—is now standard. You don&apos;t need prior experience; bring a vision, communicate it, pay attention to detail and embrace the tech.
          </p>
        </section>

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">What we cover</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-base leading-7 text-slate-600">
            <li>Prompting fundamentals and how to stay safe.</li>
            <li>Building a tiny browser game with AI assistance.</li>
            <li>Iterating on visuals, controls and difficulty.</li>
            <li>Publishing a playable preview you can share.</li>
          </ul>
        </section>

        <section className="rounded-3xl bg-sky-50/70 p-8 shadow-lg ring-1 ring-sky-100">
          <h2 className="text-xl font-semibold text-slate-900">Book a session</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Email <a className="font-semibold text-sky-600 underline" href="mailto:hello@gamesincjr.com">hello@gamesincjr.com</a> with preferred times. Parental consent is required for under-16s.
          </p>
          <p className="mt-3 text-sm text-slate-500">One-to-one or small groups (up to three students) cost the same.</p>
        </section>
      </div>
    </PageShell>
  );
}
