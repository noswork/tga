import React, { useState } from 'react';
import { Lang } from '../../../../types';
import { TierRow } from '../types';
import { translations } from '../../../../constants';

interface TierSettingsProps {
  lang: Lang;
  row: TierRow;
  onSave: (label: string, labelBg: string) => void;
  onCancel: () => void;
}

export const TierSettings: React.FC<TierSettingsProps> = ({ lang, row, onSave, onCancel }) => {
  const t = translations[lang].tools.tierlist;
  const [label, setLabel] = useState(row.label);
  const [labelBg, setLabelBg] = useState(row.labelBg);

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-black/40 border-t border-gray-700">
      <span className="text-xs font-tech text-gray-400 uppercase tracking-wider">{t.tierLabel}:</span>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={6}
        className="w-20 px-2 py-1 text-sm font-tech bg-gray-900 border border-gray-600 text-white focus:border-ghoul-red focus:outline-none rounded-sm"
      />
      <span className="text-xs font-tech text-gray-400 uppercase tracking-wider">{t.labelColor}:</span>
      <div className="relative w-8 h-8 rounded-sm border border-gray-600 overflow-hidden cursor-pointer">
        <div className="absolute inset-0" style={{ backgroundColor: labelBg }} />
        <input
          type="color"
          value={labelBg}
          onChange={(e) => setLabelBg(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </div>
      <button
        onClick={() => onSave(label.trim() || row.label, labelBg)}
        className="px-3 py-1 text-xs font-tech font-bold bg-ghoul-red text-white hover:bg-red-700 transition-colors rounded-sm"
      >
        {t.save}
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1 text-xs font-tech font-bold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors rounded-sm"
      >
        {t.cancel}
      </button>
    </div>
  );
};
