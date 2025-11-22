
import { Lang, Translation, Character } from './types';

export const translations: Record<Lang, Translation> = {
  [Lang.EN]: {
    title: 'Tokyo Ghoul: Awakening',
    brandTitle: 'Tokyo Ghoul',
    brandSubtitle: 'Awakening',
    nav: {
      home: 'HUB',
      characters: 'DATABASE',
      tools: 'UTILS',
      terminal: 'TERMINAL',
    },
    hero: {
      title: 'TOKYO GHOUL',
      subtitle: 'AWAKENING // DATABASE',
      cta: 'INITIALIZE ARCHIVE',
      quote: '"The world is not wrong. It is just... broken."',
      statsLabel: 'SYSTEM_MONITORING',
      testSection: {
        quotes: [
          "I am a ghoul.",
          "All suffering in the world is born from an individual's incompetence.",
          "I won't forgive anyone who threatens my peace.",
          "The only way to change is to cast away who you are."
        ],
        question: "What is 1000 minus 7?",
        clickPrompt: "CLICK TO SUBTRACT",
        mentalStatus: "MENTAL STABILITY: CRITICAL",
      }
    },
    characters: {
      title: 'SUBJECT ARCHIVE',
      filterAll: 'ALL SUBJECTS',
      stats: 'BATTLE DATA',
      skills: 'COMBAT SKILLS',
      back: 'RETURN TO GRID',
      profile: 'SUBJECT PROFILE',
      skillDetails: 'SKILL DETAILS',
      activeSkills: 'ACTIVE SKILL',
      passiveSkills: 'PASSIVE SKILL',
      unlocked: 'UNLOCKED',
      level: 'LV.',
      star: 'STAR',
      ccgDatabase: 'CCG_INTERNAL_DATABASE_V2.0',
      offline: 'DATABASE_OFFLINE',
      terminated: 'CONNECTION_TERMINATED',
      noData: '"No subject data found in the current archive."',
    },
    tools: {
      title: 'FIELD OPERATIONS',
      strongholdTitle: 'STRONGHOLD MAP',
      strongholdDesc: 'Interactive tactical map displaying resource nodes, territories, and stronghold locations.',
      openMap: 'INITIALIZE MAP',
      statusOnline: 'SYSTEM ACTIVE',
      statusOffline: 'OFFLINE',
      fieldOps: 'CCG_FIELD_OPERATIONS_DIV // SECTOR 20',
      restricted: 'RESTRICTED ACCESS',
      comingSoon: 'MORE TOOLS COMING SOON',
      awaitingAuth: 'AWAITING CCG AUTHORIZATION...',
      map: {
        panelTitle: 'TACTICAL PANEL',
        blockMarking: 'ZONE MARKING',
        markingMode: 'MARK MODE',
        clearMode: 'CLEAR MODE',
        clearAll: 'CLEAR ALL MARKS',
        exportMap: 'EXPORT MAP',
        exporting: 'PROCESSING...',
        close: 'DISCONNECT',
        toggleLabels: 'TOGGLE LABELS',
        markerColor: 'MARKER COLOR',
        liveFeed: 'LIVE FEED',
        sectorInfo: 'SECTOR 20 // WARD 11\nRC DENSITY: HIGH',
        quality: {
          title: 'EXPORT QUALITY',
          q1: 'Standard',
          q2: 'High (2x)',
          q3: 'Ultra (4x)'
        }
      },
      calcTitle: 'RC CALCULATOR',
      currentLvl: 'CURRENT LEVEL',
      targetLvl: 'TARGET LEVEL',
      calculate: 'CALCULATE COST',
      result: 'CALCULATION RESULT',
      rcNeeded: 'RC CELLS NEEDED',
      goldNeeded: 'GOLD NEEDED',
    },
    terminal: {
      title: 'INTERFACE // TYPE-GEMINI',
      placeholder: 'Input query...',
      welcome: 'SYSTEM INITIALIZED.',
      connecting: 'ESTABLISHING SECURE CONNECTION...',
      connected: 'LINK ESTABLISHED.',
      send: 'EXECUTE',
      clear: 'PURGE LOGS',
      disclaimer: 'UNOFFICIAL INTERFACE.',
      searchSources: 'DATA SOURCES',
    },
    missions: {
      title: 'ACTIVE OPERATIONS',
      rewards: 'REWARDS',
    },
    footer: {
      credits: 'UNOFFICIAL FAN DATABASE',
      disclaimer: 'UNOFFICIAL FAN PROJECT',
      license: 'LICENSE: MIT',
      designedBy: 'DESIGNED BY',
      established: 'ESTABLISHED 2024',
    },
  },
  [Lang.ZH]: {
    title: '東京喰種：覺醒',
    brandTitle: '東京喰種',
    brandSubtitle: '覺醒',
    nav: {
      home: '中心',
      characters: '檔案庫',
      tools: '裝置',
      terminal: '終端',
    },
    hero: {
      title: '東京喰種',
      subtitle: 'Awakening // 覺醒',
      cta: '讀取檔案',
      quote: '「錯的不是我，是這個世界……」',
      statsLabel: '系統監控中',
      testSection: {
        quotes: [
          "我是……喰種。",
          "世上所有的不公，都是當事者能力不足所致。",
          "我不會原諒任何威脅我平靜生活的人。",
          "寧願被別人傷害，也不願傷害別人。"
        ],
        question: "1000 減 7 是多少？",
        clickPrompt: "點擊進行扣除",
        mentalStatus: "精神狀態：臨界點",
      }
    },
    characters: {
      title: 'CCG 檔案資料',
      filterAll: '所有對象',
      stats: '戰鬥數值',
      skills: '赫子技能',
      back: '返回列表',
      profile: '對象檔案',
      skillDetails: '技能詳情',
      activeSkills: '主動技能',
      passiveSkills: '被動技能',
      unlocked: '已解鎖',
      level: '等級',
      star: '星級',
      ccgDatabase: 'CCG 內部資料庫 V2.0',
      offline: '資料庫離線',
      terminated: '連線已終止',
      noData: '「當前檔案庫中未發現對象資料。」',
    },
    tools: {
      title: '戰術作戰裝置',
      strongholdTitle: '據點地圖',
      strongholdDesc: '顯示資源點、領地控制與據點位置的互動式戰術地圖。',
      openMap: '啟動地圖',
      statusOnline: '系統運作中',
      statusOffline: '離線',
      fieldOps: 'CCG 戰地作戰科 // 第 20 區',
      restricted: '存取受限',
      comingSoon: '更多功能開發中',
      awaitingAuth: '等待 CCG 授權...',
      map: {
        panelTitle: '戰術面板',
        blockMarking: '區塊標記',
        markingMode: '標記模式',
        clearMode: '清除模式',
        clearAll: '清除所有標記',
        exportMap: '導出地圖',
        exporting: '處理中...',
        close: '中斷連線',
        toggleLabels: '顯示座標',
        markerColor: '標記顏色',
        liveFeed: '實時監控',
        sectorInfo: '第 20 區 // 11 支部\nRC 濃度：高',
        quality: {
          title: '導出畫質',
          q1: '標準',
          q2: '高畫質 (2x)',
          q3: '超清 (4x)'
        }
      },
      calcTitle: 'RC 計算機',
      currentLvl: '當前等級',
      targetLvl: '目標等級',
      calculate: '計算消耗',
      result: '計算結果',
      rcNeeded: '所需 RC 細胞',
      goldNeeded: '所需金幣',
    },
    terminal: {
      title: '戰術 AI // 代號 NOS',
      placeholder: '輸入指令...',
      welcome: '系統初始化完成。',
      connecting: '正在建立加密連線...',
      connected: '連線已建立。',
      send: '執行',
      clear: '清除記錄',
      disclaimer: '非官方工具。',
      searchSources: '資料來源',
    },
    missions: {
      title: '作戰任務',
      rewards: '任務獎勵',
    },
    footer: {
      credits: '非官方粉絲資料庫',
      disclaimer: '非官方粉絲專案',
      license: '授權：MIT',
      designedBy: '設計者',
      established: '成立於 2024',
    },
  },
};

export const charactersData: Character[] = [
  {
    id: 'kaneki-ssr',
    name: 'Ken Kaneki (Awakened)',
    rarity: 'SSR',
    category: 'Anteiku',
    type: 'Rinkaku',
    description: 'Subject possesses extreme regeneration capabilities and multiple kagune tentacles. High threat level. Analysis indicates mental instability potentially increasing combat efficacy.',
    stats: { atk: 2500, def: 1200, spd: 180 },
    skills: [
      { name: 'Centipede Thrash', type: 'Active', description: 'Deals 300% damage to a single target and inflicts Bleed.' },
      { name: 'Half-Kakuja', type: 'Passive', description: 'Increases ATK by 20% when HP is below 50%.' },
      { name: 'Regeneration', type: 'Passive', description: 'Recovers 5% HP at the start of each turn.' }
    ]
  },
  {
    id: 'touka-sr',
    name: 'Touka Kirishima',
    rarity: 'SR',
    category: 'Anteiku',
    type: 'Ukaku',
    description: 'High mobility subject. Specializes in crystallized projectiles. Engagement advised at close range, though subject demonstrates high agility. Stamina depletion observed in prolonged combat.',
    stats: { atk: 1800, def: 900, spd: 220 },
    skills: [
      { name: 'Shard Barrage', type: 'Active', description: 'Deals AoE damage to front row enemies.' },
      { name: 'Evasion Instinct', type: 'Passive', description: '25% chance to dodge incoming attacks.' }
    ]
  },
  {
    id: 'arima-ssr',
    name: 'Kishou Arima',
    rarity: 'SSR',
    category: 'CCG',
    type: 'Quinque',
    description: 'Special Class Investigator. Wields IXA. Combat capability exceeds all known ghoul ratings. The "White Reaper" of the CCG.',
    stats: { atk: 2800, def: 1500, spd: 200 },
    skills: [
      { name: 'IXA: Shield Mode', type: 'Active', description: 'Nullifies the next 3 attacks received.' },
      { name: 'Narukami Blast', type: 'Active', description: 'Deals massive electrical damage ignoring 50% DEF.' },
      { name: 'CCG Reaper', type: 'Passive', description: 'Crit Rate +30% against Ghoul type enemies.' }
    ]
  },
  {
    id: 'jason-sr',
    name: 'Yamori (Jason)',
    rarity: 'SR',
    category: 'Aogiri',
    type: 'Rinkaku',
    description: 'Sadistic tendencies. Physical strength increases as injury severity rises. Founder of the White Suits.',
    stats: { atk: 2100, def: 1800, spd: 110 },
    skills: [
      { name: 'Torture Logic', type: 'Active', description: 'Stuns target for 1 turn. Increases own ATK.' },
      { name: 'Half-Kakuja (Incomplete)', type: 'Passive', description: 'Boosts DEF by 15% each turn.' }
    ]
  },
  {
    id: 'amon-r',
    name: 'Koutarou Amon',
    rarity: 'R',
    category: 'CCG',
    type: 'Quinque',
    description: 'First Class Investigator. High durability. Uses heavy quinque "Dojima". Possesses strong sense of justice.',
    stats: { atk: 1200, def: 1400, spd: 130 },
    skills: [
      { name: 'Dojima Smash', type: 'Active', description: 'Deals physical damage and lowers enemy DEF.' },
      { name: 'Justice', type: 'Passive', description: 'Increases damage against Ghoul type enemies.' }
    ]
  },
  {
    id: 'tsukiyama-sr',
    name: 'Shuu Tsukiyama',
    rarity: 'SR',
    category: 'No Org',
    type: 'Koukaku',
    description: 'Subject "Gourmet". Excellent defensive capabilities via spiral kagune. Obsessed with specific prey.',
    stats: { atk: 1500, def: 2200, spd: 100 },
    skills: [
      { name: 'Spiral Guard', type: 'Active', description: 'Taunts all enemies and raises self DEF by 50%.' },
      { name: 'Refined Taste', type: 'Passive', description: 'Heals self for 10% of damage dealt.' }
    ]
  }
];

