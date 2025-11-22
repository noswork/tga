
export enum Lang {
  EN = 'en',
  ZH = 'zh'
}

export type ViewSection = 'home' | 'characters' | 'tools' | 'terminal';

export type TerminalMode = 'GAME' | 'CREATIVE' | 'SEARCH';

export interface Skill {
  name: string;
  type: 'Active' | 'Passive';
  description: string;
}

export type CharacterCategory = 'CCG' | 'Anteiku' | 'Aogiri' | 'No Org';

export interface Character {
  id: string;
  name: string;
  rarity: 'SSR' | 'SR' | 'R';
  category: CharacterCategory;
  type: 'Ukaku' | 'Koukaku' | 'Rinkaku' | 'Bikaku' | 'Quinque';
  description: string;
  stats: {
    atk: number;
    def: number;
    spd: number;
  };
  skills: Skill[];
}

export interface Mission {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Nightmare';
  description: string;
  rewards: string[];
}

export interface Translation {
  title: string;
  brandTitle: string;
  brandSubtitle: string;
  nav: {
    home: string;
    characters: string;
    tools: string;
    terminal: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    quote: string;
    statsLabel: string;
    testSection: {
      quotes: string[];
      question: string;
      clickPrompt: string;
      mentalStatus: string;
    };
  };
  characters: {
    title: string;
    filterAll: string;
    stats: string;
    skills: string;
    back: string;
    profile: string;
    skillDetails: string;
    activeSkills: string;
    passiveSkills: string;
    unlocked: string;
    level: string;
    star: string;
    ccgDatabase: string;
    offline: string;
    terminated: string;
    noData: string;
  };
  tools: {
    title: string;
    strongholdTitle: string;
    strongholdDesc: string;
    openMap: string;
    statusOnline: string;
    statusOffline: string;
    fieldOps: string;
    restricted: string;
    comingSoon: string;
    awaitingAuth: string;
    map: {
      panelTitle: string;
      blockMarking: string;
      markingMode: string;
      clearMode: string;
      clearAll: string;
      exportMap: string;
      exporting: string;
      close: string;
      toggleLabels: string;
      markerColor: string;
      liveFeed: string;
      sectorInfo: string;
      quality: {
        title: string;
        q1: string;
        q2: string;
        q3: string;
      };
    };
    calcTitle: string;
    currentLvl: string;
    targetLvl: string;
    calculate: string;
    result: string;
    rcNeeded: string;
    goldNeeded: string;
  };
  terminal: {
    title: string;
    placeholder: string;
    welcome: string;
    connecting: string;
    connected: string;
    send: string;
    clear: string;
    disclaimer: string;
    searchSources: string;
  };
  missions: {
    title: string;
    rewards: string;
  };
  footer: {
    credits: string; // Used for "UNOFFICIAL FAN DATABASE" label usually
    disclaimer: string;
    license: string;
    designedBy: string;
    established: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  timestamp: number;
  sources?: { uri: string; title: string }[];
}
