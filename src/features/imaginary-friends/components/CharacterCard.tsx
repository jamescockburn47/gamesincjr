import Image from 'next/image';
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
      className={`group relative flex flex-col overflow-hidden rounded-3xl p-1 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isSelected
          ? 'ring-4 ring-primary/50 scale-[1.02]'
          : 'hover:ring-2 hover:ring-primary/20'
        }`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-white/80 backdrop-blur-md transition-colors ${isSelected ? 'bg-white/95' : 'group-hover:bg-white/90'}`} />

      <div className="relative z-10 flex h-full flex-col p-5">
        <div className="mb-4 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-2 ring-white">
            {character.avatarUrl?.startsWith('/') ? (
              <Image
                src={character.avatarUrl}
                alt={character.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">
                {character.avatarUrl || '🙂'}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{character.name}</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className={`inline-block h-2 w-2 rounded-full ${character.currentMood === 'happy' ? 'bg-green-500' :
                  character.currentMood === 'excited' ? 'bg-amber-500' :
                    character.currentMood === 'sad' ? 'bg-blue-500' :
                      'bg-purple-500'
                }`} />
              <span className="capitalize">{character.currentMood}</span>
            </div>
          </div>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-slate-600 line-clamp-3">
          {character.personality}
        </p>

        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Friendship</span>
            <span>{character.relationshipLevel}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, character.relationshipLevel))}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

