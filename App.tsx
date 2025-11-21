
import React, { useState, useEffect } from 'react';
import { Lang, ViewSection, ChatMessage } from './types';
import { translations } from './constants';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Terminal } from './components/Terminal';
import { Footer } from './components/Footer';
import { CharacterGallery } from './components/CharacterGallery';
import { GameTools } from './components/GameTools';

const App: React.FC = () => {
  const [lang, setLang] = useState<Lang>(Lang.ZH);
  const [activeSection, setActiveSection] = useState<ViewSection>('home');
  const [isDark, setIsDark] = useState(true);
  
  // Lifted state for Terminal history persistence
  const [terminalMessages, setTerminalMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

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
