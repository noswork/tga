
import React from 'react';
import { Lang } from '../types';
import { translations, missionsData } from '../constants';
import { MapPin, Skull, Gift } from 'lucide-react';

interface MissionLogProps {
  lang: Lang;
}

export const MissionLog: React.FC<MissionLogProps> = ({ lang }) => {
  const t = translations[lang].missions;

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'Easy': return 'text-green-400 border-green-400/30';
      case 'Normal': return 'text-blue-400 border-blue-400/30';
      case 'Hard': return 'text-orange-400 border-orange-400/30';
      case 'Nightmare': return 'text-ghoul-red border-ghoul-red/50 animate-pulse-slow';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
         <h2 className="text-2xl font-serif text-white tracking-widest flex items-center gap-3">
           <MapPin className="text-ghoul-red" /> {t.title}
         </h2>
         <span className="font-mono text-xs text-gray-500">UPDATED: 2024.10.23</span>
      </div>

      <div className="space-y-4">
        {missionsData.map((mission) => (
          <div 
            key={mission.id} 
            className="group bg-black/80 border-l-2 border-gray-800 hover:border-l-4 hover:border-l-ghoul-red transition-all duration-300 p-6 relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 relative z-10">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-ghoul-red transition-colors">{mission.title}</h3>
                  <span className={`text-xs font-mono px-2 py-0.5 border rounded ${getDifficultyColor(mission.difficulty)}`}>
                    {mission.difficulty}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4 font-serif italic border-l border-gray-700 pl-3">
                  "{mission.description}"
                </p>
              </div>

              <div className="min-w-[200px] bg-gray-900/50 p-3 rounded border border-gray-800">
                 <div className="text-[10px] text-gray-500 font-mono mb-2 flex items-center gap-1">
                   <Gift size={10} /> {t.rewards}
                 </div>
                 <ul className="space-y-1">
                   {mission.rewards.map((reward, idx) => (
                     <li key={idx} className="text-xs text-gray-300 font-mono flex items-center gap-2">
                       <span className="w-1 h-1 bg-ghoul-red rounded-full"></span>
                       {reward}
                     </li>
                   ))}
                 </ul>
              </div>
            </div>

            {/* Background Watermark */}
            <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 pointer-events-none">
               <Skull size={100} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
