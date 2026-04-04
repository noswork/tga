import React, { useState } from 'react';
import { Lang, Character } from '../../../../types';
import { Team, FilterState } from '../types';
import { translations } from '../../../../constants';
import { generateId } from '../utils';
import { FilterBar } from './FilterBar';
import { X, Check } from 'lucide-react';

function applyFilter(chars: Character[], filter: FilterState): Character[] {
  if (filter.category === 'ALL') return chars;
  return chars.filter((c) => {
    switch (filter.category) {
      case 'organization': return c.organization === filter.value;
      case 'attribute': return c.attribute === filter.value;
      case 'rarity': return c.rarity === filter.value;
      case 'tactic': return c.tactic === filter.value;
      default: return true;
    }
  });
}

interface TeamBuilderProps {
  lang: Lang;
  allChars: Character[];
  onSave: (team: Team) => void;
  onCancel: () => void;
}

export const TeamBuilder: React.FC<TeamBuilderProps> = ({ lang, allChars, onSave, onCancel }) => {
  const t = translations[lang].tools.tierlist;
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterState, setFilterState] = useState<FilterState>({ category: 'ALL', value: 'ALL' });

  const filteredChars = applyFilter(allChars, filterState);

  const toggleChar = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (selectedIds.length === 0) return;
    onSave({
      id: generateId(),
      name: name.trim() || `陣容`,
      charIds: selectedIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <h3 className="text-sm font-tech font-bold text-white tracking-widest uppercase flex-1">{t.addTeam}</h3>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Team name + selected count */}
        <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-tech text-gray-400 uppercase tracking-wider">{t.teamName}:</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.teamNamePlaceholder}
            className="flex-1 px-2 py-1 text-sm font-tech bg-gray-800 border border-gray-600 text-white focus:border-ghoul-red focus:outline-none"
          />
          <span className="text-xs font-mono text-gray-500 flex-shrink-0">{t.selectedCount}: {selectedIds.length}</span>
        </div>

        {/* Selected preview */}
        {selectedIds.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-800 flex flex-wrap gap-1 bg-black/30 flex-shrink-0">
            {selectedIds.map((id) => {
              const char = allChars.find((c) => c.id === id);
              if (!char) return null;
              return (
                <div
                  key={id}
                  onClick={() => toggleChar(id)}
                  title={char.name}
                  className="relative w-10 h-10 cursor-pointer hover:scale-105 transition-transform"
                >
                  <img src={`/assets/heroes/bg/TYJS_bg_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover" alt="" />
                  <img src={`/assets/heroes/head/${char.id}_head.png`} className="absolute inset-0 w-full h-full object-cover" alt={char.name} />
                  <img src={`/assets/heroes/frame/TYJS_frame_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <X size={10} className="text-white" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filter */}
        <div className="flex-shrink-0">
          <FilterBar lang={lang} filterState={filterState} onChange={setFilterState} />
        </div>

        {/* Character grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-wrap gap-1.5">
            {filteredChars.map((char) => {
              const isSelected = selectedIds.includes(char.id);
              return (
                <div
                  key={char.id}
                  onClick={() => toggleChar(char.id)}
                  title={char.name}
                  className={`relative w-[60px] h-[60px] cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-ghoul-red scale-105' : 'opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img src={`/assets/heroes/bg/TYJS_bg_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover" alt="" />
                  <img src={`/assets/heroes/head/${char.id}_head.png`} className="absolute inset-0 w-full h-full object-cover" alt={char.name} />
                  <img src={`/assets/heroes/frame/TYJS_frame_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="" />
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-4 h-4 bg-ghoul-red flex items-center justify-center">
                      <Check size={9} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-tech font-bold border border-gray-600 text-gray-300 hover:border-gray-400 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={selectedIds.length === 0}
            className="px-4 py-1.5 text-xs font-tech font-bold bg-ghoul-red text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            {t.confirmTeam} ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};
