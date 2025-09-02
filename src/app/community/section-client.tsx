"use client";

import { useEffect, useState } from 'react';

type Message = { id: string; name: string; text: string; ts: number };

export default function CommunityClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('gi_feedback');
    if (raw) setMessages(JSON.parse(raw));
  }, []);

  function save(list: Message[]) {
    setMessages(list);
    localStorage.setItem('gi_feedback', JSON.stringify(list.slice(-100)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const entry: Message = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Anon',
      text: text.trim(),
      ts: Date.now(),
    };
    save([...messages, entry]);
    setText('');
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow">
      <h1 className="pixel-text text-4xl text-gray-900 mb-4">Community</h1>
      <p className="modern-text text-gray-700 mb-6">Share ideas, feedback and discuss upcoming games.</p>

      <form onSubmit={submit} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex gap-3 mb-3">
          <input className="flex-1 border rounded px-3 py-2" placeholder="Your name (optional)" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <textarea className="w-full border rounded px-3 py-2 mb-3" placeholder="Write a comment or suggestion…" value={text} onChange={e=>setText(e.target.value)} />
        <button className="gaming-btn" type="submit">Post</button>
      </form>

      <h2 className="heading-text text-2xl text-gray-900 mb-3">Feedback & Discussions</h2>
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="text-gray-500 modern-text">No posts yet. Be the first!</div>
        )}
        {messages.slice().reverse().map(m => (
          <div key={m.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-800">{m.name}</div>
              <div className="text-xs text-gray-500">{new Date(m.ts).toLocaleString()}</div>
            </div>
            <p className="modern-text text-gray-700 whitespace-pre-line">{m.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


