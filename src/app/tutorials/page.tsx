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
          title="Learn to AI-code — starting with games"
          description="We run focused, remote sessions (£25 per student) that teach 7+ learners how to build real software by instructing AI: games first, because games are the most honest teacher."
        />

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">Why games? Why now?</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Working with AI is becoming the way most software gets made — and it is a learnable
            skill, not a party trick. The loop is always the same: <strong>cover your ideas</strong> (say
            everything that matters — the AI builds what you said, not what you meant),
            <strong> test it against reality</strong> (play it: if the jump feels wrong, it is wrong),
            <strong> iterate</strong> (describe the gap precisely), and <strong>persevere</strong> (the first
            build is never the good one). Games are the perfect training ground because reality
            answers back instantly — a boring game tells you your instructions were incomplete.
          </p>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Along the way, learners pick up genuine software knowledge — code, architecture,
            debugging, how languages differ — <em>on the job</em>, because their own game needs it.
            The same loop later builds websites, tools, school projects and anything else they can describe.
          </p>
        </section>

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">What we cover</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-base leading-7 text-slate-600">
            <li>Prompting fundamentals and how to stay safe.</li>
            <li>Writing a real game brief: verbs, decisions, difficulty, unlockables.</li>
            <li>Building a browser game with AI assistance — then playtesting it honestly.</li>
            <li>Iterating on visuals, controls and difficulty until it is genuinely fun.</li>
            <li>Reading the code you made: what changed, why it works, how it fits together.</li>
            <li>Publishing a playable game on this site, with your name on it.</li>
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
