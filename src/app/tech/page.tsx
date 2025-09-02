export const metadata = { title: 'How the site works • Games Inc Jr' };

export default function TechOverview() {
  return (
    <main className="min-h-screen gaming-bg pixel-pattern">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow">
          <h1 className="pixel-text text-4xl text-gray-900 mb-4">How the site works (plain English)</h1>
          <ol className="list-decimal pl-5 space-y-3 modern-text text-gray-700">
            <li><strong>Pages</strong>: The site runs on Next.js. Most pages are simple server-rendered React components.</li>
            <li><strong>Games data</strong>: A small JSON file in the repo lists games. We read it using a tiny TypeScript helper.</li>
            <li><strong>Playable demos</strong>: Each demo is a normal HTML/JS file in the public folder, embedded with an iframe. No downloads.</li>
            <li><strong>Community feed</strong>: A small API lets visitors post and read messages. We store them in Upstash (a hosted Redis). If not configured, it stores in memory for dev.</li>
            <li><strong>Login & tiers</strong>: A minimal demo login sets a cookie for your selected tier. Later we’ll switch to email magic-links and Stripe.</li>
            <li><strong>Security</strong>: We set basic headers and run demos in a sandboxed iframe.</li>
            <li><strong>Internationalisation</strong>: English and Italian pages live under different paths. Copy can be translated per page or per game.</li>
            <li><strong>Deploy</strong>: Pushing to GitHub triggers Vercel to deploy. Some pages bypass caching so new data shows immediately.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}


