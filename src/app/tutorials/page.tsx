export const metadata = { title: 'Tutorials • Games Inc Jr' };

export default function TutorialsPage() {
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow">
          <h1 className="pixel-text text-4xl text-gray-900 mb-4">Coding Tutorials</h1>
          <p className="modern-text text-gray-700 mb-6">
            We offer 30‑minute remote sessions at <strong>£25 per student</strong> to show how kids (7+)
            can get started with AI‑assisted, prompt‑based coding.
          </p>

          <h2 className="heading-text text-2xl text-gray-900 mb-2">Why now?</h2>
          <p className="modern-text text-gray-700 mb-6">
            The industry has changed dramatically with AI. “Vibe coding” — describing what you want in
            clear language and iterating quickly — is now common at big tech companies and among
            indie creators. You don’t need prior coding experience: bring a clear vision, communicate
            well, pay attention to detail, and don’t be afraid of technology. Even kids can bring ideas
            to life in minutes.
          </p>

          <h2 className="heading-text text-2xl text-gray-900 mb-2">What we cover</h2>
          <ul className="modern-text text-gray-700 list-disc pl-5 mb-6">
            <li>Prompting fundamentals and safe practices</li>
            <li>Building a tiny browser game with AI assistance</li>
            <li>Iterating on visuals, controls, and difficulty</li>
            <li>Publishing a playable preview</li>
          </ul>

          <h2 className="heading-text text-2xl text-gray-900 mb-2">Book a session</h2>
          <p className="modern-text text-gray-700 mb-2">
            Email <a href="mailto:hello@gamesincjr.com" className="underline">hello@gamesincjr.com</a>
            {' '}with preferred times. Parental consent required for under‑16s.
          </p>
          <p className="modern-text text-gray-600 text-sm">One‑to‑one or small groups (up to 3) at the same price.</p>
        </div>
      </div>
    </main>
  );
}


