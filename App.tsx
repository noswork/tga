
import React, { useState, useEffect } from 'react';
import { Lang, ViewSection, ChatMessage } from './types';
import { translations } from './constants';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Terminal } from './components/Terminal';
import { Footer } from './components/Footer';
import { CharacterGallery } from './components/CharacterGallery';
import { GameTools } from './components/GameTools';
import { 
  detectBrowserLanguage, 
  getStoredLanguage, 
  saveLanguage, 
  getStoredTheme, 
  saveTheme,
  getStoredActiveSection,
  saveActiveSection
} from './utils/storage';

const App: React.FC = () => {
  // Initialize language: check localStorage first, then browser language, default to ZH
  const [lang, setLang] = useState<Lang>(() => {
    const stored = getStoredLanguage();
    if (stored !== null) return stored;
    return detectBrowserLanguage();
  });
  
  // Initialize active section: check localStorage first, default to 'home'
  const [activeSection, setActiveSection] = useState<ViewSection>(() => {
    const stored = getStoredActiveSection();
    return stored || 'home';
  });
  
  // Initialize theme: check localStorage first, default to true (dark)
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = getStoredTheme();
    if (stored !== null) return stored;
    return true;
  });
  
  // Lifted state for Terminal history persistence
  const [terminalMessages, setTerminalMessages] = useState<ChatMessage[]>([]);

  // Save language to localStorage whenever it changes
  useEffect(() => {
    saveLanguage(lang);
  }, [lang]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    saveTheme(isDark);
  }, [isDark]);

  // Save active section to localStorage whenever it changes
  useEffect(() => {
    saveActiveSection(activeSection);
  }, [activeSection]);

  // Sync dark mode class with isDark state
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  // Update document title based on language
  useEffect(() => {
    document.title = translations[lang].title;
  }, [lang]);

  // Update meta tags for URL preview (Open Graph & Twitter Cards)
  useEffect(() => {
    const t = translations[lang];
    const baseUrl = window.location.origin;
    
    // Helper function to update or create meta tag
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update title and description based on language
    const title = lang === Lang.ZH 
      ? `${t.title} | Tokyo Ghoul: Awakening`
      : `${t.title} | 東京喰種：覺醒`;
    
    const description = lang === Lang.ZH
      ? `非官方東京喰種Awakening工具。Unofficial Tokyo Ghoul Awakening tools.`
      : `Unofficial Tokyo Ghoul Awakening tools. 非官方東京喰種Awakening工具。`;

    // Update primary meta tags
    updateMetaTag('title', title, false);
    updateMetaTag('description', description, false);

    // Update Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', baseUrl);
    updateMetaTag('og:image', `${baseUrl}/assets/favicon/favicon.ico`);
    updateMetaTag('og:locale', lang === Lang.ZH ? 'zh_TW' : 'en_US');

    // Update Twitter Card tags
    updateMetaTag('twitter:title', title, false);
    updateMetaTag('twitter:description', description, false);
    updateMetaTag('twitter:url', baseUrl, false);
    updateMetaTag('twitter:image', `${baseUrl}/assets/favicon/favicon.ico`, false);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', baseUrl);
  }, [lang]);

  const toggleTheme = () => {
    setIsDark(prev => {
      const newValue = !prev;
      saveTheme(newValue);
      return newValue;
    });
  };

  return (
    <div className="h-screen w-full flex flex-col font-tech bg-ccg-light dark:bg-ghoul-black text-gray-900 dark:text-ccg-white selection:bg-ghoul-red selection:text-white dark:selection:text-black overflow-hidden transition-colors duration-300">
      
      {/* Background Ambient Lights - Fixed position */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-gray-300/30 dark:bg-ghoul-red/5 blur-[150px] rounded-full animate-pulse-fast"></div>
         <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-gray-400/20 dark:bg-purple-900/5 blur-[150px] rounded-full" ></div>
      </div>

      <Navbar 
        lang={lang} 
        setLang={setLang} 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
      
      {/* Main Container - Conditionally lock scroll for Terminal */}
      <main className={`flex-grow z-10 w-full h-full relative ${
        activeSection === 'terminal' 
          ? 'overflow-hidden' 
          : 'overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar'
      }`}>
        {activeSection === 'home' && (
          <>
            <Hero lang={lang} onEnterTerminal={() => setActiveSection('characters')} />
            <div className="snap-start w-full">
               <Footer lang={lang} />
            </div>
          </>
        )}
        
        {activeSection === 'characters' && (
          <div className="min-h-screen pt-24 w-full snap-start flex flex-col justify-between">
            <div className="flex-grow container mx-auto px-4">
              <CharacterGallery lang={lang} />
            </div>
            <Footer lang={lang} />
          </div>
        )}
        
        {activeSection === 'tools' && (
           <div className="min-h-screen pt-24 w-full snap-start flex flex-col justify-between">
            <div className="flex-grow w-full flex flex-col">
              <GameTools lang={lang} />
            </div>
            <Footer lang={lang} />
          </div>
        )}
        
        {activeSection === 'terminal' && (
           <div className="h-full pt-24 pb-0 w-full flex flex-col">
            <div className="flex-grow container mx-auto px-4 overflow-hidden">
              <Terminal 
                lang={lang} 
                messages={terminalMessages} 
                setMessages={setTerminalMessages} 
              />
            </div>
            {/* Hide footer on mobile/when in terminal to maximize chat space */}
            <div className="hidden lg:block shrink-0">
              <Footer lang={lang} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
