'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="space-y-10">
      <header className="rounded-[2.5rem] bg-white p-8 shadow-float">
        <h1 className="font-heading text-4xl font-semibold text-ink">Say Hello</h1>
        <p className="mt-3 font-body text-sm text-ink/70">
          Need help, have an idea, or just want to share a giggle? We read every message.
        </p>
      </header>
      <section className="rounded-[2.5rem] bg-white p-8 shadow-float">
        {submitted ? (
          <div className="rounded-[2rem] bg-cream px-6 py-12 text-center shadow-inner">
            <p className="font-heading text-2xl text-lagoon">Thanks! 🌟</p>
            <p className="mt-3 font-body text-sm text-ink/70">
              Our team of playful humans will reply within two business days.
            </p>
          </div>
        ) : (
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="font-body text-sm text-ink/70">
                Grown-up name
                <input
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 font-body text-sm text-ink outline-none transition focus:border-lagoon focus:bg-white"
                  required
                />
              </label>
              <label className="font-body text-sm text-ink/70">
                Email
                <input
                  type="email"
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 font-body text-sm text-ink outline-none transition focus:border-lagoon focus:bg-white"
                  required
                />
              </label>
            </div>
            <label className="font-body text-sm text-ink/70">
              How can we help?
              <textarea
                rows={4}
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 font-body text-sm text-ink outline-none transition focus:border-lagoon focus:bg-white"
                required
              />
            </label>
            <button
              type="submit"
              className="rounded-2xl bg-lagoon px-6 py-3 font-body text-sm font-semibold text-white shadow-float transition hover:-translate-y-1"
            >
              Send message
            </button>
            <p className="font-body text-xs text-ink/50">
              Prefer email? Reach us at{' '}
              <a href="mailto:hello@gamesincjr.com" className="text-lagoon underline">
                hello@gamesincjr.com
              </a>
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
