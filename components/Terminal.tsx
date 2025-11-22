
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Lang, ChatMessage, TerminalMode } from '../types';
import { translations } from '../constants';
import { generateGhoulResponse } from '../services/geminiService';
import { Trash2, AlertTriangle, Terminal as TerminalIcon, Cpu, Activity, Power, Zap, ExternalLink, Gamepad2, Feather, Globe } from 'lucide-react';
import { getMessagesForMode, saveMessagesForMode } from '../utils/storage';

interface TerminalProps {
  lang: Lang;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

// Component for Typewriter Effect with Markdown Support
const TypewriterText: React.FC<{ text: string; onComplete?: () => void; onUpdate?: () => void }> = ({ text, onComplete, onUpdate }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset state when text changes
    if (!text) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    // Check if text is already fully displayed (restoring history)
    // If we want to re-animate history on every mount, keep it. 
    // But usually for history we want instant render. 
    // For this specific "Typewriter" component, we usually use it for *new* messages.
    // However, simply running the effect is safer for now.
    
    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (index < text.length) {
        // Add multiple characters at once for faster rendering on long text
        const charsToAdd = text.length > 200 ? 4 : 2;
        const nextIndex = Math.min(index + charsToAdd, text.length);
        const sub = text.substring(index, nextIndex);
        
        setDisplayedText((prev) => prev + sub);
        index = nextIndex;
        
        if (onUpdate) onUpdate();
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, 10); // Typing speed

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]);

  return (
    <div className="relative markdown-container text-base md:text-lg leading-relaxed">
      <ReactMarkdown
        components={{
           strong: ({node, ...props}) => <span className="text-ghoul-red font-bold" {...props} />,
           a: ({node, ...props}) => <a className="text-ghoul-cyan hover:underline decoration-dashed" target="_blank" rel="noopener noreferrer" {...props} />,
           ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
           ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
           code: ({node, ...props}) => <code className="bg-black/30 text-ghoul-red px-1 py-0.5 rounded font-mono text-sm border border-ghoul-red/20" {...props} />,
           p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
           h1: ({node, ...props}) => <h1 className="text-xl font-bold text-ghoul-red mt-4 mb-2" {...props} />,
           h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mt-3 mb-2" {...props} />,
           h3: ({node, ...props}) => <h3 className="text-base font-bold text-gray-300 mt-2 mb-1" {...props} />,
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {isTyping && (
        <span className="inline-block w-2 h-5 bg-ghoul-red ml-1 animate-cursor-blink align-middle shadow-[0_0_5px_#ff0000]"></span>
      )}
    </div>
  );
};

// Component for Hacking/Loading Animation
const LoadingIndicator: React.FC<{ lang: Lang }> = ({ lang }) => {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState(0);
  
  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    
    const interval = setInterval(() => {
      // Random character Matrix effect
      let randomStr = '';
      for(let i=0; i< 8; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const phases = lang === Lang.EN 
        ? ['DECRYPTING RC DATA', 'SYNCHRONIZING KAKUHOU', 'BYPASSING CCG FIREWALL', 'GENERATING RESPONSE']
        : ['解析 RC 細胞數據', '同步赫包頻率', '繞過 CCG 防火牆', '生成回應中'];

      if (Math.random() > 0.8) {
         setPhase(p => (p + 1) % phases.length);
      }
      
      setText(`${phases[phase]}... [${randomStr}]`);
    }, 100);

    return () => clearInterval(interval);
  }, [lang, phase]);

  return (
    <div className="flex flex-col gap-2 font-tech p-4 border-l-4 border-ghoul-red bg-black/80 clip-angled max-w-md w-full">
      <div className="flex items-center gap-3 text-ghoul-red text-sm font-bold tracking-widest uppercase animate-pulse">
         <Zap size={18} className="animate-bounce" />
         <span className="font-mono text-shadow-sm">{text}</span>
      </div>
      {/* Glitchy Progress Bar - Fixed width issue */}
      <div className="w-full h-3 bg-gray-900 rounded-none overflow-hidden relative border border-gray-800">
         {/* Base Pulse Layer */}
         <div className="absolute inset-0 bg-ghoul-red/30 animate-pulse w-full"></div>
         
         {/* Scan Line - Adjusted for full width scanning */}
         <div className="absolute top-0 h-full bg-ghoul-red animate-scan-line opacity-100 w-[20%] shadow-[0_0_15px_#ff0000]"></div>
      </div>
    </div>
  );
};

export const Terminal: React.FC<TerminalProps> = ({ lang, messages, setMessages }) => {
  const t = translations[lang].terminal;
  const [input, setInput] = useState('');
  // messages state removed, now using props
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<TerminalMode>('GAME');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousModeRef = useRef<TerminalMode>(mode);
  const isInitialLoadRef = useRef(true);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const isSwitchingModeRef = useRef(false);

  // Keep messagesRef in sync with messages prop
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load messages for current mode from localStorage on mount
  useEffect(() => {
    if (isInitialLoadRef.current) {
      const storedMessages = getMessagesForMode(mode);
      if (storedMessages.length > 0) {
        setMessages(storedMessages);
        messagesRef.current = storedMessages;
      } else {
        // Initialize welcome messages ONLY if history is empty for this mode
        const welcomeMessages = [
          { role: 'model' as const, text: t.welcome, timestamp: Date.now() - 2000 },
          { role: 'model' as const, text: t.connecting, timestamp: Date.now() - 1000 },
          { role: 'model' as const, text: t.connected, timestamp: Date.now() }
        ];
        setMessages(welcomeMessages);
        messagesRef.current = welcomeMessages;
      }
      isInitialLoadRef.current = false;
      previousModeRef.current = mode;
    }
  }, [mode, t, setMessages]);

  // Handle mode change: save current mode's messages, load new mode's messages
  useEffect(() => {
    if (!isInitialLoadRef.current && previousModeRef.current !== mode) {
      isSwitchingModeRef.current = true;
      
      // Save previous mode's messages before switching (use ref to get current messages)
      const currentMessages = messagesRef.current;
      saveMessagesForMode(previousModeRef.current, currentMessages);
      
      // Load new mode's messages
      const storedMessages = getMessagesForMode(mode);
      if (storedMessages.length > 0) {
        setMessages(storedMessages);
        messagesRef.current = storedMessages;
      } else {
        // Initialize welcome messages for new mode if no history exists
        const welcomeMessages = [
          { role: 'model' as const, text: t.welcome, timestamp: Date.now() - 2000 },
          { role: 'model' as const, text: t.connecting, timestamp: Date.now() - 1000 },
          { role: 'model' as const, text: t.connected, timestamp: Date.now() }
        ];
        setMessages(welcomeMessages);
        messagesRef.current = welcomeMessages;
      }
      
      previousModeRef.current = mode;
      
      // Reset switching flag after state updates complete
      setTimeout(() => {
        isSwitchingModeRef.current = false;
      }, 0);
    }
  }, [mode, t, setMessages]);

  // Save messages to localStorage whenever they change (but not during initial load or mode switch)
  useEffect(() => {
    if (!isInitialLoadRef.current && !isSwitchingModeRef.current && messages.length > 0) {
      saveMessagesForMode(mode, messages);
    }
  }, [messages, mode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-focus logic
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    setTimeout(scrollToBottom, 100);

    const responseData = await generateGhoulResponse(input, lang, mode);

    setIsLoading(false);

    const modelMsg: ChatMessage = {
      role: 'model',
      text: responseData.text,
      timestamp: Date.now(),
      sources: responseData.sources
    };

    setMessages(prev => [...prev, modelMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearTerminal = () => {
    const clearedMessage: ChatMessage = {
      role: 'model',
      text: lang === Lang.EN ? 'LOGS CLEARED. SYSTEM READY.' : '記錄已清除。系統就緒。',
      timestamp: Date.now()
    };
    setMessages([clearedMessage]);
    saveMessagesForMode(mode, [clearedMessage]);
    inputRef.current?.focus();
  };

  const modeConfig = {
    GAME: { 
      icon: Gamepad2, 
      label: lang === Lang.EN ? 'GAME DATA' : '遊戲資料',
      color: 'text-green-500',
      bg: 'bg-green-500/10 border-green-500/50'
    },
    CREATIVE: { 
      icon: Feather, 
      label: lang === Lang.EN ? 'STORY MODE' : '創作模式',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10 border-purple-500/50'
    },
    SEARCH: { 
      icon: Globe, 
      label: lang === Lang.EN ? 'NET SEARCH' : '網絡搜尋',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 border-blue-500/50'
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto relative animate-in fade-in duration-700">
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-10 right-10 w-64 h-64 bg-ghoul-red/5 rounded-full blur-3xl animate-pulse-fast"></div>
         <div className="absolute bottom-20 left-10 w-96 h-96 bg-ghoul-cyan/5 rounded-full blur-3xl"></div>
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
      </div>

      {/* Terminal Header / Mode Switcher */}
      <div className="bg-black/80 backdrop-blur-md border-b-2 border-ghoul-red/50 p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-20 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <TerminalIcon className="text-ghoul-red animate-pulse" size={24} />
          <div>
             <h2 className="text-white font-bold font-tech tracking-[0.2em] text-xl">{t.title}</h2>
             <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                ONLINE // 127.0.0.1
             </div>
          </div>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex bg-gray-900/80 p-1 rounded border border-gray-700 overflow-x-auto max-w-full">
           {(Object.keys(modeConfig) as TerminalMode[]).map((m) => (
             <button
               key={m}
               onClick={() => {
                 setMode(m);
               }}
               className={`flex items-center gap-2 px-4 py-2 text-xs font-bold font-tech uppercase transition-all duration-300 whitespace-nowrap ${
                 mode === m 
                   ? `bg-gray-800 ${modeConfig[m].color} shadow-inner` 
                   : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
               }`}
             >
               {React.createElement(modeConfig[m].icon, { size: 16 })}
               <span className="hidden md:inline">{modeConfig[m].label}</span>
             </button>
           ))}
        </div>

        <button 
          onClick={clearTerminal}
          className="text-gray-500 hover:text-ghoul-red transition-colors text-xs font-mono flex items-center gap-2 uppercase tracking-wider border border-transparent hover:border-ghoul-red/30 px-3 py-1 rounded"
        >
          <Trash2 size={16} />
          <span className="hidden md:inline">{t.clear}</span>
        </button>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth relative z-10 bg-black/60 backdrop-blur-sm no-scrollbar">
         {messages.map((msg, idx) => (
           <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              
              {/* Role Label */}
              <div className={`text-xs font-mono mb-1 opacity-70 tracking-widest ${msg.role === 'user' ? 'text-ghoul-cyan' : 'text-ghoul-red'}`}>
                 {msg.role === 'user' ? '>> OPERATOR' : `>> SYSTEM // ${mode}`}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[95%] md:max-w-[85%] relative ${msg.role === 'model' ? 'w-full md:w-auto' : ''}`}>
                 {msg.role === 'user' ? (
                   <div className="bg-ghoul-cyan/10 border border-ghoul-cyan/30 text-gray-100 px-5 py-4 rounded-tl-lg rounded-bl-lg rounded-br-lg clip-angled font-tech text-base md:text-lg shadow-[0_0_10px_rgba(0,255,255,0.1)]">
                     {msg.text}
                   </div>
                 ) : (
                   <div className="bg-black/80 border-l-4 border-ghoul-red text-gray-200 px-5 md:px-8 py-5 font-mono shadow-[0_0_20px_rgba(255,0,0,0.1)] w-full relative overflow-hidden group">
                      {/* Scanline overlay for model messages */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20"></div>
                      
                      {/* Actual Text Content */}
                      {/* Logic: Only animate the LAST message if it was just added (simulated by checking index vs length). 
                          However, simple Typewriter for all model messages is fine as it fills quickly. */}
                      <TypewriterText 
                        text={msg.text} 
                        onUpdate={scrollToBottom}
                        onComplete={() => {
                           if (idx === messages.length - 1) {
                             inputRef.current?.focus();
                           }
                        }}
                      />
                      
                      {/* Sources Section */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-800/50">
                          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Globe size={14} /> {t.searchSources}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {msg.sources.map((source, sIdx) => (
                              <a 
                                key={sIdx}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-700 text-xs text-blue-400 hover:text-blue-300 hover:border-blue-500 transition-colors rounded"
                              >
                                <ExternalLink size={10} />
                                <span className="truncate max-w-[200px] font-mono">{source.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                   </div>
                 )}
              </div>
           </div>
         ))}

         {/* Loading State */}
         {isLoading && (
            <div className="flex flex-col items-start animate-in fade-in duration-300 w-full">
              <div className="text-xs font-mono mb-2 opacity-70 tracking-widest text-ghoul-red">{'>> SYSTEM_PROCESSING'}</div>
               <LoadingIndicator lang={lang} />
            </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-black/90 border-t border-ghoul-red/30 relative z-20 shrink-0">
         <div className="relative flex items-center gap-3 max-w-5xl mx-auto">
            {/* Glitchy Prompt Indicator */}
            <div className="text-ghoul-red font-bold font-mono text-2xl animate-pulse select-none">
              &gt;_
            </div>
            
            {/* Input Field - Optimized for Readability */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              disabled={isLoading}
              autoComplete="off"
              className="flex-grow bg-transparent text-white placeholder-gray-600 font-mono text-lg md:text-xl outline-none border-b-2 border-gray-800 focus:border-ghoul-red px-3 py-2 transition-all input-ghoul-focus disabled:opacity-50 font-bold tracking-wide"
            />
            
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-ghoul-red hover:bg-red-700 disabled:bg-gray-800 text-white p-3 rounded-sm clip-button transition-all duration-300 group"
            >
               {isLoading ? <Activity className="animate-spin" size={24} /> : <Power size={24} className="group-hover:scale-110 transition-transform" />}
            </button>
         </div>
         
         <div className="text-center mt-3">
           <span className="text-[10px] text-gray-600 font-mono uppercase tracking-[0.2em]">
             {t.disclaimer}
           </span>
         </div>
      </div>
    </div>
  );
};
