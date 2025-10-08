'use client';

import { useCallback, useState } from 'react';

type CharacterId = 'luna' | 'shadow' | 'oak' | 'spark' | 'coral' | 'ember';

interface CharacterCard {
  id: CharacterId;
  name: string;
  emoji: string;
  tagline: string;
  blurb: string;
}

interface ChatMessage {
  id: string;
  role: 'player' | 'character';
  text: string;
  mode: 'chat' | 'story';
}

const CHARACTERS: CharacterCard[] = [
  {
    id: 'luna',
    name: 'Luna the Owl',
    emoji: '🦉',
    tagline: 'Starry-night scientist',
    blurb: 'Luna shares curious facts about the sky and whispers gentle encouragement.',
  },
  {
    id: 'shadow',
    name: 'Shadow the Cat',
    emoji: '🐱',
    tagline: 'Playful mystery guide',
    blurb: 'Shadow loves hide-and-seek riddles and adventurous secret paths.',
  },
  {
    id: 'oak',
    name: 'Oak the Deer',
    emoji: '🦌',
    tagline: 'Forest storyteller',
    blurb: 'Oak speaks slowly about seasons, kindness, and the wisdom of trees.',
  },
  {
    id: 'spark',
    name: 'Spark the Hummingbird',
    emoji: '🐦',
    tagline: 'Creativity coach',
    blurb: 'Spark brings exciting ideas, bright colours, and cheerful encouragement.',
  },
  {
    id: 'coral',
    name: 'Coral the Dolphin',
    emoji: '🐬',
    tagline: 'Ocean explorer',
    blurb: 'Coral swims through coral reefs and loves sharing sea-life wonders.',
  },
  {
    id: 'ember',
    name: 'Ember the Fox',
    emoji: '🦊',
    tagline: 'Cozy fireside friend',
    blurb: 'Ember keeps things snug with fireplace tales about friendship and comfort.',
  },
];

const STORY_HINT =
  'Tip: ask for a bedtime story or say "once upon a time" and your friend will switch to story mode!';

export default function AIGamesPage() {
  const [selected, setSelected] = useState<CharacterCard | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetChat = useCallback((character: CharacterCard) => {
    setSelected(character);
    setMessages([
      {
        id: `intro-${Date.now()}`,
        role: 'character',
        mode: 'chat',
        text: `Hi there! I'm ${character.name}. What would you like to imagine together today?`,
      },
    ]);
    setInput('');
    setError(null);
  }, []);

  const handleSend = useCallback(async () => {
    if (!selected) {
      setError('Pick a friend to start chatting.');
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) return;

    const messageId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: messageId, role: 'player', text: trimmed, mode: 'chat' },
    ]);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-games/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: selected.id, message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setMessages((prev) => [
        ...prev.map((msg) =>
          msg.id === messageId ? { ...msg, mode: data.mode ?? 'chat' } : msg,
        ),
        {
          id: `assistant-${Date.now()}`,
          role: 'character',
          text: data.response ?? "I'm still thinking—let's try another question!",
          mode: data.mode ?? 'chat',
        },
      ]);
    } catch (err) {
      console.error(err);
      setError('The imagination link flickered out—let’s try again.');
    } finally {
      setIsSending(false);
    }
  }, [input, selected]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-rose-50 pb-16">
      <section className="mx-auto w-full max-w-5xl px-4 pt-16 lg:pt-20">
        <header className="text-center">
          <span className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
            New – AI Friends
          </span>
          <h1 className="mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">
            Pick a friend and start imagining together
          </h1>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Each companion has a unique personality and gentle guardrails that keep conversations kid-friendly.
          </p>
          <p className="mt-2 text-sm text-slate-500">{STORY_HINT}</p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {CHARACTERS.map((character) => {
            const isActive = selected?.id === character.id;
            return (
              <button
                key={character.id}
                type="button"
                className={`rounded-3xl border px-6 py-6 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                  isActive
                    ? 'border-sky-400 bg-white shadow-xl'
                    : 'border-slate-200 bg-white/90 shadow'
                }`}
                onClick={() => resetChat(character)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{character.emoji}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{character.name}</h2>
                    <p className="text-sm font-medium text-sky-600">{character.tagline}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">{character.blurb}</p>
              </button>
            );
          })}
        </div>

        {selected ? (
          <section className="mt-12 rounded-3xl border border-slate-200 bg-white/95 shadow-xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-2xl font-semibold text-slate-900">
                Chat with {selected.name}
              </h2>
              <p className="text-sm text-slate-500">
                Ask questions, share ideas, or request a story—{selected.emoji} is ready to play.
              </p>
            </div>

            <div className="flex flex-col gap-4 px-6 py-6">
              <div className="max-h-[420px] space-y-4 overflow-y-auto pr-2">
                {messages.map((message) => {
                  const isPlayer = message.role === 'player';
                  const bubbleClasses = isPlayer
                    ? 'bg-sky-500 text-white rounded-2xl rounded-br-sm'
                    : message.mode === 'story'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl rounded-bl-sm'
                    : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl rounded-bl-sm';

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isPlayer ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${bubbleClasses}`}>
                        {message.text}
                      </div>
                    </div>
                  );
                })}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm text-slate-500">
                      {selected.emoji} is thinking...
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <textarea
                  className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder={`Say hello to ${selected.name}...`}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">{STORY_HINT}</span>
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={isSending}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSending ? 'Sending...' : `Chat with ${selected.name.split(' ')[0]}`}
                  </button>
                </div>
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-slate-600">
            Select a friend above to begin your imaginative AI game.
          </section>
        )}
      </section>
    </main>
  );
}

