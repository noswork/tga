import React, { useMemo, useRef, useState } from 'react';
import { translations } from '../constants';
import { GhoulLabReport, GhoulRatingRank, Lang } from '../types';
import { analyzeGhoulImage } from '../services/geminiService';
import { Camera, Activity, Sparkles, Zap, Quote, RefreshCw, Upload } from 'lucide-react';

interface GhoulLabProps {
  lang: Lang;
}

const ratingMeta: Record<GhoulRatingRank, { label: string; accent: string }> = {
  E: { label: 'Minimal threat', accent: 'from-gray-500/60 to-gray-800/80' },
  D: { label: 'Urban myth', accent: 'from-slate-500/60 to-slate-800/80' },
  C: { label: 'Low-tier ghoul', accent: 'from-emerald-500/40 to-emerald-900/60' },
  B: { label: 'Ward hazard', accent: 'from-lime-500/40 to-lime-900/60' },
  A: { label: 'Special class required', accent: 'from-orange-500/40 to-orange-900/70' },
  S: { label: 'SS-class candidate', accent: 'from-amber-500/50 to-red-900/70' },
  SS: { label: 'Nightmare level', accent: 'from-red-500/60 to-fuchsia-900/70' },
  SSS: { label: 'Apocalyptic', accent: 'from-ghoul-red/70 via-purple-800/70 to-black' },
};

const legendData: Array<{ rank: GhoulRatingRank; note: string }> = [
  { rank: 'E', note: 'Civilians / harmless humans' },
  { rank: 'D', note: 'Rumored ghoul sightings' },
  { rank: 'C', note: 'Confirmed ghoul, manageable' },
  { rank: 'B', note: 'Experienced investigator needed' },
  { rank: 'A', note: 'Special Class investigator recommended' },
  { rank: 'S', note: 'Equivalent to high-tier kagune wielders' },
  { rank: 'SS', note: 'Ward-devastating monsters' },
  { rank: 'SSS', note: 'Legendary threats (One-Eyed Kings)' },
];

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const GhoulLab: React.FC<GhoulLabProps> = ({ lang }) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<GhoulLabReport | null>(null);
  const [quote, setQuote] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentLegendAccent = useMemo(() => {
    if (!analysis) return ratingMeta.B;
    return ratingMeta[analysis.rating.rank];
  }, [analysis]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t.ghoulLab.errorInvalidFile);
      return;
    }

    setError(null);
    const dataUrl = await readFileAsDataUrl(file);
    setPreview(dataUrl);
    setAnalysis(null);
    await invokeAnalysis(dataUrl, file.type);
  };

  const invokeAnalysis = async (dataUrl: string, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      const [, base64] = dataUrl.split(',');
      const report = await analyzeGhoulImage({ data: base64, mimeType }, lang);
      const pool = t.ghoulLab.quotePool;
      setAnalysis(report);
      setQuote(report.quote || pool[Math.floor(Math.random() * pool.length)]);
    } catch (aiError) {
      console.error(aiError);
      setError(t.ghoulLab.errorGeneric);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 opacity-40 blur-3xl pointer-events-none" aria-hidden>
        <div className="absolute w-2/3 h-2/3 -top-24 -left-16 bg-ghoul-red/30 rounded-full animate-pulse-fast" />
        <div className="absolute w-1/2 h-1/2 bottom-0 right-0 bg-purple-900/40 rounded-full animate-float" />
      </div>

      <div className="relative z-10 h-full flex flex-col gap-6 pt-8 pb-4 px-4 lg:px-10">
        <header className="shrink-0">
          <p className="text-xs font-mono tracking-[0.4em] text-ghoul-red uppercase">{t.ghoulLab.title}</p>
          <h1 className="text-3xl md:text-4xl font-ghoul text-white mt-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.35)]">
            {t.ghoulLab.subtitle}
          </h1>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 overflow-hidden">
          <div className="bg-black/40 border border-ghoul-red/20 rounded-[32px] p-6 flex flex-col gap-4 backdrop-blur-2xl overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-ghoul-red tracking-[0.3em] uppercase">{t.ghoulLab.uploadHint}</p>
                <p className="text-sm text-gray-300 mt-1">{t.ghoulLab.dropLabel}</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-ghoul-red/40 text-xs font-mono uppercase tracking-[0.2em] text-white hover:bg-ghoul-red/20 transition"
              >
                <Upload size={14} />
                {preview ? t.ghoulLab.analyzeCta : 'UPLOAD'}
              </button>
            </div>

            <div
              className={`relative flex-1 border border-dashed rounded-3xl bg-ghoul-black/60 overflow-hidden transition-colors ${
                isDragging ? 'border-ghoul-red bg-ghoul-red/10' : 'border-ghoul-red/40'
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) {
                  processFile(file);
                }
              }}
            >
              {preview ? (
                <img src={preview} alt="Ghoul candidate" className="object-cover w-full h-full" />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-center text-gray-400 gap-3 px-4">
                  <Camera size={48} className="text-ghoul-red/70" />
                  <p className="font-tech text-lg">{t.ghoulLab.uploadHint}</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>

            {error && <p className="text-sm text-ghoul-red font-mono uppercase tracking-wide">{error}</p>}

            {preview && (
              <div className="flex items-center gap-3 text-gray-300 text-sm font-mono">
                <Activity size={18} className={isAnalyzing ? 'animate-spin text-ghoul-red' : 'text-ghoul-red'} />
                {isAnalyzing ? t.ghoulLab.analyzing : t.ghoulLab.analyzeCta}
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col overflow-hidden backdrop-blur-3xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-mono tracking-[0.4em] text-ghoul-red uppercase">{t.ghoulLab.ratingHeader}</p>
                {analysis && <p className="text-sm text-gray-400 mt-1">{analysis.rating.description}</p>}
              </div>
              {preview && (
                <button
                  onClick={() => {
                    if (preview) {
                      const mime = preview.split(';')[0].replace('data:', '') || 'image/png';
                      invokeAnalysis(preview, mime);
                    }
                  }}
                  className="p-2 rounded-full border border-white/20 text-white hover:text-ghoul-red hover:border-ghoul-red transition"
                  title="Rerun analysis"
                  type="button"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-6 flex-1 overflow-hidden">
              <div className={`rounded-3xl p-5 text-white bg-gradient-to-br ${currentLegendAccent.accent} border border-white/5`}>
                <p className="text-xs font-mono tracking-[0.5em]">RATING</p>
                <div className="flex items-end gap-3 mt-3">
                  <span className="text-5xl font-horror">{analysis?.rating.rank || '—'}</span>
                  <span className="text-sm uppercase tracking-[0.3em] opacity-70">
                    {analysis ? currentLegendAccent.label : 'Awaiting feed'}
                  </span>
                </div>
                <p className="text-sm text-gray-200 mt-2">{analysis?.rating.threatLevel || t.ghoulLab.errorNoImage}</p>
                {analysis && (
                  <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-mono">
                    <div className="bg-black/30 rounded-2xl p-3 border border-white/10">
                      <span className="block text-ghoul-red/80 tracking-[0.3em] uppercase">RC</span>
                      <p className="mt-1 text-white">{analysis.rating.rcLevel}</p>
                    </div>
                    <div className="bg-black/30 rounded-2xl p-3 border border-white/10">
                      <span className="block text-ghoul-red/80 tracking-[0.3em] uppercase">CCG</span>
                      <p className="mt-1 text-white">{analysis.rating.countermeasure}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-3xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 text-ghoul-red uppercase tracking-[0.3em] text-xs font-mono">
                    <Sparkles size={14} /> {t.ghoulLab.abilityHeader}
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-white/90">
                    {(analysis?.abilityHighlights || ['—']).map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start gap-2">
                        <Zap size={14} className="text-ghoul-red mt-1 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-black/30 rounded-3xl p-4 border border-white/10 flex flex-col">
                  <div className="flex items-center gap-2 text-ghoul-red uppercase tracking-[0.3em] text-xs font-mono">
                    <Activity size={14} /> Kagune
                  </div>
                  <p className="mt-3 text-white text-sm flex-1">{analysis?.kaguneProfile || 'Awaiting sample...'}</p>
                  <p className="mt-2 text-xs text-gray-400 font-mono uppercase tracking-[0.25em]">
                    {analysis?.temperament || 'No temperament data'}
                  </p>
                </div>
              </div>

              <div className="bg-black/40 rounded-3xl p-4 border border-white/10">
                <div className="flex items-center gap-3 text-ghoul-red uppercase tracking-[0.3em] text-xs font-mono">
                  <Quote size={14} /> {t.ghoulLab.quoteLabel}
                </div>
                <p className="mt-3 text-white text-lg font-serif italic">{analysis ? quote : ' '}</p>
              </div>

              <div className="bg-black/30 rounded-3xl p-4 border border-white/5">
                <p className="text-xs font-mono tracking-[0.3em] text-ghoul-red uppercase mb-3">{t.ghoulLab.legendHeader}</p>
                <div className="grid grid-cols-4 gap-3 text-center text-xs">
                  {legendData.map((item) => (
                    <div key={item.rank} className="p-2 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-lg font-horror text-white">{item.rank}</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
