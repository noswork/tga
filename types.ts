export enum Lang {
  EN = 'en',
  ZH = 'zh'
}

export type ViewSection =
  | 'home'
  | 'characters'
  | 'tools'
  | 'terminal'
  | 'ghoulLab'
  | 'toybox';

export interface Cell {
  id: string;
  imgFile: string;
  name: string;
  rarity: number;
  statType: string;
  description: string;
  uniqueSkillName: string | null;
  uniqueSkillSegments: { text: string; isEffect: boolean }[] | null;
  effectDefs: Record<string, string> | null;
  baseStat: number | null;
  stat1: string | null;
  stat2: string | null;
  stat3: string | null;
  stat4: string | null;
}

export type TerminalMode = 'GAME';

export interface Skill {
  name: string;
  type: 'Active' | 'Passive';
  description: string;
}

export interface EffectSegment {
  text: string;
  isEffect: boolean;
  effectName?: string;
  effectDesc?: string;
}

export interface ActiveSkillLevel {
  lv: number;
  name: string;
  description: string;
  effects: EffectSegment[];
}

export interface ActiveSkill {
  type: 'Active';
  skillNum: number;
  levels: ActiveSkillLevel[];
}

export interface PassiveSkill {
  type: 'Passive';
  subtype: 'passive' | 'rank' | 'gift';
  name: string;
  description: string;
  effects: EffectSegment[];
}

export interface TierEffect {
  description: string;
}

export interface Tier {
  tier: number;
  effects: TierEffect[];
}

export type CharacterCategory = 'No Organization' | 'CCG Higher Rank Investigator' | 'CCG Lower Rank Investigator' | 'Aogiri Tree' | 'Anteiku' | 'Boss' | 'Cadre';

export interface Character {
  id: string;
  title: string;
  name: string;
  fullName: string;
  rarity: 'SP' | 'SSR' | 'SR' | 'R';
  organization: CharacterCategory;
  stats: {
    hp: number;
    atk: number;
    def: number;
  };
  attribute?: '力' | '技' | '速' | '心' | '知';
  tactic?: '輸出' | '輔助' | '控制' | '均衡' | '爆發';
  baseCp?: number;
  cellCp3x?: number;
  cellCp4x?: number;
  activeSkills: ActiveSkill[];
  passiveSkills: PassiveSkill[];
  tiers: Tier[];
  effectDefs: Record<string, string>;
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
    lab: string;
    terminal: string;
    toybox: string;
    insight: string;
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
      shareLink: string;
      sharing: string;
      shareHint: string;
      shareCopied: string;
      shareFailed: string;
      mapVersion: string;
      quality: {
        title: string;
        q1: string;
        q2: string;
        q3: string;
      };
      annotation: {
        title: string;
        addArrow: string;
        addRectangle: string;
        addText: string;
        startSketching: string;
        drag: string;
        selectColor: string;
        undo: string;
        clear: string;
        done: string;
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
    credits: string;
    disclaimer: string;
    license: string;
    designedBy: string;
    established: string;
  };
  ghoulLab: {
    title: string;
    subtitle: string;
    uploadHint: string;
    dropLabel: string;
    analyzing: string;
    analyzeCta: string;
    ratingHeader: string;
    abilityHeader: string;
    legendHeader: string;
    quoteLabel: string;
    errorNoImage: string;
    errorInvalidFile: string;
    errorGeneric: string;
    quotePool: string[];
  };
  toybox: {
    title: string;
    subtitle: string;
    uploadCta: string;
    dropHint: string;
    analyzing: string;
    analyzeAgain: string;
    deckLabel: string;
    ratingDial: string;
    appetiteLabel: string;
    threatLabel: string;
    vibeLabel: string;
    anticsLabel: string;
    quoteLabel: string;
    quoteInstruction: string;
    legendLabel: string;
    legendDesc: string;
    resultPlaceholder: string;
    playfulMeter: string;
    quotePool: string[];
  };
  ghoulInsight: {
    tabs: {
      scanner: string;
      scannerDesc: string;
      database: string;
      databaseDesc: string;
      archives: string;
      archivesDesc: string;
    };
    scanner: {
      liveFeed: string;
      uploadTarget: string;
      uploadHint: string;
      reset: string;
      loadingTitle: string;
      loadingSubtitle: string;
      loadingSearch: string;
      idleTitle: string;
      battlePower: string;
      survivalRate: string;
      ward: string;
      mask: string;
      rcFactor: string;
      analysisTitle: string;
      analysisMatchFound: string;
      countermeasure: string;
    };
    wiki: {
      headerTitle: string;
      headerSubtitle: string;
      definitionTitle: string;
      definitionBody1: string;
      definitionBody2: string;
      criteriaTitle: string;
      criteriaIntro: string;
      rankDescriptions: {
        SSS: string;
        SS: string;
        S_PLUS: string;
        S_MINUS: string;
        A: string;
        B: string;
        C: string;
      };
      sideTitle: string;
      sideChartTitleLine1: string;
      sideChartTitleLine2: string;
      chartNote: string;
    };
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  timestamp: number;
  sources?: { uri: string; title: string }[];
}

export type GhoulRatingRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface GhoulLabReport {
  alias: string;
  rating: {
    rank: GhoulRatingRank;
    description: string;
    threatLevel: string;
    rcLevel: string;
    countermeasure: string;
  };
  kaguneProfile: string;
  abilityHighlights: string[];
  temperament: string;
  quote: string;
}

export enum GhoulThreatRating {
  SSS = 'SSS',
  SS = 'SS',
  S_PLUS = 'S+',
  S_MINUS = 'S-',
  A = 'A',
  B = 'B',
  C = 'C',
  UNKNOWN = '?'
}

export interface GhoulInsightAnalysis {
  rating: GhoulThreatRating;
  alias: string;
  rcType: 'Ukaku (羽赫)' | 'Koukaku (甲赫)' | 'Rinkaku (鱗赫)' | 'Bikaku (尾赫)' | 'Unknown';
  rcFactor: number;
  battlePower: number;
  commentary: string;
  traits: string[];
  maskDesign: string;
  countermeasure: string;
  survivalRate: string;
  ward: string;
}

export type GhoulInsightTab = 'SCANNER' | 'DATABASE' | 'ARCHIVES';
