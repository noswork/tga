import React, { useState } from 'react';
import { GhoulInsightTab, Lang } from '../../types';
import { translations } from '../../constants';
import { GhoulScanner } from './GhoulScanner';
import { WikiData } from './WikiData';

interface GhoulInsightProps {
  lang: Lang;
}

export const GhoulInsight: React.FC<GhoulInsightProps> = ({ lang }) => {
  const [activeTab] = useState<GhoulInsightTab>('SCANNER');
  const _t = translations[lang].ghoulInsight;

  return (
    <section className="relative w-full h-full bg-ccg-light text-gray-900 dark:bg-[#050505] dark:text-[#e5e5e5] flex flex-col overflow-hidden selection:bg-red-900 selection:text-white">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[140px] pointer-events-none translate-x-1/3 translate-y-1/3"></div>

      <div className="relative z-10 flex flex-col h-full px-4 md:px-8 py-4 w-full min-h-0">
        <div className="flex-1 min-h-0 w-full">
          {activeTab === 'SCANNER' && <GhoulScanner lang={lang} />}
          {activeTab === 'DATABASE' && <WikiData lang={lang} />}
          {activeTab === 'ARCHIVES' && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 select-none p-4 gap-4">
              <div className="w-16 h-16 border border-neutral-700 border-dashed rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-neutral-600 rounded-full animate-ping"></div>
              </div>
              <div>
                <h3 className="font-display text-2xl mb-2">ARCHIVES LOCKED</h3>
                <p className="font-mono text-xs text-neutral-500 max-w-md">
                  特等搜查官等級以上才可檢視歷史紀錄。請使用喰種掃描或資料庫模式繼續操作。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

