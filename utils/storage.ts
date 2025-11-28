import { Lang, ChatMessage, TerminalMode } from '../types';

const STORAGE_KEYS = {
  LANGUAGE: 'tga-language',
  THEME: 'tga-theme',
  TERMINAL_MESSAGES: 'tga-terminal-messages',
  ACTIVE_SECTION: 'tga-active-section',
} as const;

// Language detection based on browser settings
export const detectBrowserLanguage = (): Lang => {
  if (typeof window === 'undefined') return Lang.EN;
  
  const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || 'en';
  // Check if browser language starts with 'zh' (covers zh, zh-CN, zh-TW, etc.)
  return browserLang.toLowerCase().startsWith('zh') ? Lang.ZH : Lang.EN;
};

// Language storage
export const getStoredLanguage = (): Lang | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  if (stored === Lang.EN || stored === Lang.ZH) {
    return stored;
  }
  return null;
};

export const saveLanguage = (lang: Lang): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
};

// Theme storage
export const getStoredTheme = (): boolean | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored === 'true') return true;
  if (stored === 'false') return false;
  return null;
};

export const saveTheme = (isDark: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.THEME, String(isDark));
};

// Terminal messages storage (grouped by mode)
export interface TerminalMessagesByMode {
  [mode: string]: ChatMessage[];
}

export const getStoredTerminalMessages = (): TerminalMessagesByMode => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TERMINAL_MESSAGES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to parse stored terminal messages:', e);
  }
  return {};
};

export const saveTerminalMessages = (messagesByMode: TerminalMessagesByMode): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TERMINAL_MESSAGES, JSON.stringify(messagesByMode));
  } catch (e) {
    console.warn('Failed to save terminal messages:', e);
  }
};

export const getMessagesForMode = (mode: TerminalMode): ChatMessage[] => {
  const allMessages = getStoredTerminalMessages();
  return allMessages[mode] || [];
};

export const saveMessagesForMode = (mode: TerminalMode, messages: ChatMessage[]): void => {
  const allMessages = getStoredTerminalMessages();
  allMessages[mode] = messages;
  saveTerminalMessages(allMessages);
};

// Active section storage
import { ViewSection } from '../types';

const VIEW_SECTIONS: ViewSection[] = [
  'home',
  'characters',
  'tools',
  'terminal',
  'ghoulLab',
  'toybox',
  'ghoulInsight',
];

export const getStoredActiveSection = (): ViewSection | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SECTION) as ViewSection | null;
  if (stored && VIEW_SECTIONS.includes(stored)) {
    return stored;
  }
  return null;
};

export const saveActiveSection = (section: ViewSection): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SECTION, section);
};

