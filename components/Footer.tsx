
import React from 'react';
import { Lang } from '../types';
import { translations } from '../constants';
import { FileText, ShieldCheck } from 'lucide-react';
import { FaDiscord, FaYoutube, FaPatreon, FaBilibili } from 'react-icons/fa6';
import { SiKofi } from 'react-icons/si';

interface FooterProps {
  lang: Lang;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = translations[lang].footer;

  return (
    <footer className="border-t border-gray-300 dark:border-gray-900 py-6 mt-auto bg-white dark:bg-black z-10 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute -bottom-2 -right-2 text-[60px] font-ghoul font-bold text-gray-100 dark:text-white/5 pointer-events-none opacity-50 select-none leading-none">
        GHOUL
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">

          {/* Left: Disclaimer & License */}
          <div className="flex flex-col gap-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-ghoul-red font-mono text-xs font-bold tracking-widest uppercase">
              <ShieldCheck size={14} />
              <span>{t.disclaimer}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 dark:text-gray-400 font-mono text-[10px] tracking-widest uppercase">
              <FileText size={10} />
              <span>{t.license}</span>
            </div>
          </div>

          {/* Center: Designer Credit */}
          <div className="flex flex-col items-center justify-center w-full md:w-auto">
            <div className="text-lg md:text-xl font-ghoul font-bold text-black dark:text-white mb-1 tracking-wide">
              {t.designedBy} <span className="text-ghoul-red drop-shadow-[0_0_5px_rgba(255,0,0,0.5)]">nos</span>
            </div>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-ghoul-red to-transparent"></div>
          </div>

          {/* Right: Socials */}
          <div className="flex flex-col gap-2 items-center md:items-end w-full md:w-auto">
            <div className="flex items-center gap-4 flex-wrap justify-center md:justify-end">
              <div className="group flex items-center gap-2 text-gray-500 hover:text-[#5865F2] transition-colors duration-300 cursor-pointer" title="Discord: noswork">
                <FaDiscord size={16} />
                <span className="text-xs font-mono font-bold tracking-wider group-hover:underline decoration-[#5865F2] decoration-2 underline-offset-4">noswork</span>
              </div>
              <a href="https://www.youtube.com/@noswork" target="_blank" rel="noreferrer"
                className="group flex items-center gap-2 text-gray-500 hover:text-[#FF0000] transition-colors duration-300" title="YouTube">
                <FaYoutube size={16} />
                <span className="text-xs font-mono font-bold tracking-wider group-hover:underline decoration-[#FF0000] decoration-2 underline-offset-4">YouTube</span>
              </a>
              <a href="https://ko-fi.com/nos1130" target="_blank" rel="noreferrer"
                className="group flex items-center gap-2 text-gray-500 hover:text-[#FF5E5B] transition-colors duration-300" title="Ko-fi">
                <SiKofi size={16} />
                <span className="text-xs font-mono font-bold tracking-wider group-hover:underline decoration-[#FF5E5B] decoration-2 underline-offset-4">Ko-fi</span>
              </a>
              <a href="https://www.patreon.com/cw/noswork" target="_blank" rel="noreferrer"
                className="group flex items-center gap-2 text-gray-500 hover:text-[#FF424D] transition-colors duration-300" title="Patreon">
                <FaPatreon size={16} />
                <span className="text-xs font-mono font-bold tracking-wider group-hover:underline decoration-[#FF424D] decoration-2 underline-offset-4">Patreon</span>
              </a>
              <a href="https://space.bilibili.com/252713343" target="_blank" rel="noreferrer"
                className="group flex items-center gap-2 text-gray-500 hover:text-[#00A1D6] transition-colors duration-300" title="Bilibili">
                <FaBilibili size={16} />
                <span className="text-xs font-mono font-bold tracking-wider group-hover:underline decoration-[#00A1D6] decoration-2 underline-offset-4">Bilibili</span>
              </a>
            </div>
            <div className="text-[9px] text-gray-400 dark:text-gray-700 font-tech tracking-[0.3em]">
              {t.established}
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};
