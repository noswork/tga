
import { GoogleGenAI, GenerateContentResponse, Tool } from "@google/genai";
import { GhoulLabReport, GhoulRatingRank, TerminalMode, Character, Cell } from "../types";
import heroesJson from "../gamedata/heroes.json";
import cellsJson from "../gamedata/cells.json";

// ── Build compact game database string for GAME mode ──────────
function buildGameDatabase(): string {
  const heroes = heroesJson as Character[];
  const cells = cellsJson as Cell[];

  const heroLines = heroes.map(h => {
    const active = h.activeSkills.map(s =>
      `主動技能#${s.skillNum}(最高級): ${s.levels[s.levels.length - 1]?.description ?? ''}`
    ).join('; ');
    const passive = h.passiveSkills.map(s => `${s.name}[${s.subtype}]: ${s.description}`).join('; ');
    return `[角色] ${h.rarity} ${h.title ? h.title + ' ' : ''}${h.name} | 組織:${h.organization} | 屬性:${h.attribute ?? '?'} 戰術:${h.tactic ?? '?'} | 基礎戰力:${h.baseCp ?? '?'} 3x細胞戰力:${h.cellCp3x ?? '?'} 4x細胞戰力:${h.cellCp4x ?? '?'} | HP:${h.stats.hp} ATK:${h.stats.atk} DEF:${h.stats.def} | ${active} | ${passive}`;
  });

  const cellLines = cells.map(c => {
    const skill = c.uniqueSkillName
      ? ` | 專屬技能「${c.uniqueSkillName}」: ${c.uniqueSkillSegments?.map(s => s.text).join('') ?? ''}`
      : '';
    return `[RC細胞] 稀有度${c.rarity} ${c.name} | 類型:${c.statType} | ${c.description}${skill}`;
  });

  return [...heroLines, ...cellLines].join('\n');
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateGhoulResponse = async (
  prompt: string, 
  lang: 'en' | 'zh',
  mode: TerminalMode
): Promise<{ text: string, sources?: { uri: string, title: string }[] }> => {
  try {
    let systemInstruction = '';
    let tools: Tool[] = [];

    // Common persona
    const basePersona = lang === 'en'
      ? `You are "NOS", a specialized AI interface for the Tokyo Ghoul universe.`
      : `你是「NOS」，東京喰種世界的專用 AI 介面。`;

    // Mode-specific instructions
    switch (mode) {
      case 'GAME': {
        const gameDb = buildGameDatabase();
        tools = [{ googleSearch: {} }];
        systemInstruction = lang === 'en'
          ? `${basePersona}
MODE: GAME DATABASE (STRICT)

You have access to the full game database below AND Google Search. Use the local database first; use search only when the local data is insufficient (e.g. nicknames, lore details, or missing entries).

GAME DATABASE:
${gameDb}

INSTRUCTIONS:
1. Answer questions about characters, RC cells, stats, skills, CP, and game mechanics.
2. If a character or cell is not in the database, search online for "Tokyo Ghoul: Awakening" data.
3. Format stats with bold text and lists for readability.

RESTRICTIONS:
- Refuse real-world news, weather, or creative writing requests.
- Reply: ">> ERROR: COMMAND_NOT_RECOGNIZED. INPUT OUTSIDE GAME PARAMETERS."`
          : `${basePersona}
模式：遊戲資料庫（嚴格）

你擁有以下完整遊戲資料庫，同時可使用 Google Search。優先使用本地資料庫，只有在本地資料不足時（例如暱稱、劇情背景、資料庫未收錄的角色）才上網搜尋。

遊戲資料庫：
${gameDb}

指令：
1. 回答角色、RC 細胞、數值、技能、戰力(CP)及遊戲機制相關問題。
2. 若資料庫中找不到，請搜尋「東京喰種：Awakening」相關資料補充。
3. 使用粗體和列表格式顯示數值，方便閱讀。

限制：
- 拒絕現實新聞、天氣或創作故事的請求。
- 回應：「>> 錯誤：指令無法識別。輸入超出遊戲資料庫範圍。」`;
        break;
      }
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4,
        tools: tools,
      }
    });

    let sources: { uri: string, title: string }[] = [];

    // Extract grounding chunks if available (Only relevant in SEARCH mode usually)
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            uri: chunk.web.uri,
            title: chunk.web.title
          });
        }
      });
    }

    let responseText = response.text;

    // Fallback if empty (sometimes happens if refused completely)
    if (!responseText) {
      responseText = lang === 'en' ? ">> SYSTEM_HALT: NULL RESPONSE." : ">> 系統暫停：無回應。";
    }

    return {
      text: responseText,
      sources: sources.length > 0 ? sources : undefined
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: lang === 'en' 
      ? ">> CRITICAL ERROR: RC CELL INTERFERENCE. SIGNAL LOST." 
      : ">> 嚴重錯誤：檢測到 RC 細胞干擾。訊號丟失。"
    };
  }
};

type ImagePayload = {
  data: string;
  mimeType: string;
};

const ratingOrder: GhoulRatingRank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

const descriptors = {
  en: {
    aliasPrefix: 'Subject',
    rcLevels: ['Under 1000', '1,200', '1,800', '2,400', '3,500', '5,000', '7,200', '9,999+'],
    countermeasures: [
      'No action required',
      '2nd Class duo',
      '1st Class team',
      'Special Class support',
      'Special Class squad',
      'SS strike team',
      'CCG Reaper required',
      'Evacuate ward',
    ],
    descriptions: [
      'Barely registers on RC scanners.',
      'Urban legend with limited threat.',
      'Confirmed ghoul with predictable patterns.',
      'Shows adaptive kagune growth.',
      'Aggressive kagune behavior, requires special class.',
      'Battlefield hazard with extreme RC surge.',
      'Nightmare-tier predator with evolving kagune.',
      'Apocalyptic entity. Zero containment rate.',
    ],
    temperament: ['Docile', 'Calculated', 'Restless', 'Unhinged'],
    quotes: [
      '"Even coffee tastes metallic now."',
      '"Numbers don’t lie, investigators do."',
      '"Pain is a better tutor than peace."',
      '"All wards end in ashes sooner or later."',
    ],
  },
  zh: {
    aliasPrefix: '對象',
    rcLevels: ['低於 1000', '1,200', '1,800', '2,400', '3,500', '5,000', '7,200', '9,999+'],
    countermeasures: [
      '無須處置',
      '二等搜查官小隊',
      '一等搜查官配置',
      '特等支援',
      '特等專案組',
      'SS 清剿隊',
      '白色死神出動',
      '撤離整個區域',
    ],
    descriptions: [
      'RC 反應幾乎為零。',
      '都市傳說等級威脅。',
      '已確認喰種，但可預測。',
      '顯示適應性赫子增長。',
      '攻擊性強烈，必須特等對應。',
      '戰場級 RC 急遽飆升。',
      '夢魘級獵食者，赫子持續進化。',
      '世界終結級存在，無法收容。',
    ],
    temperament: ['溫馴', '算計型', '躁動', '失控'],
    quotes: [
      '「連咖啡都變得像血。」',
      '「數字不會騙人，搜查官會。」',
      '「疼痛比和平更會教人。」',
      '「每個 ward 遲早都會燃燒。」',
    ],
  },
};

const abilitiesPool = [
  'Rapid RC regeneration observed',
  'Displays improvised quinque techniques',
  'Adapts kagune density mid-combat',
  'Exploits psychological trauma of targets',
  'Manipulates battlefield debris into armor',
  'Switches between offense and stealth instantly',
];

const zhAbilitiesPool = [
  'RC 再生速度異常',
  '會即席模仿昆克招式',
  '戰鬥中調整赫子密度',
  '善於利用獵物心理創傷',
  '可操縱場地碎片形成護甲',
  '於攻擊與潛行間無縫切換',
];

const localized = <T,>(lang: 'en' | 'zh', enValue: T, zhValue: T): T =>
  lang === 'en' ? enValue : zhValue;

export const analyzeGhoulImage = async (
  image: ImagePayload,
  lang: 'en' | 'zh'
): Promise<GhoulLabReport> => {
  const profile = descriptors[lang];
  const seed = image.data.length + image.mimeType.length;
  const rank = ratingOrder[seed % ratingOrder.length];
  const abilitySource = lang === 'en' ? abilitiesPool : zhAbilitiesPool;

  const pick = <T,>(arr: T[], offset: number) => arr[offset % arr.length];

  return {
    alias: `${profile.aliasPrefix} ${1000 + (seed % 9000)}`,
    rating: {
      rank,
      description: pick(profile.descriptions, seed),
      threatLevel: pick(profile.descriptions, seed + 1),
      rcLevel: pick(profile.rcLevels, seed + 2),
      countermeasure: pick(profile.countermeasures, seed + 3),
    },
    kaguneProfile: localized(
      lang,
      'Kagune signature indicates hybridization between Rinkaku spines and Ukaku crystallization.',
      '赫子特徵顯示鱗赫脊骨與羽赫晶化的混種跡象。'
    ),
    abilityHighlights: [
      pick(abilitySource, seed),
      pick(abilitySource, seed + 1),
      pick(abilitySource, seed + 2),
    ],
    temperament: pick(profile.temperament, seed + 4),
    quote: pick(profile.quotes, seed + 5),
  };
};