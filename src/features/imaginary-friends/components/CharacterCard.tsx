import type { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onClick: () => void;
}

export default function CharacterCard({ character, isSelected, onClick }: CharacterCardProps) {
  return (
    <button
      type="button"
      className={`character-card ${isSelected ? 'character-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="character-avatar" aria-hidden>{character.avatarUrl ?? '🙂'}</div>
      <div className="character-info">
        <h3 className="character-name">{character.name}</h3>
        <p className="character-type">{character.personality}</p>
        <div className="character-mood">
          Mood:&nbsp;
          <span className={`character-mood-chip mood-${character.currentMood}`}>
            {character.currentMood}
          </span>
        </div>
        <div className="character-relationship">
          Friendship level
          <div className="relationship-bar">
            <div
              className="relationship-bar__fill"
              style={{ width: `${Math.max(0, Math.min(100, character.relationshipLevel))}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

