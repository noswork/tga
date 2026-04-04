import React from 'react';
import { Lang } from '../../../../types';
import { FilterCategory, FilterState } from '../types';
import { translations } from '../../../../constants';

interface FilterBarProps {
  lang: Lang;
  filterState: FilterState;
  onChange: (state: FilterState) => void;
  rightSlot?: React.ReactNode;
}

const ORG_VALUES = [
  'No Organization',
  'CCG Higher Rank Investigator',
  'CCG Lower Rank Investigator',
  'Aogiri Tree',
  'Anteiku',
  'Boss',
  'Cadre',
];

const ORG_LABELS: Record<string, string> = {
  'No Organization': '無組織',
  'CCG Higher Rank Investigator': 'CCG 高階',
  'CCG Lower Rank Investigator': 'CCG 低階',
  'Aogiri Tree': '青桐樹',
  'Anteiku': '安定區',
  'Boss': '首領',
  'Cadre': '幹部',
};

const ATTR_VALUES = ['力', '技', '速', '心', '知'];
const RARITY_VALUES = ['SP', 'SSR', 'SR', 'R'];
const TACTIC_VALUES = ['輸出', '輔助', '控制', '均衡', '爆發'];

const CATEGORIES: FilterCategory[] = ['ALL', 'organization', 'attribute', 'rarity', 'tactic'];

export const FilterBar: React.FC<FilterBarProps> = ({ lang, filterState, onChange, rightSlot }) => {
  const t = translations[lang].tools.tierlist;

  const catLabel: Record<FilterCategory, string> = {
    ALL: t.filterAll,
    organization: t.filterOrg,
    attribute: t.filterAttr,
    rarity: t.filterRarity,
    tactic: t.filterTactic,
  };

  const valueOptions: Record<FilterCategory, string[]> = {
    ALL: [],
    organization: ORG_VALUES,
    attribute: ATTR_VALUES,
    rarity: RARITY_VALUES,
    tactic: TACTIC_VALUES,
  };

  const getValueLabel = (cat: FilterCategory, val: string) => {
    if (cat === 'organization') return ORG_LABELS[val] ?? val;
    return val;
  };

  const handleCategoryClick = (cat: FilterCategory) => {
    if (cat === 'ALL') {
      onChange({ category: 'ALL', value: 'ALL' });
    } else {
      onChange({ category: cat, value: valueOptions[cat][0] });
    }
  };

  const btnBase = 'px-3 py-1.5 text-xs font-tech font-bold border uppercase tracking-wider transition-all rounded-sm';
  const btnActive = 'bg-ghoul-red border-ghoul-red text-white';
  const btnInactive = 'bg-transparent border-gray-600 text-gray-400 hover:border-ghoul-red/60 hover:text-gray-200';

  return (
    <div className="flex flex-col gap-2 px-4 py-2 border-b border-gray-800">
      {/* Category row + right slot */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex flex-wrap gap-2 flex-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`${btnBase} ${filterState.category === cat ? btnActive : btnInactive}`}
            >
              {catLabel[cat]}
            </button>
          ))}
        </div>
        {rightSlot && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {rightSlot}
          </div>
        )}
      </div>

      {/* Value row */}
      {filterState.category !== 'ALL' && (
        <div className="flex flex-wrap gap-2">
          {valueOptions[filterState.category].map((val) => (
            <button
              key={val}
              onClick={() => onChange({ ...filterState, value: val })}
              className={`${btnBase} ${filterState.value === val ? btnActive : btnInactive}`}
            >
              {getValueLabel(filterState.category, val)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
