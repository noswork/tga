import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lang, Cell } from '../types';
import { Database, X, Zap, Shield, Heart } from 'lucide-react';
import cellsData from '../gamedata/cells.json';

interface CellGalleryProps {
  lang: Lang;
  onSwitchToChars: () => void;
}

type RarityFilter = 'ALL' | 1 | 2 | 3 | 4 | 5 | 6;

const RARITY_LABEL: Record<number, string> = { 6: 'VI', 5: 'V', 4: 'IV', 3: 'III', 2: 'II', 1: 'I' };

const RARITY_COLOR: Record<number, string> = {
  6: 'text-yellow-400 border-yellow-400',
  5: 'text-pink-400 border-pink-400',
  4: 'text-purple-400 border-purple-400',
  3: 'text-blue-400 border-blue-400',
  2: 'text-green-400 border-green-400',
  1: 'text-gray-400 border-gray-400',
};

const STAT_ICON: Record<string, React.ReactNode> = {
  Atk: <Zap size={11} className="text-red-400" />,
  Def: <Shield size={11} className="text-blue-400" />,
  Hp:  <Heart size={11} className="text-green-400" />,
};

const STAT_COLOR: Record<string, string> = {
  Atk: 'text-red-400',
  Def: 'text-blue-400',
  Hp:  'text-green-400',
};

const TITLE: Record<Lang, string> = { en: 'RC CELLS', zh: 'RC 細胞' };
const SUBTITLE: Record<Lang, string> = { en: 'CELL DATABASE', zh: 'RC 細胞資料庫' };
const SWITCH_BTN: Record<Lang, string> = { en: '← CHARACTERS', zh: '← 角色' };
const FILTER_ALL: Record<Lang, string> = { en: 'ALL', zh: '全部' };
const UNIQUE_SKILL: Record<Lang, string> = { en: 'UNIQUE SKILL', zh: '專屬技能' };

type Segment = { text: string; isEffect: boolean };

const SkillText: React.FC<{ segments: Segment[] }> = ({ segments }) => (
  <span>
    {segments.map((seg, i) =>
      seg.isEffect
        ? <span key={i} className="text-red-400 font-semibold">{seg.text}</span>
        : <span key={i}>{seg.text}</span>
    )}
  </span>
);

const EffectDefs: React.FC<{ defs: Record<string, string> }> = ({ defs }) => {
  const entries = Object.entries(defs);
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {entries.map(([name, desc]) => (
        <p key={name} className="text-red-400 text-xs italic leading-snug">＊{name}：{desc}</p>
      ))}
    </div>
  );
};

const CellCard: React.FC<{ cell: Cell; onClick: () => void }> = ({ cell, onClick }) => (
  <button
    onClick={onClick}
    className="relative flex flex-col items-center w-full appearance-none border-0 p-0 hover:scale-105 transition-transform duration-200 [background:transparent]"
  >
    <div className="relative w-full aspect-square">
      <img
        src={`/assets/cells-icon/${cell.imgFile}`}
        alt={cell.name}
        className="w-full h-full object-contain"
        onError={e => (e.currentTarget.style.opacity = '0.3')}
      />
      <div className={`absolute top-0.5 right-0.5 text-[7px] font-bold border px-0.5 rounded bg-black/70 ${RARITY_COLOR[cell.rarity]}`}>
        {RARITY_LABEL[cell.rarity]}
      </div>
    </div>
    <div className="w-full px-0.5 pb-1">
      <p className="text-[11px] leading-tight text-center truncate font-semibold text-gray-800 dark:text-white">{cell.name}</p>
    </div>
  </button>
);

const CellModal: React.FC<{ cell: Cell; lang: Lang; onClose: () => void }> = ({ cell, lang, onClose }) => (
  createPortal(
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="fixed inset-x-0 top-0 z-50 pointer-events-none" style={{ height: '96px', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center md:items-center md:px-4" style={{ top: '96px' }}>
        <div
          className="relative w-full max-w-lg flex flex-col shadow-2xl bg-white dark:bg-[#1a1c23] rounded-t-xl md:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden md:mb-4"
          style={{ maxHeight: 'calc(100vh - 96px - 16px)' }}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-gray-50 dark:bg-[#111318] border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
            <img
              src={`/assets/cells-icon/${cell.imgFile}`}
              alt={cell.name}
              className="w-14 h-14 object-contain flex-shrink-0"
              onError={e => (e.currentTarget.style.opacity = '0.3')}
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-gray-900 dark:text-white font-bold text-base leading-tight">{cell.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-bold border px-1.5 rounded ${RARITY_COLOR[cell.rarity]}`}>{RARITY_LABEL[cell.rarity]}</span>
                <span className={`flex items-center gap-1 text-xs font-bold ${STAT_COLOR[cell.statType]}`}>
                  {STAT_ICON[cell.statType]} {cell.statType}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-2 rounded hover:bg-white/5">
              <X size={22} strokeWidth={2.5} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3">
            <div className="bg-gray-100 dark:bg-[#22252e] border border-gray-200 dark:border-gray-700 rounded p-3">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{cell.description}</p>
            </div>
            {cell.uniqueSkillSegments && (
              <div className="bg-gray-100 dark:bg-[#22252e] border border-yellow-400/50 dark:border-yellow-700/50 rounded p-3">
                <p className="text-yellow-600 dark:text-yellow-400 text-xs font-bold mb-1 tracking-wider">{UNIQUE_SKILL[lang]}</p>
                {cell.uniqueSkillName && (
                  <p className="text-gray-900 dark:text-white font-semibold text-sm mb-2">{cell.uniqueSkillName}</p>
                )}
                <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
                  <SkillText segments={cell.uniqueSkillSegments} />
                </p>
                {cell.effectDefs && <EffectDefs defs={cell.effectDefs} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
);

export const CellGallery: React.FC<CellGalleryProps> = ({ lang, onSwitchToChars }) => {
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('ALL');
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);

  const cells = cellsData as Cell[];
  const rarityFilters: RarityFilter[] = ['ALL', 6, 5, 4, 3, 2, 1];
  const filtered = cells.filter(c => rarityFilter === 'ALL' || c.rarity === rarityFilter);

  return (
    <>
      {selectedCell && <CellModal cell={selectedCell} lang={lang} onClose={() => setSelectedCell(null)} />}

      <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-700">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-300 dark:border-ghoul-red/30 pb-6">
          <div>
            <h2 className="text-4xl font-serif font-bold text-black dark:text-white tracking-widest mb-2 flex items-center gap-3">
              <Database className="text-ghoul-red" /> {TITLE[lang]}
            </h2>
            <div className="text-xs font-tech text-gray-500 tracking-[0.3em]">{SUBTITLE[lang]}</div>
            <div className="text-xs text-gray-400 mt-1">Data credit: <a href="https://twitter.com/kevinchatmajo1" target="_blank" rel="noopener noreferrer" className="text-ghoul-red hover:underline">@kevinchatmajo1</a></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-tech text-gray-400">{filtered.length} / {cells.length} {lang === 'zh' ? '細胞' : 'CELLS'}</div>
            <button onClick={onSwitchToChars} className="px-3 py-1.5 text-xs font-tech font-bold border border-gray-600 text-gray-400 hover:border-gray-300 hover:text-white transition-all rounded-sm uppercase tracking-wider">
              {SWITCH_BTN[lang]}
            </button>
          </div>
        </div>

        {/* Rarity Filter */}
        <div className="mb-5 flex flex-wrap gap-2">
          {rarityFilters.map(r => (
            <button
              key={String(r)}
              onClick={() => setRarityFilter(r)}
              className={`px-4 py-1.5 text-xs font-tech font-bold border uppercase tracking-wider transition-all rounded-sm ${
                rarityFilter === r
                  ? r === 'ALL' ? 'bg-ghoul-red border-ghoul-red text-white' : `${RARITY_COLOR[r as number]} bg-black/40`
                  : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-400 hover:text-gray-300'
              }`}
            >
              {r === 'ALL' ? FILTER_ALL[lang] : RARITY_LABEL[r as number]}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-gray-700 rounded-lg">
            <Database size={48} className="text-gray-700 mb-4" />
            <p className="text-gray-500 font-tech tracking-widest text-sm">NO CELLS FOUND</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4 px-2">
            {filtered.map((cell, i) => (
              <CellCard key={`${cell.id}-${i}`} cell={cell} onClick={() => setSelectedCell(cell)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
