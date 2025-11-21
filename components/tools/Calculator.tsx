
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lang } from '../../types';
import { translations } from '../../constants';
import { X, Activity, ChevronRight, Zap } from 'lucide-react';

interface CalculatorProps {
  lang: Lang;
  onClose: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ lang, onClose }) => {
  const t = translations[lang].tools;
  const [currentLvl, setCurrentLvl] = useState(1);
  const [targetLvl, setTargetLvl] = useState(10);
  const [result, setResult] = useState<{ rc: number; gold: number } | null>(null);

  const calculateCost = () => {
    // Mock calculation logic for demonstration
    let rc = 0;
    let gold = 0;
    for (let i = currentLvl; i < targetLvl; i++) {
      rc += i * 150;
      gold += i * 1000;
    }
    setResult({ rc, gold });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-gray-700 w-full max-w-md relative shadow-2xl clip-angled flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/40">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <Activity className="text-ghoul-red" /> {t.calcTitle}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-ghoul-red/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">{t.currentLvl}</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={currentLvl}
                onChange={(e) => setCurrentLvl(parseInt(e.target.value) || 1)}
                className="w-full bg-black/50 border border-gray-700 text-white p-3 font-mono focus:border-ghoul-red outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">{t.targetLvl}</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={targetLvl}
                onChange={(e) => setTargetLvl(parseInt(e.target.value) || 1)}
                className="w-full bg-black/50 border border-gray-700 text-white p-3 font-mono focus:border-ghoul-red outline-none transition-colors"
              />
            </div>
          </div>

          <button 
            onClick={calculateCost}
            className="w-full py-3 bg-white text-black font-bold font-tech tracking-[0.2em] hover:bg-ghoul-red hover:text-white transition-all clip-button flex items-center justify-center gap-2"
          >
            {t.calculate} <ChevronRight size={16} />
          </button>

          {/* Result Display */}
          {result && (
            <div className="mt-6 p-4 bg-black/60 border border-gray-800 relative animate-in slide-in-from-bottom-2">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-ghoul-red"></div>
              <h3 className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-3">{t.result}</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-tech">{t.rcNeeded}</span>
                  <span className="text-ghoul-red font-bold font-mono flex items-center gap-2">
                    <Zap size={12} /> {result.rc.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-tech">{t.goldNeeded}</span>
                  <span className="text-yellow-500 font-bold font-mono">
                    {result.gold.toLocaleString()} G
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
