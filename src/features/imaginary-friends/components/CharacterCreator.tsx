import { useEffect, useState } from 'react';
import type { Character } from '../types';

interface CharacterCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (character: Character) => void;
  canCreate: boolean;
  blockedReason?: string;
  apiBaseUrl: string;
}

export default function CharacterCreator({
  isOpen,
  onClose,
  onCreate,
  canCreate,
  blockedReason,
  apiBaseUrl,
}: CharacterCreatorProps) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🧚');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [personality, setPersonality] = useState('');
  const [appearance, setAppearance] = useState('');
  const [imageStyle, setImageStyle] = useState('soft watercolor, cozy, friendly');
  const [favoriteTopics, setFavoriteTopics] = useState('adventures, stories, art');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setAvatar('🧚');
      setPersonality('');
      setAppearance('');
      setImageStyle('soft watercolor, cozy, friendly');
      setFavoriteTopics('adventures, stories, art');
      setAvatarUrl(null);
      setIsGenerating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) return;
    if (!name.trim() || !personality.trim() || !appearance.trim()) return;

    const now = Date.now();
    const newCharacter: Character = {
      id: `custom-${now}`,
      name: name.trim(),
      type: 'friend',
      personality: personality.trim(),
      appearance: appearance.trim(),
      currentMood: 'happy',
      relationshipLevel: 10,
      favoriteTopics: favoriteTopics
        .split(',')
        .map((topic) => topic.trim())
        .filter(Boolean),
      avatarUrl: avatarUrl ?? avatar ?? '🙂',
    };

    onCreate(newCharacter);
  };

  const generateAvatar = async () => {
    if (!name.trim() || !appearance.trim()) return;
    try {
      setIsGenerating(true);
      const response = await fetch(`${apiBaseUrl}/generate-avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, appearance, imageStyle, emoji: avatar }),
      });
      if (!response.ok) throw new Error('Failed to generate avatar');
      const data = (await response.json()) as { avatarUrl?: string };
      if (data.avatarUrl) {
        setAvatarUrl(data.avatarUrl);
      }
    } catch (error) {
      console.error('Avatar generation failed', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 max-h-[90vh] flex flex-col">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h3 className="text-xl font-bold text-slate-900">Create a New Friend</h3>
          <p className="mt-1 text-sm text-slate-500">Design a unique companion to chat with.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!canCreate && (
            <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
              {blockedReason ?? 'You can create a new friend next week.'}
            </div>
          )}

          <form id="creator-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Name
              </label>
              <input
                className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={24}
                required
                placeholder="e.g. Sparkle"
              />
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  Avatar Emoji
                </label>
                <input
                  className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  value={avatar}
                  onChange={(event) => setAvatar(event.target.value)}
                  maxLength={4}
                  title="Emoji shown on the character card"
                  placeholder="🧚"
                />
              </div>
              <button
                type="button"
                className="mb-0.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-primary disabled:opacity-50"
                disabled={isGenerating || !name.trim() || !appearance.trim()}
                onClick={generateAvatar}
              >
                {isGenerating ? 'Generating…' : 'Generate Art'}
              </button>
            </div>

            {avatarUrl && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 ring-1 ring-green-200">
                <span>✓</span> Custom avatar generated successfully!
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Personality
                <span className="ml-1 font-normal text-slate-400">(how they speak/act)</span>
              </label>
              <textarea
                className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                value={personality}
                onChange={(event) => setPersonality(event.target.value)}
                rows={2}
                required
                placeholder="Friendly, curious, loves to tell jokes..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Appearance
                <span className="ml-1 font-normal text-slate-400">(how they look)</span>
              </label>
              <textarea
                className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                value={appearance}
                onChange={(event) => setAppearance(event.target.value)}
                rows={2}
                required
                placeholder="A small blue dragon with glittery wings..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Image Style
                <span className="ml-1 font-normal text-slate-400">(for picture generation)</span>
              </label>
              <input
                className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                value={imageStyle}
                onChange={(event) => setImageStyle(event.target.value)}
                placeholder="soft watercolor, cozy, friendly"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Favourite Topics
                <span className="ml-1 font-normal text-slate-400">(comma-separated)</span>
              </label>
              <input
                className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                value={favoriteTopics}
                onChange={(event) => setFavoriteTopics(event.target.value)}
                placeholder="adventures, stories, art"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="creator-form"
            disabled={!canCreate}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            Create Friend
          </button>
        </div>
      </div>
    </div>
  );
}
