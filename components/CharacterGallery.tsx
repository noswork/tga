
import React, { useState } from 'react';
import { Lang, Character, CharacterCategory } from '../types';
import { translations, charactersData } from '../constants';
import { Shield, Zap, Crosshair, Sword, Activity, Database, X, Star, Lock, Sparkles, Flame, AlertTriangle } from 'lucide-react';

interface CharacterGalleryProps {
  lang: Lang;
}

const TypeIcon = ({ type, size = 18 }: { type: Character['type']; size?: number }) => {
  switch (type) {
    case 'Ukaku': return <Zap className="text-yellow-600 dark:text-yellow-500" size={size} />;
    case 'Koukaku': return <Shield className="text-blue-600 dark:text-blue-500" size={size} />;
    case 'Rinkaku': return <Activity className="text-red-600 dark:text-red-500" size={size} />;
    case 'Bikaku': return <Sword className="text-green-600 dark:text-green-500" size={size} />;
    case 'Quinque': return <Crosshair className="text-gray-500 dark:text-gray-300" size={size} />;
    default: return null;
  }
};

export const CharacterGallery: React.FC<CharacterGalleryProps> = ({ lang }) => {
  const t = translations[lang].characters;
  const [filter, setFilter] = useState<'ALL' | CharacterCategory>('ALL');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'passive'>('active');

  // Temporarily empty data
  const filteredData: Character[] = [];

  const activeSkill = selectedChar?.skills.find(s => s.type === 'Active');
  const passiveSkills = selectedChar?.skills.filter(s => s.type === 'Passive') || [];

  // Render the skill detailed modal
  if (selectedChar) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedChar(null)}
        ></div>
        
        {/* Modal Container */}
        <div className="relative w-full max-w-5xl max-h-[90vh] aspect-video md:aspect-[16/9] md:h-auto h-full flex flex-col shadow-2xl overflow-hidden bg-[#2c2f38]">
           
           {/* Top Bar */}
           <div className="h-10 md:h-12 bg-[#1a1c23] flex items-center justify-between px-4 border-b border-[#3a3d4a] relative z-20 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-serif font-bold text-white tracking-widest">{t.skillDetails}</h2>
                <div className="text-[10px] font-tech text-gray-500 uppercase tracking-wider hidden md:block">TOKYO GHOUL</div>
              </div>
              <button 
                onClick={() => setSelectedChar(null)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={24} strokeWidth={3} />
              </button>
           </div>

           {/* Content Body */}
           <div className="flex flex-grow relative overflow-hidden">
              
              {/* Left Sidebar */}
              <div className="w-14 md:w-16 bg-[#22252e] flex flex-col relative z-10 border-r border-[#1a1c23] flex-shrink-0">
                <div className="mt-0">
                   {/* Active Tab Button */}
                   <button 
                     onClick={() => setActiveTab('active')}
                     className={`w-full h-14 md:h-16 relative text-left transition-all duration-300 group flex items-center justify-center ${
                       activeTab === 'active' ? 'bg-[#8a0000]' : 'bg-[#1a1c23] hover:bg-[#2a2d36]'
                     }`}
                   >
                      <div className="relative z-10">
                         <Sword size={20} className={activeTab === 'active' ? 'text-white' : 'text-gray-500'} />
                      </div>
                      {activeTab === 'active' && (
                         <div className="absolute right-0 top-0 h-full w-1 bg-red-500"></div>
                      )}
                   </button>

                   {/* Passive Tab Button */}
                   <button 
                     onClick={() => setActiveTab('passive')}
                     className={`w-full h-14 md:h-16 relative text-left transition-all duration-300 group border-t border-[#1a1c23] flex items-center justify-center ${
                       activeTab === 'passive' ? 'bg-[#8a0000]' : 'bg-[#1a1c23] hover:bg-[#2a2d36]'
                     }`}
                   >
                      <div className="relative z-10">
                         <Shield size={20} className={activeTab === 'passive' ? 'text-white' : 'text-gray-500'} />
                      </div>
                      {activeTab === 'passive' && (
                         <div className="absolute right-0 top-0 h-full w-1 bg-red-500"></div>
                      )}
                   </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-grow bg-[#e5e7eb] dark:bg-[#e5e7eb] relative overflow-y-auto p-2 md:p-4">
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#d1d5db_1px,transparent_1px),linear-gradient(to_bottom,#d1d5db_1px,transparent_1px)] bg-[size:20px_20px] opacity-40 pointer-events-none"></div>
                
                <div className="relative z-10 h-full flex flex-col">
                   
                   {/* ACTIVE SKILL VIEW */}
                   {activeTab === 'active' && activeSkill && (
                     <div className="h-full flex flex-col justify-center gap-2 md:gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        
                        {/* Evolution Cards */}
                        <div className="flex-grow-0 flex items-center justify-center">
                           <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full justify-center">
                              {[1, 2, 3].map((star) => (
                                <React.Fragment key={star}>
                                  {/* Card */}
                                  <div className="flex flex-col items-center gap-1 min-w-[80px]">
                                     <div className={`relative w-28 h-40 rounded-md overflow-hidden border-2 shadow-xl transition-transform duration-500 hover:scale-105 flex-shrink-0 ${
                                       star === 3 ? 'border-purple-500 shadow-purple-500/30' : 
                                       star === 2 ? 'border-yellow-500 shadow-yellow-500/30' : 'border-gray-400'
                                     }`}>
                                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center overflow-hidden">
                                            <div className={`w-full h-full opacity-80 bg-gradient-to-b ${
                                              star === 3 ? 'from-purple-900 to-black' : 
                                              star === 2 ? 'from-yellow-900 to-black' : 'from-gray-700 to-black'
                                            }`}></div>
                                            <TypeIcon type={selectedChar.type} size={32} />
                                        </div>
                                        
                                        {/* Star Badge */}
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                           {[...Array(star)].map((_, i) => (
                                             <Star key={i} size={8} className="fill-yellow-400 text-yellow-400" />
                                           ))}
                                        </div>
                                        
                                        {/* Type Badge */}
                                        <div className="absolute top-1 right-1 bg-red-600 rounded-full p-0.5">
                                           <Sword size={10} className="text-white" />
                                        </div>
                                     </div>
                                  </div>
                                </React.Fragment>
                              ))}
                           </div>
                        </div>

                        {/* Description Box */}
                        <div className="bg-[#18181b] border border-gray-700 p-3 md:p-4 relative rounded-sm shadow-2xl mx-auto max-w-lg w-full">
                           <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-red-600"></div>
                           <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-red-600"></div>
                           
                           <div className="text-center">
                              <h4 className="text-white font-bold text-sm md:text-base mb-1">{activeSkill.name}</h4>
                              <p className="text-gray-300 font-tech text-xs md:text-sm leading-relaxed">
                                 {activeSkill.description.split(' ').map((word, i) => {
                                   if (word.includes('%') || word.length > 8) {
                                     return <span key={i} className="text-yellow-500 font-bold mx-1">{word}</span>
                                   }
                                   return <span key={i} className="mx-1">{word}</span>
                                 })}
                              </p>
                              <div className="mt-2 text-[10px] text-gray-500 font-tech border-t border-gray-800 pt-1">
                                 *Max Dmg 250% at 3 <Star size={8} className="inline" />
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   {/* PASSIVE SKILL VIEW */}
                   {activeTab === 'passive' && (
                     <div className="flex flex-col gap-2 h-full overflow-y-auto pr-1 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {passiveSkills.map((skill, idx) => (
                          <div key={idx} className="bg-[#1f2229] border border-gray-700 rounded-lg overflow-hidden shadow-lg shrink-0">
                             <div className="p-2 md:p-3 flex items-center gap-3">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-red-900 to-black border-2 border-red-700 flex items-center justify-center shrink-0">
                                   {idx % 2 === 0 ? <Flame size={18} className="text-white" /> : <Sparkles size={18} className="text-white" />}
                                </div>
                                <div className="flex-grow">
                                   <div className="flex justify-between items-center mb-0.5">
                                      <h4 className="text-white font-bold text-sm">{skill.name}</h4>
                                      <span className="text-gray-400 text-[9px] font-tech border border-gray-600 px-1 rounded">{t.unlocked}</span>
                                   </div>
                                   <div className="h-px w-full bg-gradient-to-r from-red-800/50 to-transparent mb-1"></div>
                                   <p className="text-gray-300 text-[10px] md:text-xs leading-snug font-sans">
                                      {skill.description}
                                   </p>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  const filters: (CharacterCategory | 'ALL')[] = ['ALL', 'CCG', 'Anteiku', 'Aogiri', 'No Org'];

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-300 dark:border-ghoul-red/30 pb-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-black dark:text-white tracking-widest mb-2 flex items-center gap-3">
             <Database className="text-ghoul-red" /> {t.title}
          </h2>
          <div className="text-xs font-tech text-gray-500 tracking-[0.3em]">{t.ccgDatabase}</div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filters.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 text-xs font-tech font-bold border uppercase tracking-wider transition-all clip-button ${
                filter === type 
                  ? 'bg-ghoul-red border-ghoul-red text-white shadow-lg shadow-ghoul-red/20' 
                  : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-800 hover:border-gray-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-black/20">
        <div className="relative">
          <Database size={64} className="text-gray-300 dark:text-gray-700 mb-6" />
          <AlertTriangle size={24} className="absolute -bottom-2 -right-2 text-ghoul-red animate-pulse" />
        </div>
        <p className="text-2xl font-tech font-bold text-gray-400 dark:text-gray-600 tracking-[0.5em] mb-2">{t.offline}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-ghoul-red rounded-full animate-pulse"></div>
          <p className="text-xs font-tech text-ghoul-red tracking-widest">{t.terminated}</p>
        </div>
        <p className="mt-4 text-gray-400 font-serif italic opacity-60">{t.noData}</p>
      </div>
    </div>
  );
};
