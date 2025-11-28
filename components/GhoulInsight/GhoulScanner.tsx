import React, { useState, useRef } from 'react';
import { analyzeGhoulInsightImage } from '../../services/ghoulInsightService';
import { GhoulInsightAnalysis, Lang } from '../../types';
import { translations } from '../../constants';
import { ScannerEffect } from './ScannerEffect';
import { RatingDisplay } from './RatingDisplay';

interface GhoulScannerProps {
  lang: Lang;
}

export const GhoulScanner: React.FC<GhoulScannerProps> = ({ lang }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<GhoulInsightAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang].ghoulInsight.scanner;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setImage(base64String);
        setAnalysis(null);
        startAnalysis(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async (base64Data: string) => {
    setLoading(true);
    try {
      const result = await analyzeGhoulInsightImage(base64Data, lang);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const triggerInput = () => fileInputRef.current?.click();

  const handleReset = () => {
    setImage(null);
    setAnalysis(null);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-0 lg:p-4 animate-fade-in flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
      <div className="w-full lg:w-1/2 flex flex-col gap-3 h-full shrink-0">
        <div className="relative group rounded-sm overflow-hidden border-2 border-neutral-800 bg-neutral-900/50 shadow-2xl flex-1 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-8 bg-black/80 border-b border-red-900/30 flex items-center px-3 z-20 shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse mr-2"></div>
              <span className="text-[10px] font-mono text-red-500 tracking-widest">{t.liveFeed}</span>
          </div>

          <div
            className={`relative flex-1 w-full flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
              !image ? 'hover:bg-neutral-800/50 cursor-pointer' : 'bg-black'
            }`}
            onClick={!image ? triggerInput : undefined}
          >
            {!image ? (
              <div className="text-center p-6 border-2 border-dashed border-neutral-700 rounded-lg m-8 hover:border-red-500/50 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-neutral-600 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth={1}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth={1}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="font-mono text-red-500 text-sm tracking-widest">{t.uploadTarget}</p>
                <p className="font-mono text-neutral-600 text-xs mt-2">{t.uploadHint}</p>
              </div>
            ) : (
              <>
                <img src={image} alt="Subject" className="w-full h-full object-contain bg-neutral-900" />
                {loading && <ScannerEffect />}

                <div className="absolute inset-0 pointer-events-none opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none"></div>
              </>
            )}

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
          </div>
        </div>

        {image && !loading && (
          <button
            onClick={handleReset}
            className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-500 text-xs font-mono tracking-widest transition-all uppercase flex items-center justify-center gap-2 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {t.reset}
          </button>
        )}
      </div>

      <div className="w-full lg:w-1/2 h-full relative flex flex-col shrink-0">
        {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center border border-neutral-800 bg-black/40 backdrop-blur-sm h-full rounded-sm">
            <div className="flex gap-1 h-16 items-end mb-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 bg-red-600 animate-[pulse_0.5s_ease-in-out_infinite]"
                  style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}
                ></div>
              ))}
            </div>
            <div className="font-mono text-red-500 animate-pulse text-lg tracking-widest">{t.loadingTitle}</div>
            <div className="text-neutral-500 text-xs font-mono mt-2">{t.loadingSubtitle}</div>
            <div className="text-neutral-600 text-[10px] font-mono mt-1">{t.loadingSearch}</div>
          </div>
        ) : !analysis ? (
          <div className="h-full flex flex-col items-center justify-center border border-neutral-800/50 bg-neutral-900/20 text-neutral-600 rounded-sm">
            <div className="text-6xl font-display mb-4 opacity-20">CCG</div>
            <p className="font-mono text-sm tracking-widest">{t.idleTitle}</p>
          </div>
        ) : (
          <div className="h-full bg-black/40 border border-neutral-800 p-4 lg:p-5 flex flex-col relative overflow-hidden animate-[fadeIn_0.5s_ease-out] rounded-sm shadow-2xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] font-black opacity-[0.03] pointer-events-none select-none text-red-600 whitespace-nowrap font-display">
              CONFIDENTIAL
            </div>

            <div className="mb-2 border-b border-neutral-800 pb-2 relative z-10 shrink-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-1 py-0.5 bg-red-900/40 border border-red-900/60 text-red-400 text-[8px] font-mono font-bold leading-tight">
                      ID: {Math.floor(Math.random() * 100000).toString().padStart(6, '0')}
                    </span>
                    <span className="text-neutral-400 text-[8px] font-mono uppercase tracking-wider truncate leading-tight">
                      TYPE: <span className="text-neutral-200 font-semibold">{analysis.rcType}</span>
                    </span>
                  </div>
                  <h1 className="text-lg lg:text-xl xl:text-2xl font-black text-white uppercase tracking-tighter drop-shadow-lg leading-tight truncate">
                    {analysis.alias}
                  </h1>
                  <div className="mt-2 bg-neutral-900/50 border border-neutral-700/80 p-2 relative group flex flex-col justify-center max-w-xs">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-[10px] text-red-400 font-mono uppercase tracking-widest font-semibold">
                        {t.battlePower}
                      </span>
                      <span className="text-xl md:text-2xl font-mono font-bold text-white tracking-tight leading-none">
                        {analysis.battlePower.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-900 to-red-500 rounded-full"
                        style={{ width: `${Math.min((analysis.battlePower / 10000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <RatingDisplay rating={analysis.rating} />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 relative z-10 min-h-0 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 shrink-0">
                <div className="bg-neutral-900/50 border-l-2 border-neutral-700/80 p-3 flex flex-col justify-center">
                  <span className="block text-[10px] text-neutral-400 font-mono uppercase font-semibold mb-1">{t.ward}</span>
                  <span className="text-base md:text-lg text-neutral-100 font-display truncate leading-tight font-semibold">
                    {analysis.ward}
                  </span>
                </div>
                <div className="bg-neutral-900/50 border-l-2 border-neutral-700/80 p-3 flex flex-col justify-center">
                  <span className="block text-[10px] text-neutral-400 font-mono uppercase tracking-wider mb-1 font-semibold">
                    {t.rcFactor}
                  </span>
                  <span className="text-sm md:text-base text-red-400 font-mono font-bold leading-tight">
                    {Math.min(analysis.rcFactor, 100)}
                  </span>
                </div>
              </div>

              <div className="bg-neutral-900/50 border-l-2 border-neutral-700/80 p-3 min-h-[80px] shrink-0">
                <span className="block text-[10px] text-neutral-400 font-mono uppercase tracking-wider mb-2 font-semibold">
                  {t.mask}
                </span>
                <p className="text-xs md:text-sm text-neutral-200 leading-relaxed font-medium">
                  {analysis.maskDesign}
                </p>
              </div>

              <div className="flex flex-col bg-gradient-to-b from-neutral-900/60 to-transparent border-t border-neutral-700/80 shrink-0">
                <h4 className="flex items-center gap-2 text-neutral-300 font-mono text-[10px] uppercase px-3 pt-3 pb-2 shrink-0 font-semibold">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  {t.analysisTitle} // <span className="text-red-400 ml-1 font-bold">{t.analysisMatchFound}</span>
                </h4>
                <div className="px-3 pb-3">
                  <p className="text-neutral-100 text-sm md:text-base leading-relaxed font-serif italic whitespace-pre-wrap break-words">
                    "{analysis.commentary}"
                  </p>
                </div>
              </div>

              <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-sm shrink-0">
                <h4 className="text-red-400 font-mono text-[10px] uppercase mb-2 flex items-center gap-2 font-semibold">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {t.countermeasure}
                </h4>
                <p className="text-neutral-200 text-sm md:text-base font-semibold tracking-wide leading-relaxed whitespace-pre-wrap break-words">
                  {analysis.countermeasure}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 shrink-0 pt-1 pb-2">
                {analysis.traits.map((trait, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-neutral-900/60 text-neutral-300 text-[9px] font-mono border border-neutral-700/60 uppercase tracking-wider font-medium"
                  >
                    #{trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

