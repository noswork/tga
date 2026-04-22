import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lang, Character, ActiveSkill, PassiveSkill, EffectSegment, Cell } from '../types';
import { translations, charactersData } from '../constants';
import { Shield, Sword, Database, X, Flame, Sparkles, Star, LayoutGrid, Trophy } from 'lucide-react';
import cellsData from '../gamedata/cells.json';
import { calcBaseCp, calcCellCp3x, calcCellCp4x } from '../utils/cpCalc';

interface CharacterGalleryProps {
  lang: Lang;
  onSwitchToCells: () => void;
  initialCharId?: string | null;
  onClearInitialChar?: () => void;
  onOpenCell: (cellId: string) => void;
}

type FilterCategory = 'ALL' | 'No Organization' | 'CCG Higher Rank Investigator' | 'CCG Lower Rank Investigator' | 'Aogiri Tree' | 'Anteiku';
type RarityFilter = 'ALL' | 'SP' | 'SSR' | 'SR' | 'R';
type SkillTab = 'active' | 'passive' | 'talent';
type ViewMode = 'grid' | 'rank';
type RankMetric = 'baseCp' | 'arenaCP' | 'cellCp3x' | 'cellCp4x' | 'atk' | 'def' | 'hp';

const RANK_METRICS: { key: RankMetric; label: string; color: string; glow: string; gradFrom: string; gradTo: string }[] = [
  { key: 'baseCp',   label: '基礎戰力',   color: 'text-red-400',    glow: '0 0 8px rgba(239,68,68,0.7)',   gradFrom: '#7f1d1d', gradTo: '#ef4444' },
  { key: 'arenaCP',  label: '競技場戰力', color: 'text-pink-400',   glow: '0 0 8px rgba(236,72,153,0.7)',  gradFrom: '#831843', gradTo: '#ec4899' },
  { key: 'cellCp3x', label: '3x細胞戰力', color: 'text-yellow-400', glow: '0 0 8px rgba(234,179,8,0.7)',   gradFrom: '#713f12', gradTo: '#eab308' },
  { key: 'cellCp4x', label: '4x細胞戰力', color: 'text-orange-400', glow: '0 0 8px rgba(249,115,22,0.7)',  gradFrom: '#7c2d12', gradTo: '#f97316' },
  { key: 'atk',      label: 'ATK',        color: 'text-orange-300', glow: '0 0 8px rgba(253,186,116,0.7)', gradFrom: '#7c2d12', gradTo: '#fdba74' },
  { key: 'def',      label: 'DEF',        color: 'text-blue-400',   glow: '0 0 8px rgba(96,165,250,0.7)',  gradFrom: '#1e3a5f', gradTo: '#60a5fa' },
  { key: 'hp',       label: 'HP',         color: 'text-green-400',  glow: '0 0 8px rgba(74,222,128,0.7)',  gradFrom: '#14532d', gradTo: '#4ade80' },
];

function getCharValue(char: Character, metric: RankMetric): number | null {
  const { atk, def, hp } = char.stats;
  const arenaCP = char.strategicArenaCP ?? null;
  switch (metric) {
    case 'baseCp':   return arenaCP != null ? calcBaseCp(arenaCP, atk, def, hp) : null;
    case 'arenaCP':  return arenaCP;
    case 'cellCp3x': return arenaCP != null ? calcCellCp3x(arenaCP, atk, def, hp) : null;
    case 'cellCp4x': return arenaCP != null ? calcCellCp4x(arenaCP, atk, def, hp) : null;
    case 'atk':      return atk;
    case 'def':      return def;
    case 'hp':       return hp;
  }
}

const RARITY_COLOR: Record<string, string> = {
  SP:  'text-pink-400 border-pink-400',
  SSR: 'text-purple-400 border-purple-400',
  SR:  'text-yellow-400 border-yellow-400',
  R:   'text-blue-400 border-blue-400',
};

const TACTIC_COLOR: Record<string, string> = {
  輸出: 'text-red-400 border-red-600',
  輔助: 'text-cyan-400 border-cyan-600',
  控制: 'text-purple-400 border-purple-600',
  均衡: 'text-blue-400 border-blue-600',
  爆發: 'text-orange-400 border-orange-600',
};


const SUBTYPE_LABEL: Record<string, string> = {
  passive: '被動',
  rank:    'Rank',
  gift:    '潛能升級',
};

const SUBTYPE_COLOR: Record<string, string> = {
  passive: 'text-gray-400 border-gray-600',
  rank:    'text-yellow-400 border-yellow-700',
  gift:    'text-pink-400 border-pink-700',
};

const LV_LABELS = ['一級', '二級', '三級', '四級', '五級'];
const TIER_LABELS = ['一級', '二級', '三級'];

const ORG_DISPLAY: Record<string, Record<string, string>> = {
  en: {
    'ALL':           'ALL',
    'No Organization':        'No Organization',
    'CCG Higher Rank Investigator': 'CCG Higher Rank Investigator',
    'CCG Lower Rank Investigator':  'CCG Lower Rank Investigator',
    'Aogiri Tree':   'Aogiri Tree',
    'Anteiku':       'Anteiku',
  },
  zh: {
    'ALL':           '全部',
    'No Organization':        '無組織',
    'CCG Higher Rank Investigator': 'CCG 上位搜查官',
    'CCG Lower Rank Investigator':  'CCG 下位搜查官',
    'Aogiri Tree':   '青桐樹',
    'Anteiku':       '安定區',
  },
};

function heroImg(id: string, type: 'head' | 'bg' | 'frame', rarity?: string) {
  if (type === 'head')  return `/assets/heroes/head/${id}_head.png`;
  if (type === 'bg')    return `/assets/heroes/bg/TYJS_bg_head_${rarity}.png`;
  if (type === 'frame') return `/assets/heroes/frame/TYJS_frame_head_${rarity}.png`;
  return '';
}

function getCellsForChar(charId: string): Cell[] {
  return (cellsData as Cell[]).filter(c => {
    const m = c.id.match(/Equip_Special_(\d+)_/);
    return m ? m[1] === charId : false;
  });
}

const EffectText: React.FC<{ segments: EffectSegment[] }> = ({ segments }) => (
  <span>
    {segments.map((seg, i) =>
      seg.isEffect
        ? <span key={i} className="text-red-400 font-semibold">{seg.text}</span>
        : <span key={i}>{seg.text}</span>
    )}
  </span>
);

function collectEffects(segments: EffectSegment[]): { name: string; desc: string }[] {
  const seen = new Set<string>();
  const out: { name: string; desc: string }[] = [];
  for (const seg of segments) {
    if (seg.isEffect && seg.effectName && seg.effectDesc && !seen.has(seg.effectName)) {
      seen.add(seg.effectName);
      out.push({ name: seg.effectName, desc: seg.effectDesc });
    }
  }
  return out;
}

const EffectDefs: React.FC<{ segments: EffectSegment[] }> = ({ segments }) => {
  const defs = collectEffects(segments);
  if (defs.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {defs.map(d => (
        <p key={d.name} className="text-red-400 text-xs italic leading-snug">
          ＊{d.name}：{d.desc}
        </p>
      ))}
    </div>
  );
};

const HeroCard: React.FC<{ char: Character; onClick: () => void }> = ({ char, onClick }) => {
  const r = char.rarity as string;
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col w-28 md:w-32 appearance-none border-0 p-0 hover:scale-105 transition-transform duration-200 [background:transparent]`}
    >
      <div className="relative w-full aspect-square">
        <img src={heroImg(char.id, 'bg', r)} alt="" className="absolute inset-0 w-full h-full object-fill" onError={e => (e.currentTarget.style.display='none')} />
        <img src={heroImg(char.id, 'head')} alt={char.name} className="absolute inset-[3%] w-[94%] h-[94%] object-contain translate-x-[-3%]" onError={e => (e.currentTarget.style.display='none')} />
        <img src={heroImg(char.id, 'frame', r)} alt="" className="absolute inset-0 w-full h-full object-fill pointer-events-none" onError={e => (e.currentTarget.style.display='none')} />
        {char.attribute && (
          <img
            src={`/assets/heroes/attribute/${{ 力:'str', 技:'skl', 速:'spd', 心:'psy', 知:'wit', '滅':'dst' }[char.attribute]}.png`}
            alt={char.attribute}
            className="absolute top-0 right-0 w-8 h-8 object-contain"
          />
        )}
      </div>
      <div className="w-full px-0.5 pt-0.5 pb-1">
        {char.title && <p className="text-[9px] leading-tight truncate text-center text-gray-500 dark:text-gray-400">{char.title}</p>}
        <p className="text-[11px] leading-tight truncate text-center font-semibold text-gray-800 dark:text-white">{char.name}</p>
      </div>
    </button>
  );
};

const CharModal: React.FC<{ char: Character; lang: Lang; onClose: () => void; onOpenCell: (cellId: string) => void }> = ({ char, lang, onClose, onOpenCell }) => {
  const [activeTab, setActiveTab] = useState<SkillTab>('active');
  const [activeLv, setActiveLv] = useState<Record<number, number>>({});
  const r = char.rarity as string;
  const exclusiveCells = getCellsForChar(char.id);

  return createPortal(
    <>
      {/* backdrop covers full screen */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* navbar blur overlay */}
      <div
        className="fixed inset-x-0 top-0 z-50 pointer-events-none"
        style={{ height: 'var(--navbar-h)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      />
      {/* modal panel */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center md:items-center md:px-4"
        style={{ top: 'var(--navbar-h)' }}
      >
        <div
          className="relative w-full max-w-2xl flex flex-col shadow-2xl bg-white dark:bg-[#1a1c23] rounded-t-xl md:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden md:mb-4"
          style={{ maxHeight: 'calc(100vh - var(--navbar-h) - 16px)' }}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-gray-50 dark:bg-[#111318] border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                  <img src={heroImg(char.id, 'bg', r)} alt="" className="absolute inset-0 w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
                  <img src={heroImg(char.id, 'head')} alt="" className="absolute inset-0 w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
                  <img src={heroImg(char.id, 'frame', r)} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" onError={e => (e.currentTarget.style.display='none')} />
                  {char.attribute && (
                    <img
                      src={`/assets/heroes/attribute/${{ 力:'str', 技:'skl', 速:'spd', 心:'psy', 知:'wit', '滅':'dst' }[char.attribute]}.png`}
                      alt={char.attribute}
                      className="absolute top-0 right-0 w-5 h-5 object-contain"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  {char.title && <p className="text-gray-600 dark:text-gray-400 text-xs leading-tight">【{char.title}】</p>}
                  <h2 className="text-gray-900 dark:text-white font-bold text-lg leading-tight truncate">{char.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-xs font-bold border px-1.5 rounded ${RARITY_COLOR[r]}`}>{r}</span>
                    {char.tactic && (
                      <span className={`text-xs font-bold border px-1.5 rounded ${TACTIC_COLOR[char.tactic]}`}>{char.tactic}</span>
                    )}
                    <span className="text-gray-500 text-xs">#{char.id}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">{ORG_DISPLAY[lang]?.[char.organization] ?? char.organization}</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-2 rounded hover:bg-white/5">
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>

            {/* Stats */}
            <div className="flex divide-x divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 flex flex-col items-center py-2">
                <span className="text-xs text-green-400 font-tech tracking-wider">HP</span>
                <span className="text-gray-900 dark:text-white font-bold text-sm">{char.stats.hp.toLocaleString()}</span>
              </div>
              <div className="flex-1 flex flex-col items-center py-2">
                <span className="text-xs text-red-400 font-tech tracking-wider">ATK</span>
                <span className="text-gray-900 dark:text-white font-bold text-sm">{char.stats.atk.toLocaleString()}</span>
              </div>
              <div className="flex-1 flex flex-col items-center py-2">
                <span className="text-xs text-blue-400 font-tech tracking-wider">DEF</span>
                <span className="text-gray-900 dark:text-white font-bold text-sm">{char.stats.def.toLocaleString()}</span>
              </div>
            </div>
            {/* CP row */}
            {char.strategicArenaCP != null && (() => {
              const { atk, def, hp } = char.stats;
              const arenaCP = char.strategicArenaCP!;
              const baseCp = calcBaseCp(arenaCP, atk, def, hp);
              const cp3x = calcCellCp3x(arenaCP, atk, def, hp);
              const cp4x = calcCellCp4x(arenaCP, atk, def, hp);
              return (
                <div className="flex divide-x divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex-1 flex flex-col items-center py-2">
                    <span className="text-xs text-gray-400 font-tech tracking-wider">基礎戰力</span>
                    <span className="text-gray-900 dark:text-white font-bold text-sm">{baseCp.toLocaleString()}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center py-2">
                    <span className="text-xs text-yellow-400 font-tech tracking-wider">3x細胞戰力</span>
                    <span className="text-gray-900 dark:text-white font-bold text-sm">{cp3x.toLocaleString()}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center py-2">
                    <span className="text-xs text-orange-400 font-tech tracking-wider">4x細胞戰力</span>
                    <span className="text-gray-900 dark:text-white font-bold text-sm">{cp4x.toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}

            {/* Tabs */}
            <div className="flex border-t border-gray-200 dark:border-gray-700">
              {(['active', 'passive', 'talent'] as SkillTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-tech font-bold tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab ? 'bg-[#8a0000] text-white' : 'text-gray-500 dark:text-gray-500 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  {tab === 'active' && <><Sword size={13} /> 主動</>}
                  {tab === 'passive' && <><Shield size={13} /> 被動</>}
                  {tab === 'talent' && <><Star size={13} /> 天賦</>}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3">

            {activeTab === 'active' && (
              char.activeSkills.length === 0
                ? <p className="text-gray-500 text-sm text-center py-8">無主動技能</p>
                : (char.activeSkills as ActiveSkill[]).map(skill => {
                    const curLv = activeLv[skill.skillNum] ?? skill.levels.length - 1;
                    const curLevel = skill.levels[curLv];
                    return (
                      <div key={skill.skillNum} className="bg-gray-100 dark:bg-[#22252e] border border-gray-200 dark:border-gray-700 rounded p-4">
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-2">
                            <Sword size={15} className="text-red-500 flex-shrink-0" />
                            <span className="text-gray-900 dark:text-white font-bold text-sm">主動技能 #{skill.skillNum}</span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {skill.levels.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveLv(prev => ({ ...prev, [skill.skillNum]: idx }))}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${curLv === idx ? 'bg-red-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                              >
                                {LV_LABELS[idx] ?? `Lv${idx + 1}`}
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
                          <EffectText segments={curLevel.effects} />
                        </p>
                        <EffectDefs segments={curLevel.effects} />
                      </div>
                    );
                  })
            )}

            {activeTab === 'passive' && (
              char.passiveSkills.length === 0
                ? <p className="text-gray-500 text-sm text-center py-8">無被動技能</p>
                : (char.passiveSkills as PassiveSkill[]).map((skill, idx) => (
                    <div key={idx} className="bg-gray-100 dark:bg-[#22252e] border border-gray-200 dark:border-gray-700 rounded p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {idx % 2 === 0
                          ? <Flame size={15} className="text-orange-400 flex-shrink-0" />
                          : <Sparkles size={15} className="text-purple-400 flex-shrink-0" />}
                        <span className="text-gray-900 dark:text-white font-bold text-sm">{skill.name}</span>
                        <span className={`ml-auto text-xs border px-1.5 py-0.5 rounded flex-shrink-0 ${SUBTYPE_COLOR[skill.subtype]}`}>
                          {SUBTYPE_LABEL[skill.subtype]}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
                        <EffectText segments={skill.effects} />
                      </p>
                      <EffectDefs segments={skill.effects} />
                    </div>
                  ))
            )}

            {activeTab === 'talent' && (
              char.tiers.length === 0
                ? <p className="text-gray-500 text-sm text-center py-8">無天賦資料</p>
                : char.tiers.map(tier => (
                    <div key={tier.tier} className="bg-gray-100 dark:bg-[#22252e] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                      <div className="bg-gray-200 dark:bg-[#111318] px-4 py-2 border-b border-gray-300 dark:border-gray-700">
                        <span className="text-yellow-400 font-bold text-sm tracking-wider">
                          {TIER_LABELS[tier.tier - 1] ?? `Tier ${tier.tier}`}
                        </span>
                      </div>
                      <div className="p-3 space-y-2">
                        {tier.effects.map((effect, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <span className="text-gray-500 text-xs font-tech mt-0.5 flex-shrink-0">#{idx + 1}</span>
                            <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">{effect.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
            )}
          </div>

          {/* Exclusive Cells */}
          {exclusiveCells.length > 0 && (
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wider">專屬細胞</p>
              <div className="flex gap-2 flex-wrap">
                {exclusiveCells.map(cell => (
                  <button
                    key={cell.id}
                    onClick={() => { onClose(); onOpenCell(cell.id); }}
                    className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
                    title={cell.name}
                  >
                    <img
                      src={`/assets/cells-icon/${cell.imgFile}`}
                      alt={cell.name}
                      className="w-12 h-12 object-contain"
                      onError={e => (e.currentTarget.style.opacity = '0.3')}
                    />
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">{cell.statType}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export const CharacterGallery: React.FC<CharacterGalleryProps> = ({ lang, onSwitchToCells, initialCharId, onClearInitialChar, onOpenCell }) => {
  const t = translations[lang].characters;
  const [orgFilter, setOrgFilter] = useState<FilterCategory>('ALL');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('ALL');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [rankMetric, setRankMetric] = useState<RankMetric>('baseCp');
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    setBarReady(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setBarReady(true)));
    return () => cancelAnimationFrame(id);
  }, [rankMetric, viewMode]);

  useEffect(() => {
    if (initialCharId) {
      const char = (charactersData as Character[]).find(c => c.id === initialCharId);
      if (char) setSelectedChar(char);
      onClearInitialChar?.();
    }
  }, [initialCharId]);

  const orgFilters: FilterCategory[] = ['ALL', 'No Organization', 'CCG Higher Rank Investigator', 'CCG Lower Rank Investigator', 'Aogiri Tree', 'Anteiku'];
  const rarityFilters: RarityFilter[] = ['ALL', 'SP', 'SSR', 'SR', 'R'];

  const filteredData = charactersData.filter((c: Character) => {
    const orgMatch = orgFilter === 'ALL' || c.organization === orgFilter;
    const rarityMatch = rarityFilter === 'ALL' || c.rarity === rarityFilter;
    return orgMatch && rarityMatch;
  });

  return (
    <>
      {selectedChar && <CharModal char={selectedChar} lang={lang} onClose={() => setSelectedChar(null)} onOpenCell={onOpenCell} />}

      <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-700">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-300 dark:border-ghoul-red/30 pb-6">
          <div>
            <h2 className="text-2xl md:text-4xl font-serif font-bold text-black dark:text-white tracking-widest mb-2 flex items-center gap-3">
              <Database className="text-ghoul-red" /> {t.title}
            </h2>
            <div className="text-xs font-tech text-gray-500 tracking-[0.3em]">{t.ccgDatabase}</div>
            <div className="text-xs text-gray-400 mt-1">Data credit: <a href="https://twitter.com/kevinchatmajo1" target="_blank" rel="noopener noreferrer" className="text-ghoul-red hover:underline">@kevinchatmajo1</a></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-tech text-gray-400">{filteredData.length} / {charactersData.length} {lang === 'zh' ? '角色' : 'SUBJECTS'}</div>
            <div className="flex border border-gray-600 rounded-sm overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-2.5 py-1.5 transition-all ${viewMode === 'grid' ? 'bg-ghoul-red text-white' : 'text-gray-400 hover:text-white'}`} title="卡片模式">
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setViewMode('rank')} className={`px-2.5 py-1.5 border-l border-gray-600 transition-all ${viewMode === 'rank' ? 'bg-ghoul-red text-white' : 'text-gray-400 hover:text-white'}`} title="排名模式">
                <Trophy size={14} />
              </button>
            </div>
            <button onClick={onSwitchToCells} className="px-3 py-1.5 text-xs font-tech font-bold border border-gray-600 text-gray-400 hover:border-gray-300 hover:text-white transition-all rounded-sm uppercase tracking-wider">
              {lang === 'zh' ? 'RC 細胞 →' : 'RC CELLS →'}
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <>
            {/* Filters */}
            <div className="mb-5 space-y-2">
              <div className="flex flex-wrap gap-2">
                {orgFilters.map((f: FilterCategory) => (
                  <button key={f} onClick={() => setOrgFilter(f)}
                    className={`px-3 py-2 text-xs font-tech font-bold border uppercase tracking-wider transition-all rounded-sm ${orgFilter === f ? 'bg-ghoul-red border-ghoul-red text-white' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-400 hover:text-gray-300'}`}>
                    {ORG_DISPLAY[lang]?.[f] ?? f}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {rarityFilters.map((r: RarityFilter) => (
                  <button key={r} onClick={() => setRarityFilter(r)}
                    className={`px-3 py-2 text-xs font-tech font-bold border uppercase tracking-wider transition-all rounded-sm ${rarityFilter === r ? (r === 'ALL' ? 'bg-ghoul-red border-ghoul-red text-white' : `${RARITY_COLOR[r]} bg-black/40`) : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-400 hover:text-gray-300'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-gray-700 rounded-lg">
                <Database size={48} className="text-gray-700 mb-4" />
                <p className="text-gray-500 font-tech tracking-widest text-sm">NO SUBJECTS FOUND</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3 md:gap-4 px-2">
                {filteredData.map((char: Character) => (
                  <HeroCard key={char.id} char={char} onClick={() => setSelectedChar(char)} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Rank metric selector */}
            <div className="mb-5 flex flex-wrap gap-2">
              {RANK_METRICS.map(m => (
                <button key={m.key} onClick={() => setRankMetric(m.key)}
                  className={`px-3 py-2 text-xs font-tech font-bold border uppercase tracking-wider transition-all rounded-sm ${rankMetric === m.key ? `border-ghoul-red bg-ghoul-red/20 ${m.color}` : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-400 hover:text-gray-300'}`}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Rank list */}
            {(() => {
              const metric = RANK_METRICS.find(m => m.key === rankMetric)!;
              const allChars = [...(charactersData as Character[])];
              const withVal = allChars.map(c => ({ c, val: getCharValue(c, rankMetric) }));
              const sorted = withVal.sort((a, b) => {
                if (a.val == null && b.val == null) return 0;
                if (a.val == null) return 1;
                if (b.val == null) return -1;
                return b.val - a.val;
              });
              const maxVal = sorted[0]?.val ?? 1;
              const MEDAL = ['🥇', '🥈', '🥉'];
              return (
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  {sorted.map(({ c, val }, idx) => {
                    const pct = val != null && maxVal ? (val / maxVal) * 100 : 0;
                    const rank = idx + 1;
                    const rarity = c.rarity as keyof typeof RARITY_COLOR;
                    return (
                      <div key={c.id} onClick={() => setSelectedChar(c)}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        {/* Rank number */}
                        <div className="w-8 text-center flex-shrink-0">
                          {rank <= 3
                            ? <span className="text-base leading-none">{MEDAL[rank - 1]}</span>
                            : <span className="text-xs font-tech text-gray-400">#{rank}</span>}
                        </div>
                        {/* Avatar */}
                        <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden">
                          <img src={`/assets/heroes/bg/TYJS_bg_head_${c.rarity}.png`} className="absolute inset-0 w-full h-full object-cover" />
                          <img src={`/assets/heroes/head/${c.id}_head.png`} className="absolute inset-0 w-full h-full object-cover" />
                          <img src={`/assets/heroes/frame/TYJS_frame_head_${c.rarity}.png`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                        </div>
                        {/* Name */}
                        <div className="flex-shrink-0 w-32 md:w-44">
                          <div className="text-xs text-gray-400 truncate">{c.title}</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`text-[10px] font-tech font-bold ${RARITY_COLOR[rarity] ?? 'text-gray-400'}`}>{c.rarity}</span>
                            {c.tactic && <span className="text-[10px] text-gray-500">{c.tactic}</span>}
                          </div>
                        </div>
                        {/* Bar + value */}
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                          {/* RC Cell bar */}
                          <div className="flex-1 relative" style={{ height: '10px' }}>
                            {/* Track: dark with RC measurement ticks */}
                            <div className="absolute inset-0 border border-red-950/40"
                              style={{
                                background: '#07000a',
                                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(180,0,0,0.25) 19px, rgba(180,0,0,0.25) 20px)',
                              }} />
                            {/* Fill */}
                            {val != null && (
                              <div className="absolute inset-y-0 left-0 overflow-hidden"
                                style={{
                                  width: `${barReady ? pct : 0}%`,
                                  transition: `width 1.2s cubic-bezier(0.22,1,0.36,1) ${Math.min(idx * 12, 600)}ms`,
                                  clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 50%, calc(100% - 5px) 100%, 0 100%)',
                                  background: `linear-gradient(90deg, ${metric.gradFrom} 0%, ${metric.gradTo} 85%, #fff 100%)`,
                                  boxShadow: pct > 5 ? metric.glow : 'none',
                                }}>
                                {/* Shimmer */}
                                <div className="rc-bar-shimmer" />
                              </div>
                            )}
                            {/* RC label on track */}
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[7px] font-tech tracking-widest text-red-950/60 pointer-events-none select-none">RC</div>
                          </div>
                          <div className={`flex-shrink-0 text-sm font-bold font-tech w-20 text-right ${metric.color}`}>
                            {val != null ? val.toLocaleString() : <span className="text-gray-500 font-normal">—</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </>
  );
};
