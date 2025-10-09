import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";

const points = [
  "Built with Next.js so most screens render on the server for instant loads.",
  "Game metadata lives in a tiny JSON file and a helper reads it across the app.",
  "Playable demos are static HTML/JS bundles inside /public, embedded with sandboxed iframes.",
  "Community posts go through a simple API backed by Upstash Redis (with an in-memory fallback for local dev).",
  "Magic AI Friends: per‑user sessions via a simple username cookie; chat logs saved to Vercel Blob (filesystem fallback in dev).",
  "Magic AI Friends: streaming NDJSON responses from the API; the client displays tokens live and prepends the last 20 Q&A pairs as context.",
  "Magic AI Friends: centralised character prompts; short replies by default with optional longer Story:/Fact: sections.",
  "Security headers and iframe sandboxing keep previews contained.",
  "Italian and English copy live side by side so localisation is easy to expand.",
  "Deployments run on Vercel—push to main and the site updates automatically.",
];

export const metadata = { title: "How the site works • Games Inc Jr" };

export default function TechOverview() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <PageHeader
          align="left"
          eyebrow="Behind the scenes"
          title="How the site works (plain English)"
          description="A quick tour of the architecture so families and collaborators know what keeps Games inc. Jr running smoothly."
        />

        <section className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
          <ol className="list-decimal space-y-4 pl-5 text-base leading-7 text-slate-600">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </section>
      </div>
    </PageShell>
  );
}
