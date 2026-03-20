import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lang, Character, ActiveSkill, PassiveSkill, EffectSegment } from '../types';
import { translations, charactersData } from '../constants';
import { Shield, Sword, Database, X, Flame, Sparkles, Star } from 'lucide-react';

interface CharacterGalleryProps {
  lang: Lang;
  onSwitchToCells: () => void;
}

type FilterCategory = 'ALL' | 'No Organization' | 'CCG Higher Rank Investigator' | 'CCG Lower Rank Investigator' | 'Aogiri Tree' | 'Anteiku';
type RarityFilter = 'ALL' | 'SP' | 'SSR' | 'SR' | 'R';
type SkillTab = 'active' | 'passive' | 'talent';

const RARITY_COLOR: Record<string, string> = {
  SP:  'text-pink-400 border-pink-400',
  SSR: 'text-yellow-400 border-yellow-400',
  SR:  'text-purple-400 border-purple-400',
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
            src={`/assets/heroes/attribute/${{ 力:'str', 技:'skl', 速:'spd', 心:'psy', 知:'wit' }[char.attribute]}.png`}
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

const CharModal: React.FC<{ char: Character; lang: Lang; onClose: () => void }> = ({ char, lang, onClose }) => {
  const [activeTab, setActiveTab] = useState<SkillTab>('active');
  const [activeLv, setActiveLv] = useState<Record<number, number>>({});
  const r = char.rarity as string;

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
        style={{ height: '96px', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      />
      {/* modal panel */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center md:items-center md:px-4"
        style={{ top: '96px' }}
      >
        <div
          className="relative w-full max-w-2xl flex flex-col shadow-2xl bg-white dark:bg-[#1a1c23] rounded-t-xl md:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden md:mb-4"
          style={{ maxHeight: 'calc(100vh - 96px - 16px)' }}
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
                      src={`/assets/heroes/attribute/${{ 力:'str', 技:'skl', 速:'spd', 心:'psy', 知:'wit' }[char.attribute]}.png`}
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
            {char.baseCp && (
              <div className="flex divide-x divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex flex-col items-center py-2">
                  <span className="text-xs text-gray-400 font-tech tracking-wider">基礎戰力</span>
                  <span className="text-gray-900 dark:text-white font-bold text-sm">{char.baseCp.toLocaleString()}</span>
                </div>
                <div className="flex-1 flex flex-col items-center py-2">
                  <span className="text-xs text-yellow-400 font-tech tracking-wider">3x細胞戰力</span>
                  <span className="text-gray-900 dark:text-white font-bold text-sm">{char.cellCp3x?.toLocaleString()}</span>
                </div>
                <div className="flex-1 flex flex-col items-center py-2">
                  <span className="text-xs text-orange-400 font-tech tracking-wider">4x細胞戰力</span>
                  <span className="text-gray-900 dark:text-white font-bold text-sm">{char.cellCp4x?.toLocaleString()}</span>
                </div>
              </div>
            )}

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
        </div>
      </div>
    </>,
    document.body
  );
};

export const CharacterGallery: React.FC<CharacterGalleryProps> = ({ lang, onSwitchToCells }) => {
  const t = translations[lang].characters;
  const [orgFilter, setOrgFilter] = useState<FilterCategory>('ALL');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('ALL');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  const orgFilters: FilterCategory[] = ['ALL', 'No Organization', 'CCG Higher Rank Investigator', 'CCG Lower Rank Investigator', 'Aogiri Tree', 'Anteiku'];
  const rarityFilters: RarityFilter[] = ['ALL', 'SP', 'SSR', 'SR', 'R'];

  const filteredData = charactersData.filter((c: Character) => {
    const orgMatch = orgFilter === 'ALL' || c.organization === orgFilter;
    const rarityMatch = rarityFilter === 'ALL' || c.rarity === rarityFilter;
    return orgMatch && rarityMatch;
  });

  return (
    <>
      {selectedChar && <CharModal char={selectedChar} lang={lang} onClose={() => setSelectedChar(null)} />}

      <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-700">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-300 dark:border-ghoul-red/30 pb-6">
          <div>
            <h2 className="text-4xl font-serif font-bold text-black dark:text-white tracking-widest mb-2 flex items-center gap-3">
              <Database className="text-ghoul-red" /> {t.title}
            </h2>
            <div className="text-xs font-tech text-gray-500 tracking-[0.3em]">{t.ccgDatabase}</div>
            <div className="text-xs text-gray-400 mt-1">Data credit: <a href="https://twitter.com/kevinchatmajo1" target="_blank" rel="noopener noreferrer" className="text-ghoul-red hover:underline">@kevinchatmajo1</a></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-tech text-gray-400">{filteredData.length} / {charactersData.length} {lang === 'zh' ? '角色' : 'SUBJECTS'}</div>
            <button onClick={onSwitchToCells} className="px-3 py-1.5 text-xs font-tech font-bold border border-gray-600 text-gray-400 hover:border-gray-300 hover:text-white transition-all rounded-sm uppercase tracking-wider">
              {lang === 'zh' ? 'RC 細胞 →' : 'RC CELLS →'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 space-y-2">
          <div className="flex flex-wrap gap-2">
            {orgFilters.map((f: FilterCategory) => (
              <button key={f} onClick={() => setOrgFilter(f)}
                className={`px-4 py-1.5 text-xs font-tech font-bold border uppercase tracking-wider transition-all rounded-sm ${orgFilter === f ? 'bg-ghoul-red border-ghoul-red text-white' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-400 hover:text-gray-300'}`}>
                {ORG_DISPLAY[lang]?.[f] ?? f}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {rarityFilters.map((r: RarityFilter) => (
              <button key={r} onClick={() => setRarityFilter(r)}
                className={`px-4 py-1.5 text-xs font-tech font-bold border uppercase tracking-wider transition-all rounded-sm ${rarityFilter === r ? (r === 'ALL' ? 'bg-ghoul-red border-ghoul-red text-white' : `${RARITY_COLOR[r]} bg-black/40`) : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-400 hover:text-gray-300'}`}>
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-4 px-2">
            {filteredData.map((char: Character) => (
              <HeroCard key={char.id} char={char} onClick={() => setSelectedChar(char)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
