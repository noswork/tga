
import React, { useEffect, useState } from 'react';
import { Lang } from '../types';
import { translations } from '../constants';
import { Map as MapIcon, Wrench, AlertOctagon, ChevronRight, Lock } from 'lucide-react';
import { StrongholdMap } from './tools/StrongholdMap';

interface GameToolsProps {
  lang: Lang;
}

export const GameTools: React.FC<GameToolsProps> = ({ lang }) => {
  const t = translations[lang].tools;
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('map')) {
        setActiveTool('stronghold');
      }
    } catch {
      // ignore URL parsing errors in non-browser environments
    }
  }, []);

  const tools = [
    {
      id: 'stronghold',
      title: t.strongholdTitle,
      description: t.strongholdDesc,
      icon: MapIcon,
      actionLabel: t.openMap,
      status: t.statusOnline,
      statusColor: 'text-green-400',
      statusBg: 'bg-green-400/10 border-green-400/30',
      primaryColor: 'text-ghoul-red',
      hoverBorder: 'group-hover:border-ghoul-red'
    }
  ];

  // Render active tool as a fixed overlay to prevent scroll issues
  if (activeTool === 'stronghold') {
    return (
      <div className="fixed inset-0 z-40 pt-24 bg-ccg-light dark:bg-ghoul-black flex flex-col animate-in fade-in duration-300 overscroll-none touch-none">
         <StrongholdMap lang={lang} onClose={() => setActiveTool(null)} />
      </div>
    );
  }

  return (
    <div className="flex-grow w-full container mx-auto px-4 flex flex-col justify-center py-8">
        <div className="w-full max-w-6xl mx-auto animate-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="mb-12 border-b border-gray-300 dark:border-ghoul-red/30 pb-6">
                <h2 className="text-4xl font-serif font-bold text-black dark:text-white tracking-widest mb-2 flex items-center gap-3 text-glow">
                <Wrench className="text-ghoul-red" size={36} /> {t.title}
                </h2>
                <div className="flex items-center justify-between">
                <div className="text-xs font-tech text-gray-500 tracking-[0.3em]">{t.fieldOps}</div>
                <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-ghoul-red border border-ghoul-red/20 px-2 py-1 bg-ghoul-red/5 animate-pulse">
                    <AlertOctagon size={12} /> {t.restricted}
                </div>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {tools.map((tool) => (
                <div 
                key={tool.id}
                className={`group relative bg-white/80 dark:bg-black/60 border-2 border-gray-300 dark:border-gray-800 ${tool.hoverBorder} transition-all duration-300 clip-angled hover:shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_30px_rgba(255,0,0,0.15)] flex flex-col h-full overflow-hidden`}
                >
                {/* Background Grid & Scanline */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50"></div>
                
                {/* Content Container */}
                <div className="relative z-10 p-8 flex flex-col flex-grow h-full">
                    
                    {/* Top Row: Icon & Status */}
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 bg-gray-100 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 ${tool.primaryColor} shadow-inner`}>
                        <tool.icon size={32} />
                        </div>
                        
                        <div className={`flex items-center gap-2 px-3 py-1 rounded font-mono text-[10px] font-bold border tracking-widest ${tool.statusBg} ${tool.statusColor}`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-current ${tool.id === 'stronghold' ? 'animate-pulse' : ''}`}></div>
                        {tool.status}
                        </div>
                    </div>

                    {/* Title & Desc */}
                    <h3 className="text-2xl font-bold font-serif text-black dark:text-white mb-3 tracking-wide group-hover:text-ghoul-red transition-colors">
                        {tool.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 font-tech text-sm leading-relaxed mb-8 flex-grow">
                        {tool.description}
                    </p>

                    {/* Action Button */}
                    <div className="mt-auto">
                        <button 
                        onClick={() => tool.statusColor.includes('green') ? setActiveTool(tool.id) : null}
                        disabled={!tool.statusColor.includes('green')}
                        className={`w-full flex items-center justify-center gap-3 py-4 font-bold font-tech tracking-[0.2em] clip-button relative overflow-hidden group/btn transition-all duration-300 ${
                            tool.statusColor.includes('green') 
                            ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-ghoul-red dark:hover:bg-ghoul-red hover:text-white dark:hover:text-white cursor-pointer'
                            : 'bg-gray-200 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-300 dark:border-gray-800'
                        }`}
                        >
                        <span className="relative z-10 flex items-center gap-2">
                            {tool.actionLabel} {tool.statusColor.includes('green') ? <ChevronRight size={16} /> : <Lock size={16} />}
                        </span>
                        {/* Glitch hover effect only if active */}
                        {tool.statusColor.includes('green') && (
                            <div className="absolute inset-0 bg-ghoul-red translate-y-full group-hover/btn:translate-y-0 transition-transform duration-200"></div>
                        )}
                        </button>
                    </div>
                </div>
                
                {/* Corner Accents */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gray-300 dark:border-gray-700 group-hover:border-ghoul-red transition-colors opacity-50"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gray-300 dark:border-gray-700 group-hover:border-ghoul-red transition-colors opacity-50"></div>
                </div>
            ))}
            
            {/* Coming Soon Placeholder */}
            <div className="group relative bg-white/50 dark:bg-black/30 border-2 border-dashed border-gray-300 dark:border-gray-800 flex flex-col h-full items-center justify-center p-8 opacity-60 hover:opacity-100 transition-opacity min-h-[300px]">
                <div className="text-gray-400 dark:text-gray-600 mb-4">
                <AlertOctagon size={48} />
                </div>
                <h3 className="text-xl font-serif font-bold text-gray-500 dark:text-gray-500 mb-2">{t.comingSoon}</h3>
                <p className="text-xs font-mono text-gray-400">{t.awaitingAuth}</p>
            </div>
            </div>
        </div>
    </div>
  );
};
