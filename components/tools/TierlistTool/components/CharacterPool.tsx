import React from 'react';
import { Lang, Character } from '../../../../types';
import { DragContext, Team } from '../types';
import { translations } from '../../../../constants';
import { Trash2 } from 'lucide-react';

interface CharacterPoolProps {
  lang: Lang;
  chars: Character[];
  allChars: Character[];
  teams: Team[];
  dragRef: React.RefObject<DragContext | null>;
  onDrop: () => void;
  onDeleteTeam: (teamId: string) => void;
}

export const CharacterPool: React.FC<CharacterPoolProps> = ({
  lang, chars, allChars, teams, dragRef, onDrop, onDeleteTeam,
}) => {
  const t = translations[lang].tools.tierlist;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop();
  };

  return (
    <div className="border-t-2 border-gray-700 bg-black/40">
      {/* Teams section */}
      {teams.length > 0 && (
        <div className="border-b border-gray-800">
          <div className="px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-tech font-bold text-gray-400 uppercase tracking-widest">{t.teams}</span>
            <span className="text-xs font-mono text-gray-600">({teams.length})</span>
          </div>
          <div className="flex flex-wrap gap-2 px-3 pb-3">
            {teams.map((team) => {
              const teamChars = team.charIds
                .map((id) => allChars.find((c) => c.id === id))
                .filter(Boolean) as Character[];
              return (
                <div
                  key={team.id}
                  draggable
                  onDragStart={() => {
                    dragRef.current = { source: 'team', teamId: team.id };
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 bg-gray-800 border border-gray-700 hover:border-ghoul-red/60 cursor-grab active:cursor-grabbing transition-colors group"
                >
                  {/* Team name */}
                  <span className="text-xs font-tech text-gray-300 whitespace-nowrap max-w-[80px] truncate">
                    {team.name}
                  </span>
                  {/* Char chips */}
                  <div className="flex gap-0.5">
                    {teamChars.slice(0, 6).map((char) => (
                      <div key={char.id} className="relative w-8 h-8 flex-shrink-0">
                        <img src={`/assets/heroes/bg/TYJS_bg_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover" alt="" />
                        <img src={`/assets/heroes/head/${char.id}_head.png`} className="absolute inset-0 w-full h-full object-cover" alt={char.name} />
                        <img src={`/assets/heroes/frame/TYJS_frame_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="" />
                      </div>
                    ))}
                    {teamChars.length > 6 && (
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-700 text-xs font-mono text-gray-400">
                        +{teamChars.length - 6}
                      </div>
                    )}
                  </div>
                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTeam(team.id); }}
                    title={t.deleteTeam}
                    className="p-0.5 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unranked pool */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-800">
        <span className="text-xs font-tech font-bold text-gray-400 uppercase tracking-widest">{t.unranked}</span>
        <span className="text-xs font-mono text-gray-600">({chars.length})</span>
      </div>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex flex-wrap gap-1.5 p-3 min-h-[100px]"
      >
        {chars.map((char) => (
          <div
            key={char.id}
            draggable
            title={char.name}
            onDragStart={() => {
              dragRef.current = { charId: char.id, source: 'pool' };
            }}
            className="relative w-[68px] h-[68px] cursor-grab active:cursor-grabbing flex-shrink-0 hover:scale-105 transition-transform"
          >
            <img src={`/assets/heroes/bg/TYJS_bg_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover" alt="" draggable={false} />
            <img src={`/assets/heroes/head/${char.id}_head.png`} className="absolute inset-0 w-full h-full object-cover" alt={char.name} draggable={false} />
            <img src={`/assets/heroes/frame/TYJS_frame_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="" draggable={false} />
          </div>
        ))}
        {chars.length === 0 && (
          <div className="flex items-center justify-center w-full text-xs font-tech text-gray-600 select-none">
            — all characters ranked —
          </div>
        )}
      </div>
    </div>
  );
};
