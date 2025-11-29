import React from 'react';
import { X, Target, Settings, Download, CheckCircle, Trash2, Eraser, Monitor, Share2 } from 'lucide-react';
import { Lang } from '../../../../types';
import { translations } from '../../../../constants';
import { MarkMode, AnnotationMode } from '../types';
import { COLORS, SIZE_OPTIONS } from '../config';

interface ControlPanelProps {
  lang: Lang;
  onClose: () => void;
  markMode: MarkMode;
  setMarkMode: (mode: MarkMode) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  exportQuality: number;
  setExportQuality: (quality: number) => void;
  isExporting: boolean;
  onExport: () => void;
  onClearAll: () => void;
  annotationMode: AnnotationMode;
   onShare: () => void;
   isSharing: boolean;
   shareMessage?: string | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  lang,
  onClose,
  markMode,
  setMarkMode,
  selectedColor,
  setSelectedColor,
  exportQuality,
  setExportQuality,
  isExporting,
  onExport,
  onClearAll,
  annotationMode,
  onShare,
  isSharing,
  shareMessage,
}) => {
  const t = translations[lang].tools.map;
  const qT = t.quality;

  return (
    <div className="w-full lg:w-80 bg-white dark:bg-[#18181b] border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-zinc-800 flex flex-col z-20 shadow-2xl relative transition-colors duration-300 order-2 lg:order-1 h-auto max-h-[45%] lg:max-h-full lg:h-full shrink-0">
      <div className="p-2 lg:p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-gray-50 dark:bg-[#202023]">
        <div className="flex items-center gap-2 lg:gap-3">
          <Target className="text-ghoul-red animate-pulse" size={18} />
          <h2 className="font-serif font-bold tracking-widest text-sm lg:text-base">{t.panelTitle}</h2>
        </div>
        <button onClick={onClose} className="hover:text-ghoul-red transition-colors flex items-center gap-1 text-[10px] lg:text-xs font-bold border border-gray-300 dark:border-zinc-700 px-2 py-1 rounded">
          <X size={12}/> {t.close}
        </button>
      </div>

      <div className="flex-grow p-2 lg:p-4 overflow-y-auto space-y-3 lg:space-y-5 overscroll-contain">
        <div className={`transition-opacity duration-300 ${annotationMode !== 'none' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <h3 className="text-[10px] lg:text-[11px] font-mono text-gray-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">{t.blockMarking}</h3>
          <div className="flex gap-2 bg-gray-100 dark:bg-black/30 p-1 rounded-lg border border-gray-200 dark:border-transparent">
            <button onClick={() => setMarkMode('add')} className={`flex-1 py-1 lg:py-2 px-1 lg:px-2 rounded text-[10px] lg:text-xs font-bold font-tech transition-all ${markMode === 'add' ? 'bg-ghoul-red text-white shadow-md' : 'text-gray-500 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'}`}>
              <CheckCircle size={10} className="inline mr-1" /> {t.markingMode}
            </button>
            <button onClick={() => setMarkMode('remove')} className={`flex-1 py-1 lg:py-2 px-1 lg:px-2 rounded text-[10px] lg:text-xs font-bold font-tech transition-all ${markMode === 'remove' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'}`}>
              <Eraser size={10} className="inline mr-1" /> {t.clearMode}
            </button>
          </div>
        </div>

        <div className={`transition-opacity duration-300 ${annotationMode !== 'none' || markMode === 'remove' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <h3 className="text-[10px] lg:text-[11px] font-mono text-gray-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">{t.markerColor}</h3>
          <div className="grid grid-cols-6 lg:grid-cols-4 gap-1.5 lg:gap-2">
            {COLORS.map(c => (
              <button key={c} onClick={() => setSelectedColor(c)} className={`w-5 h-5 lg:w-8 lg:h-8 rounded-full border-2 transition-all transform hover:scale-110 ${selectedColor === c ? 'border-gray-500 dark:border-white shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent'}`} style={{ backgroundColor: c }} />
            ))}
            <div className="relative w-5 h-5 lg:w-8 lg:h-8 rounded-full border-2 border-gray-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center hover:border-gray-400 dark:hover:border-zinc-500">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 opacity-50"></div>
              <input type="color" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={(e) => setSelectedColor(e.target.value)} />
              <Settings size={12} className="relative z-10 pointer-events-none text-gray-600 dark:text-gray-400"/>
            </div>
          </div>
        </div>

        {/* Export Quality Selector */}
        <div className="pt-2 lg:pt-5 border-t border-gray-200 dark:border-zinc-800">
          <h3 className="text-[10px] lg:text-[11px] font-mono text-gray-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wider flex items-center gap-2">
            <Monitor size={10} /> {qT.title}
          </h3>
          <div className="flex gap-1.5">
            <button onClick={() => setExportQuality(1)} className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition-all border ${exportQuality === 1 ? 'bg-gray-800 text-white border-gray-600' : 'bg-transparent text-gray-500 border-gray-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5'}`}>
              1x
            </button>
            <button onClick={() => setExportQuality(2)} className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition-all border ${exportQuality === 2 ? 'bg-ghoul-red text-white border-red-500' : 'bg-transparent text-gray-500 border-gray-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5'}`}>
              2x
            </button>
            <button onClick={() => setExportQuality(4)} className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition-all border ${exportQuality === 4 ? 'bg-purple-600 text-white border-purple-500' : 'bg-transparent text-gray-500 border-gray-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5'}`}>
              4x
            </button>
          </div>
          <div className="text-[9px] text-gray-400 dark:text-zinc-600 mt-1 text-right font-mono">
            {exportQuality === 1 ? qT.q1 : exportQuality === 2 ? qT.q2 : qT.q3}
          </div>
        </div>

        <div className="pt-2 lg:pt-3 space-y-2 lg:space-y-3">
          <button onClick={onClearAll} className="w-full py-1.5 lg:py-2.5 rounded border border-red-500/30 dark:border-red-900/50 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-[10px] lg:text-xs font-bold font-tech flex items-center justify-center gap-2">
            <Trash2 size={12} /> {t.clearAll}
          </button>

          <button
            onClick={onShare}
            disabled={isSharing}
            className="w-full py-1.5 lg:py-2.5 rounded border border-blue-500/40 dark:border-blue-400/50 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-[10px] lg:text-xs font-bold font-tech flex items-center justify-center gap-2"
          >
            <Share2 size={12} />
            {isSharing ? t.sharing : t.shareLink}
          </button>
          <div className="text-[9px] text-gray-400 dark:text-zinc-500 text-right font-mono min-h-[1.25rem]">
            {shareMessage || t.shareHint}
          </div>

          <button onClick={onExport} disabled={isExporting} className="w-full py-2 lg:py-3 bg-ghoul-red text-white font-bold font-tech tracking-[0.2em] clip-button hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 text-[10px] lg:text-sm">
            {isExporting ? <span className="animate-pulse">{t.exporting}</span> : <><Download size={14} /> {t.exportMap}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

