"use client";

import { useCallback, useEffect, useState } from "react";

type Message = { id: string; name: string; text: string; ts: number };

export interface CommunityCopy {
  intro?: string;
  displayNameLabel: string;
  displayNamePlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  emptyState: string;
  postButton: string;
  posting: string;
  errorEmpty: string;
  errorRefresh: string;
  errorSubmit: string;
  characterHint: string;
}

const defaultCopy: CommunityCopy = {
  intro: "Share ideas, feedback and discuss upcoming games.",
  displayNameLabel: "Display name (optional)",
  displayNamePlaceholder: "e.g. SuperCoder",
  messageLabel: "Message",
  messagePlaceholder: "Share feedback, a bug report or a celebratory moment.",
  emptyState: "No notes yet—why not start the conversation?",
  postButton: "Post message",
  posting: "Posting…",
  errorEmpty: "Write a quick message before posting.",
  errorRefresh: "We couldn’t refresh the feed. We’ll retry automatically.",
  errorSubmit: "We couldn’t post your note. Please try again.",
  characterHint: "We trim posts to 500 characters to keep the feed easy to skim.",
};

interface CommunityClientProps {
  copy?: Partial<CommunityCopy>;
}

export default function CommunityClient({ copy }: CommunityClientProps = {}) {
  const text = { ...defaultCopy, ...copy } satisfies CommunityCopy;
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [textValue, setTextValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/community/list", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load messages: ${res.status}`);
      }
      const data = await res.json();
      setMessages(Array.isArray(data.items) ? data.items : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(text.errorRefresh);
    }
  }, [text.errorRefresh]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = textValue.trim();
    if (!trimmed) {
      setError(text.errorEmpty);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim().slice(0, 80), text: trimmed.slice(0, 500) }),
      });
      if (!res.ok) {
        throw new Error(`Failed to post message: ${res.status}`);
      }
      setTextValue("");
      setError(null);
      await refresh();
    } catch (err) {
      console.error(err);
      setError(text.errorSubmit);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
        {text.intro && (
          <p className="mb-6 text-sm leading-6 text-slate-600">{text.intro}</p>
        )}
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="community-name">
              {text.displayNameLabel}
            </label>
            <input
              id="community-name"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder={text.displayNamePlaceholder}
              value={name}
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="community-message">
              {text.messageLabel}
            </label>
            <textarea
              id="community-message"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm leading-6 text-slate-700 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder={text.messagePlaceholder}
              rows={4}
              maxLength={800}
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
            />
            <p className="mt-2 text-xs text-slate-500">{text.characterHint}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-500/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? text.posting : text.postButton}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-100">
        <h2 className="text-xl font-semibold text-slate-900">Recent posts</h2>
        <div className="mt-6 space-y-4">
          {messages.length === 0 && !error && (
            <p className="rounded-2xl bg-slate-50/80 px-4 py-6 text-sm text-slate-500">
              {text.emptyState}
            </p>
          )}
          {messages
            .slice()
            .reverse()
            .map((message) => (
              <article
                key={message.id}
                className="rounded-2xl bg-slate-50/80 p-5 shadow-inner ring-1 ring-slate-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-800">{message.name || "Anonymous"}</span>
                  <time className="text-xs text-slate-500">
                    {new Date(message.ts).toLocaleString()}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{message.text}</p>
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}
