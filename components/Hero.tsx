
import React, { useState, useEffect } from 'react';
import { Lang } from '../types';
import { translations } from '../constants';
import { ChevronRight, RefreshCw, ChevronsDown } from 'lucide-react';

interface HeroProps {
  lang: Lang;
  onEnterTerminal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ lang, onEnterTerminal }) => {
  const t = translations[lang].hero;
  const [count, setCount] = useState(1000);
  const [history, setHistory] = useState<number[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [randomQuote, setRandomQuote] = useState('');

  // Set random quote on mount or lang change
  useEffect(() => {
    const quotes = t.testSection.quotes;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setRandomQuote(quotes[randomIndex]);
  }, [lang, t.testSection.quotes]);

  const handleSubtract = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 100); // Short shake effect

    setCount(prev => {
      const next = prev - 7;
      // Keep last 5 numbers for history
      setHistory(h => [prev, ...h].slice(0, 5));
      return next < -999 ? 1000 : next;
    });
  };

  const resetCount = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCount(1000);
    setHistory([]);
  };

  return (
    <>
      {/* SECTION 1: HERO TITLE & CTA */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center snap-start overflow-hidden">
        
        {/* Background Effects for Section 1 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10 dark:opacity-30 pointer-events-none animate-[spin_60s_linear_infinite]">
          {[...Array(12)].map((_, i) => (
             <div 
               key={i}
               className="absolute top-1/2 left-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-ghoul-red to-transparent origin-left"
               style={{ transform: `rotate(${i * 30}deg) translateY(-50%)` }}
             >
               <div className="absolute right-0 w-2 h-2 bg-ghoul-red rounded-full shadow-[0_0_10px_#ff0000]"></div>
             </div>
          ))}
        </div>

        <div className="relative z-20 text-center px-4 w-full max-w-5xl mt-16">
          {/* Glitch Title Container - Blue/Black/Red Grid Flashing, No Skew */}
          <div className="relative mb-10 cursor-default select-none group flex justify-center">
            <div className="relative inline-block">
              {/* Base Layer (Black/White) */}
              <h1 className="relative z-30 text-6xl md:text-8xl lg:text-9xl font-ghoul font-bold text-black dark:text-white leading-none tracking-wide mix-blend-normal">
                {t.title}
              </h1>
              
              {/* Glitch Layer: Red Split (Grid Mask) */}
              <h1 
                className="absolute top-0 left-0 z-20 text-6xl md:text-8xl lg:text-9xl font-ghoul font-bold text-ghoul-red opacity-80 leading-none tracking-wide animate-glitch-grid mix-blend-hard-light"
                aria-hidden="true"
                style={{ clipPath: 'inset(0 0 0 0)' }}
              >
                {t.title}
              </h1>

              {/* Glitch Layer: Cyan/Blue Split (Grid Mask Inverse) */}
              <h1 
                className="absolute top-0 left-0 z-10 text-6xl md:text-8xl lg:text-9xl font-ghoul font-bold text-ghoul-cyan opacity-80 leading-none tracking-wide animate-glitch-rgb mix-blend-hard-light"
                aria-hidden="true"
                style={{ animationDirection: 'reverse', clipPath: 'inset(0 0 0 0)' }}
              >
                {t.title}
              </h1>

              {/* Grid Flash Overlay */}
              <div className="absolute inset-0 z-40 pointer-events-none mix-blend-overlay bg-grid-overlay opacity-20 animate-pulse-fast"></div>
            </div>

            <div className="hidden md:block absolute -bottom-4 right-4 md:right-20 text-ghoul-red font-tech text-sm tracking-[0.8em] uppercase animate-pulse">
              {t.subtitle}
            </div>
          </div>
          
          <div className="bg-white/60 dark:bg-ghoul-black/60 border border-gray-300 dark:border-ghoul-red/30 p-6 mb-10 max-w-xl mx-auto backdrop-blur-sm clip-angled relative group shadow-lg dark:shadow-none transition-all duration-300">
            <div className="absolute top-0 left-0 w-2 h-2 bg-ghoul-red"></div>
            <div className="absolute top-0 right-0 w-2 h-2 bg-ghoul-red"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-ghoul-red"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-ghoul-red"></div>
            
            <p className="text-gray-800 dark:text-ccg-white font-ghoul font-bold text-lg md:text-xl leading-relaxed group-hover:text-ghoul-red transition-colors duration-500">
              {t.quote}
            </p>
          </div>

          <button 
            onClick={onEnterTerminal}
            className="group relative inline-flex items-center gap-4 px-10 py-3 bg-ghoul-red text-white dark:text-black font-bold uppercase tracking-[0.2em] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-300 clip-button font-tech shadow-xl shadow-ghoul-red/30"
          >
            <span className="relative z-10 text-base">{t.cta}</span>
            <ChevronRight className="relative z-10 group-hover:translate-x-2 transition-transform" size={18} />
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 animate-pulse"></div>
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 animate-bounce opacity-50">
          <ChevronsDown className="text-ghoul-red w-8 h-8" />
        </div>
      </section>

      {/* SECTION 2: 1000-7 FULL PAGE DESIGN */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center snap-start bg-gray-100 dark:bg-[#1a1a1d] overflow-hidden border-t border-ghoul-red/20 transition-colors duration-500">
         
         {/* Centipede/Mental Background */}
         <div className="absolute inset-0 opacity-20 dark:opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-ghoul-red/20 via-transparent to-transparent animate-pulse-fast"></div>
         <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
         
         {/* Random Quote Container (Top) */}
         <div className="relative z-20 mb-12 px-6 animate-in fade-in slide-in-from-top-10 duration-1000">
            <div className="relative py-4 px-8 text-center border-y border-ghoul-red/50 bg-white/50 dark:bg-black/30 backdrop-blur-sm">
               <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-ghoul-red"></div>
               <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-ghoul-red"></div>
               <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-ghoul-red"></div>
               <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-ghoul-red"></div>
               
               <p className="font-ghoul font-bold text-lg md:text-2xl text-ghoul-crimson dark:text-ghoul-red tracking-widest drop-shadow-sm">
                 「{randomQuote}」
               </p>
            </div>
         </div>

         {/* 1000-7 Container */}
         <div className="relative z-10 w-full max-w-2xl px-4">
           <div 
             className={`relative bg-white dark:bg-[#18181b] border-2 border-ghoul-crimson/50 overflow-hidden cursor-pointer group select-none transition-all duration-300 ${isShaking ? 'translate-x-2 translate-y-2' : ''}`}
             onClick={handleSubtract}
             style={{ boxShadow: '0 0 40px rgba(138, 0, 0, 0.15)' }}
           >
              {/* Scanlines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.02)_50%,transparent_50%)] dark:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_50%,transparent_50%)] bg-[size:100%_4px] pointer-events-none z-20"></div>

              <div className="relative z-10 py-16 flex flex-col items-center justify-center min-h-[350px]">
                 {/* Header */}
                 <div className="absolute top-6 left-6 text-ghoul-crimson dark:text-ghoul-red font-tech text-xs tracking-[0.3em] flex items-center gap-3 opacity-80">
                   <div className="w-2 h-2 bg-ghoul-red rounded-full animate-ping"></div>
                   {t.testSection.mentalStatus}
                 </div>

                 {/* Reset Button */}
                 <button 
                    onClick={resetCount}
                    className="absolute top-6 right-6 text-ghoul-crimson hover:text-black dark:hover:text-white transition-colors z-30 opacity-50 hover:opacity-100 bg-gray-200 dark:bg-black/50 p-2 rounded"
                    title="Reset Test"
                 >
                    <RefreshCw size={20} />
                 </button>

                 {/* Main Number with Horror Font - Centered & Massive */}
                 <div className="relative flex items-center justify-center py-4 mt-8">
                   <span className="text-7xl md:text-9xl font-horror text-ghoul-crimson dark:text-ghoul-red leading-none tracking-normal drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_10px_10px_rgba(0,0,0,0.9)] animate-drip select-none"
                         style={{ textShadow: '3px 3px 0px #500000' }}>
                     {count}
                   </span>
                   
                   {/* Ghost Numbers (History) - Spiraling */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full flex items-center justify-center pointer-events-none">
                      {history.map((num, idx) => (
                         <span 
                           key={idx} 
                           className="absolute text-5xl md:text-6xl font-horror text-ghoul-red mix-blend-multiply dark:mix-blend-screen"
                           style={{ 
                             transform: `translate(${Math.sin(idx * 2) * 50}px, ${Math.cos(idx * 2) * 30}px) scale(${1 - (idx * 0.2)}) rotate(${Math.random() * 20 - 10}deg)`,
                             opacity: (0.4 - (idx * 0.05)),
                             filter: 'blur(2px)'
                           }}
                         >
                           {num}
                         </span>
                      ))}
                   </div>
                 </div>

                 {/* Subtitle */}
                 <div className="mt-12 text-gray-600 dark:text-gray-400 font-ghoul font-bold text-xl tracking-[0.5em] group-hover:text-black dark:group-hover:text-white transition-colors uppercase text-center animate-pulse px-4">
                    {t.testSection.question}
                 </div>
                 
                 <div className="mt-2 text-ghoul-red/60 font-tech text-xs tracking-widest">
                    [{t.testSection.clickPrompt}]
                 </div>
              </div>

              {/* Blood Bar Progress */}
              <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-200 dark:bg-gray-900">
                 <div 
                   className="h-full bg-ghoul-red transition-all duration-300 ease-out shadow-[0_0_10px_#ff0000]"
                   style={{ width: `${Math.max(0, (count / 1000) * 100)}%` }}
                 ></div>
              </div>
           </div>
         </div>
      </section>
    </>
  );
};