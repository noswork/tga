import React from 'react';

export const ScannerEffect: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm border border-red-900/50 bg-black/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
      <div className="absolute w-full h-1 bg-red-500/80 shadow-[0_0_15px_rgba(220,38,38,0.8)] animate-[scan_2s_ease-in-out_infinite]" style={{ top: '0%' }}></div>

      <div className="text-red-500 font-mono text-sm tracking-widest animate-pulse mb-2">
        ANALYZING BIO-SIGNATURE...
      </div>
      <div className="font-mono text-xs text-red-700">
        RC_CELL_COUNT: <span className="text-red-400">{Math.floor(Math.random() * 9000)}</span>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

