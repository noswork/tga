import React from 'react';
import { Lang } from '../types';
import { translations } from '../constants';

interface GhoulToyboxProps {
  lang: Lang;
}

export const GhoulToybox: React.FC<GhoulToyboxProps> = ({ lang }) => {
  const t = translations[lang].toybox;

  return (
    <section className="w-full h-full flex flex-col items-center justify-center text-center gap-6 px-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ghoul-red">
          {t.playfulMeter}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">{t.title}</h2>
        <p className="text-gray-500 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
          {t.subtitle}
        </p>
      </div>

      <div className="w-full max-w-xl border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white/90 dark:bg-black/40 backdrop-blur">
        <p className="text-sm text-gray-500 dark:text-gray-300">{t.resultPlaceholder}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 uppercase tracking-widest">
          {t.legendLabel}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.legendDesc}</p>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 max-w-md">
        {t.quoteInstruction}
      </p>
    </section>
  );
};

