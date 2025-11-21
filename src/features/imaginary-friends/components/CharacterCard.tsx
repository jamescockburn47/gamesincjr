import Image from 'next/image';
import type { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onClick: () => void;
}

export default function CharacterCard({ character, isSelected, onClick }: CharacterCardProps) {
  // Vibrant gradient backgrounds for each character
  const gradientMap: Record<string, string> = {
    luna: 'from-indigo-500/20 via-purple-500/20 to-pink-500/20',
    shadow: 'from-slate-700/20 via-gray-800/20 to-black/20',
    oak: 'from-emerald-500/20 via-green-600/20 to-teal-500/20',
    spark: 'from-yellow-400/20 via-orange-500/20 to-red-500/20',
    coral: 'from-cyan-400/20 via-blue-500/20 to-indigo-500/20',
    ember: 'from-orange-500/20 via-red-500/20 to-pink-500/20',
  };

  const gradient = gradientMap[character.id] || 'from-primary/20 via-purple-500/20 to-pink-500/20';

  return (
    <button
      type="button"
      className={`group relative flex flex-col overflow-hidden rounded-3xl p-1.5 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${isSelected
          ? 'ring-4 ring-primary/60 scale-[1.03] shadow-xl'
          : 'hover:ring-2 hover:ring-primary/30'
        }`}
      onClick={onClick}
    >
      {/* Glassmorphism background with gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} backdrop-blur-xl transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'
        }`} />

      {/* White overlay for glassmorphism effect */}
      <div className={`absolute inset-0 bg-white/60 backdrop-blur-md transition-colors ${isSelected ? 'bg-white/70' : 'group-hover:bg-white/65'
        }`} />

      <div className="relative z-10 flex h-full flex-col p-6">
        {/* Larger avatar section */}
        <div className="mb-5 flex flex-col items-center gap-3">
          <div className={`relative h-32 w-32 shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} shadow-lg ring-4 ring-white/50 transition-all duration-300 ${isSelected ? 'scale-110 shadow-2xl' : 'group-hover:scale-105 group-hover:shadow-xl'
            }`}>
            {character.avatarUrl?.startsWith('/') ? (
              <Image
                src={character.avatarUrl}
                alt={character.name}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">
                {character.avatarUrl || '🙂'}
              </div>
            )}
          </div>

          {/* Character name and mood */}
          <div className="text-center">
            <h3 className="font-black text-slate-900 text-xl mb-1 tracking-tight">{character.name}</h3>
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
              <span className={`inline-block h-2.5 w-2.5 rounded-full shadow-sm ${character.currentMood === 'happy' ? 'bg-green-500' :
                  character.currentMood === 'excited' ? 'bg-amber-500' :
                    character.currentMood === 'sad' ? 'bg-blue-500' :
                      'bg-purple-500'
                }`} />
              <span className="capitalize">{character.currentMood}</span>
            </div>
          </div>
        </div>

        {/* Personality description */}
        <p className="mb-5 text-sm leading-relaxed text-slate-700 line-clamp-3 text-center font-medium">
          {character.personality}
        </p>

        {/* Friendship progress */}
        <div className="mt-auto space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span>Friendship</span>
            <span className="text-primary">{character.relationshipLevel}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/80 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 transition-all duration-500 shadow-sm"
              style={{ width: `${Math.max(0, Math.min(100, character.relationshipLevel))}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

