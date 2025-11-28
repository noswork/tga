import React from 'react';
import { Lang } from '../../types';
import { translations } from '../../constants';

interface WikiDataProps {
  lang: Lang;
}

export const WikiData: React.FC<WikiDataProps> = ({ lang }) => {
  const t = translations[lang].ghoulInsight.wiki;
  const ranks = t.rankDescriptions;

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 lg:px-8 animate-fade-in overflow-y-auto h-full">
      <header className="mb-8 border-b border-neutral-800 pb-4">
        <h2 className="text-3xl font-display text-white tracking-wider">
          {t.headerTitle.split(' ')[0]} <span className="text-red-600">{t.headerTitle.split(' ')[1]}</span>
        </h2>
        <p className="text-neutral-500 font-mono text-xs mt-1">{t.headerSubtitle}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <section>
            <h3 className="text-red-500 font-mono text-sm font-bold mb-3 border-l-2 border-red-500 pl-3">
              {t.definitionTitle}
            </h3>
            <p className="text-neutral-300 text-sm leading-relaxed mb-4">
              {t.definitionBody1}
            </p>
            <p className="text-neutral-400 text-xs leading-relaxed">{t.definitionBody2}</p>
          </section>

          <section>
            <h3 className="text-red-500 font-mono text-sm font-bold mb-3 border-l-2 border-red-500 pl-3">
              {t.criteriaTitle}
            </h3>
            <p className="text-neutral-400 text-xs mb-4">{t.criteriaIntro}</p>

            <div className="space-y-3">
              {([
                { rank: 'SSS', desc: ranks.SSS },
                { rank: 'SS', desc: ranks.SS },
                { rank: 'S+', desc: ranks.S_PLUS },
                { rank: 'S-', desc: ranks.S_MINUS },
                { rank: 'A', desc: ranks.A },
                { rank: 'B', desc: ranks.B },
                { rank: 'C', desc: ranks.C },
              ] as const).map((item) => (
                <div
                  key={item.rank}
                  className="group flex items-start gap-4 p-3 border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/80 transition-colors"
                >
                  <div className={`w-12 text-center font-display text-xl font-bold ${item.rank.startsWith('S') ? 'text-red-600' : 'text-neutral-400'}`}>
                    {item.rank}
                  </div>
                  <div className="text-xs text-neutral-300 pt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="relative">
          <div className="sticky top-4 border border-neutral-800 bg-black p-6">
            <div className="font-mono text-[10px] text-red-600 mb-2">{t.sideTitle}</div>
            <div className="text-4xl font-display text-white mb-6">
              {t.sideChartTitleLine1}
              <br />
              {t.sideChartTitleLine2}
            </div>

            <div className="flex flex-col-reverse gap-1 h-64 w-full">
              <div className="h-full bg-gradient-to-t from-neutral-900 to-red-900/20 relative border-l border-b border-neutral-700">
                <div className="absolute bottom-[100%] left-0 w-full border-b border-red-600 border-dashed text-right text-[10px] text-red-500 pr-1">
                  SSS
                </div>
                <div className="absolute bottom-[80%] left-0 w-full border-b border-neutral-700 border-dashed text-right text-[10px] text-neutral-500 pr-1">
                  SS
                </div>
                <div className="absolute bottom-[60%] left-0 w-full border-b border-neutral-700 border-dashed text-right text-[10px] text-neutral-500 pr-1">
                  S
                </div>
                <div className="absolute bottom-[40%] left-0 w-full border-b border-neutral-700 border-dashed text-right text-[10px] text-neutral-500 pr-1">
                  A
                </div>
                <div className="absolute bottom-[20%] left-0 w-full border-b border-neutral-700 border-dashed text-right text-[10px] text-neutral-500 pr-1">
                  B
                </div>

                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <polyline points="0,256 50,200 100,220 150,150 200,100 250,120 300,20 350,0" fill="none" stroke="#dc2626" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  <defs>
                    <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(220, 38, 38, 0.5)" />
                      <stop offset="100%" stopColor="rgba(220, 38, 38, 0)" />
                    </linearGradient>
                  </defs>
                  <polyline points="0,256 50,200 100,220 150,150 200,100 250,120 300,20 350,0 350,256 0,256" fill="url(#grad)" stroke="none" />
                </svg>
              </div>
            </div>
            <div className="mt-4 text-[10px] font-mono text-neutral-500 text-justify">
              {t.chartNote}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

