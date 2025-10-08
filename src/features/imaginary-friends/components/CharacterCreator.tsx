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
    <div className="cc-overlay">
      <div className="cc-modal">
        <h3>Create a New Friend</h3>
        {!canCreate && (
          <div className="cc-blocked">{blockedReason ?? 'You can create a new friend next week.'}</div>
        )}
        <form onSubmit={handleSubmit} className="cc-form">
          <label className="cc-label">
            Name
            <input
              className="cc-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={24}
              required
            />
          </label>
          <label className="cc-label">
            Avatar Emoji
            <input
              className="cc-input"
              value={avatar}
              onChange={(event) => setAvatar(event.target.value)}
              maxLength={4}
              title="Emoji shown on the character card"
            />
          </label>
          <div className="cc-actions" style={{ justifyContent: 'flex-start' }}>
            <button
              type="button"
              className="cc-secondary"
              disabled={isGenerating || !name.trim() || !appearance.trim()}
              onClick={generateAvatar}
            >
              {isGenerating ? 'Generating…' : 'Generate Avatar'}
            </button>
            {avatarUrl && <span style={{ fontSize: 12, color: '#555' }}>Avatar ready ✓</span>}
          </div>
          <label className="cc-label">
            Personality (how they speak/act)
            <textarea
              className="cc-textarea"
              value={personality}
              onChange={(event) => setPersonality(event.target.value)}
              rows={2}
              required
            />
          </label>
          <label className="cc-label">
            Appearance (how they look)
            <textarea
              className="cc-textarea"
              value={appearance}
              onChange={(event) => setAppearance(event.target.value)}
              rows={2}
              required
            />
          </label>
          <label className="cc-label">
            Image Style (for picture generation)
            <input
              className="cc-input"
              value={imageStyle}
              onChange={(event) => setImageStyle(event.target.value)}
            />
          </label>
          <label className="cc-label">
            Favourite Topics (comma-separated)
            <input
              className="cc-input"
              value={favoriteTopics}
              onChange={(event) => setFavoriteTopics(event.target.value)}
            />
          </label>

          <div className="cc-actions">
            <button type="button" onClick={onClose} className="cc-secondary">
              Cancel
            </button>
            <button type="submit" disabled={!canCreate} className="cc-primary">
              Create Friend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

