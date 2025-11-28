import React from 'react';
import { Lang, ViewSection } from '../types';
import { translations } from '../constants';
import { Terminal as TerminalIcon, Home, Database, Wrench, Menu, X, Eye } from 'lucide-react';

interface NavbarProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  activeSection: ViewSection;
  setActiveSection: (section: ViewSection) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

// Custom Kakugan Icon
const KakuganIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all duration-500" style={{ pointerEvents: 'none' }}>
    {/* Sclera */}
    <path 
      d="M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5Z" 
      className={isActive ? "fill-black stroke-red-600" : "fill-white stroke-gray-400"} 
      strokeWidth="1.5"
      style={{ pointerEvents: 'none' }}
    />
    {/* Iris */}
    <circle 
      cx="12" cy="12" r="4" 
      className={isActive ? "fill-red-600" : "fill-gray-400"}
      style={{ pointerEvents: 'none' }}
    />
    {/* Veins (Visible only when active) */}
    {isActive && (
      <>
        <path d="M16 12L20 10" stroke="#EF4444" strokeWidth="1" style={{ pointerEvents: 'none' }} />
        <path d="M8 12L4 14" stroke="#EF4444" strokeWidth="1" style={{ pointerEvents: 'none' }} />
        <path d="M12 8L11 6" stroke="#EF4444" strokeWidth="1" style={{ pointerEvents: 'none' }} />
      </>
    )}
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ lang, setLang, activeSection, setActiveSection, isDark, toggleTheme }) => {
  const t = translations[lang];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleLang = () => {
    setLang(lang === Lang.EN ? Lang.ZH : Lang.EN);
  };

  const navItems = [
    { id: 'home' as ViewSection, icon: Home, label: t.nav.home },
    { id: 'characters' as ViewSection, icon: Database, label: t.nav.characters },
    { id: 'tools' as ViewSection, icon: Wrench, label: t.nav.tools },
    { id: 'ghoulInsight' as ViewSection, icon: Eye, label: t.nav.insight },
    { id: 'terminal' as ViewSection, icon: TerminalIcon, label: t.nav.terminal },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-all duration-500">
      <div className="container mx-auto px-4 h-24 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center cursor-pointer group" 
          onClick={() => setActiveSection('home')}
        >
           <div className="flex flex-col justify-center drop-shadow-lg">
             <span className="text-2xl font-bold text-black dark:text-white tracking-tighter group-hover:text-ghoul-red transition-colors font-ghoul uppercase leading-none text-shadow-sm">{t.brandTitle}</span>
             <span className="text-[10px] tracking-[0.6em] uppercase text-ghoul-red font-mono mt-1 font-bold text-shadow-sm">{t.brandSubtitle}</span>
           </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`relative px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-all duration-300 clip-button backdrop-blur-sm ${
                activeSection === item.id 
                  ? 'bg-ghoul-red/90 text-white shadow-[0_0_15px_rgba(255,0,0,0.4)]' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <item.icon size={14} />
                <span>{item.label}</span>
              </div>
            </button>
          ))}

          <div className="h-8 w-px bg-white/20 mx-4 skew-x-[-20deg]"></div>

          <div className="flex gap-2 items-center">
            <button 
              onClick={toggleLang}
              className="px-4 py-2 bg-black/40 border border-white/20 text-ghoul-red font-mono text-xs font-bold hover:border-ghoul-red hover:bg-ghoul-red hover:text-white transition-all duration-300 clip-button backdrop-blur-sm"
            >
              {lang === Lang.EN ? 'ZH' : 'EN'}
            </button>
            
            <button 
              onClick={toggleTheme}
              className="group relative p-2 rounded-full hover:bg-white/10 transition-colors duration-300 backdrop-blur-sm"
              title="Toggle Kakugan"
              style={{ pointerEvents: 'auto' }}
              type="button"
            >
              <KakuganIcon isActive={isDark} />
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-4">
           <button 
            onClick={toggleTheme}
            className="p-1 bg-black/20 rounded-full backdrop-blur-sm"
            style={{ pointerEvents: 'auto' }}
            type="button"
          >
            <KakuganIcon isActive={isDark} />
          </button>
           <button 
            onClick={toggleLang}
            className="text-xs font-mono text-ghoul-red border border-ghoul-red/30 bg-black/40 px-2 py-1 backdrop-blur-sm"
          >
            {lang === Lang.EN ? 'ZH' : 'EN'}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:text-ghoul-red transition-colors drop-shadow-md">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black/95 border-b border-ghoul-red/50 backdrop-blur-xl absolute w-full z-50 shadow-xl">
          <div className="flex flex-col p-6 space-y-4">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-4 p-4 border-l-2 transition-all ${
                  activeSection === item.id 
                  ? 'border-ghoul-red text-ghoul-red bg-ghoul-red/5' 
                  : 'border-gray-800 text-gray-400'
                }`}
              >
                <item.icon size={20} />
                <span className="font-mono text-sm uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};