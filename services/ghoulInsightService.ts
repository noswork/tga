import { GoogleGenAI, Schema, Type } from '@google/genai';
import { GhoulInsightAnalysis, GhoulThreatRating, Lang } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getRatingCriteriaDoc = (lang: Lang) => {
  if (lang === Lang.ZH) {
    return `
評級評估標準：
- SSS 級：基準不明。幾乎無法量化的災害級威脅。
- SS 級：需要多名特等搜查官同時出動。
- S+ 級：大致相當於一般特等搜查官的實力。
- S- 級：大致相當於準特等搜查官的實力。
- A 級：大致相當於一等搜查官。多數鎖定目標落在此級。
- B 級：相當於一到三等搜查官。多半已熟練赫子運用。
- C 級：戰力較低，通常無法與裝備齊全的搜查官對抗，多以襲擊無武裝人類為主。
`;
  }
  return `
Rating Assessment Criteria:
- SSS rated: Criteria is unclear. Unimaginable power.
- SS rated: Multiple Special Class Investigators are needed.
- S+ rated: Equivalent to the ability of an average Special Class Investigator.
- S- rated: Equivalent to the ability of an average Associate Special Class Investigator.
- A rated: Comparable to a First Class Investigator. Target level.
- B rated: Comparable to a Rank 1 to Rank 3 Investigator. Kagune mastered.
- C rated: Ghouls of smaller ability, attack unarmed humans only.
`;
};

const getSystemInstruction = (lang: Lang) => {
  const language = lang === Lang.ZH ? 'Traditional Chinese (繁體中文)' : 'English';
  const tone = lang === Lang.ZH 
    ? '極度諷刺、憤世嫉俗、略帶黑暗且幽默（有趣/搞鬼）。你是一個看過太多事情的疲憊搜查官。'
    : 'Extremely sarcastic, cynical, slightly dark, and humorous. You are a tired investigator who has seen too much.';
  
  return `
You are a specialized AI built by the CCG (Commission of Counter Ghoul). Your job is to analyze images and assign a "Ghoul Rating".

**Persona:**
- **Language:** ${language} ONLY. All output must be in ${language}.
- **Tone:** ${tone}

**CRITICAL TASK - CHARACTER RECOGNITION (Grounding):**
- **Identify the Subject:** Check if the image contains a known character (Anime, Game, Movie, Celebrity, Meme) or a specific object.
- **Use Lore & Quotes:** If it is a known character, you **MUST** reference their famous quotes, signature moves, or personality traits in your "Commentary", "Mask Design", and "Countermeasure".
- **Twist it:** Reinterpret their heroic/villainous traits as "Ghoul" traits.
    ${lang === Lang.ZH 
      ? `- *範例 (悟空):* "這個對象不斷大喊『我餓了』。明顯是暴食者。不斷改變髮色來混淆搜查官。"
    - *範例 (芙莉蓮):* "沉迷於收集『魔法書』（人類器官？）。看似無害但 RC 輸出堪比獨眼梟。"
    - *範例 (貓):* "看似可愛的殺戮機器。爪子絕對是鱗赫。"`
      : `- *Example (Goku):* "This subject screams 'I am hungry' constantly. Clearly a Binge Eater. Keeps changing hair color to confuse investigators."
    - *Example (Frieren):* "Obsessed with collecting 'grimoires' (human organs?). Seems harmless but has a mana (RC) output that rivals the One-Eyed Owl."
    - *Example (Cat):* "A deceptively cute killing machine. Claws are definitely Rinkaku."`}

**Standard Task:**
1. Analyze the image.
2. Assign a Rating based on the provided "Rating Assessment Criteria".
3. Calculate a "Battle Power" (numerical, roughly 100-10000 based on threat).
4. Provide a "Commentary" that roasts the subject or praises their terrifying aura in a funny way.
5. Suggest a "Mask Design" that fits their face/vibe.
6. Suggest a "Countermeasure" (how to defeat them).

**Reference Data:**
${getRatingCriteriaDoc(lang)}
`;
};

export const analyzeGhoulInsightImage = async (
  base64Image: string,
  lang: Lang = Lang.ZH,
): Promise<GhoulInsightAnalysis> => {
  try {
    const systemInstruction = getSystemInstruction(lang);
    const ratingCriteriaDoc = getRatingCriteriaDoc(lang);
    const promptText = lang === Lang.ZH
      ? '分析此對象的喰種活動。如果可能，識別角色並在分析中使用他們的特定背景故事/語錄。以嚴格 JSON 格式輸出。'
      : 'Analyze this subject for Ghoul activity. Identify the character if possible and use their specific lore/quotes in the analysis. Output in strict JSON.';
    
    // 動態生成 responseSchema，根據語言調整描述
    const dynamicResponseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        rating: {
          type: Type.STRING,
          enum: ['SSS', 'SS', 'S+', 'S-', 'A', 'B', 'C', '?'],
          description: lang === Lang.ZH ? '基於標準的 CCG 威脅評級。' : 'The CCG threat rating based on criteria.'
        },
        alias: {
          type: Type.STRING,
          description: lang === Lang.ZH 
            ? '一個酷炫、前衛或有趣的代號（例如：「美食家」、「午夜零食者」）。必須使用繁體中文。'
            : 'A cool, edgy, or funny code name (e.g., "The Gourmet", "Midnight Snacker"). Must be in English.'
        },
        rcType: {
          type: Type.STRING,
          enum: lang === Lang.ZH 
            ? ['Ukaku (羽赫)', 'Koukaku (甲赫)', 'Rinkaku (鱗赫)', 'Bikaku (尾赫)', 'Unknown']
            : ['Ukaku (羽赫)', 'Koukaku (甲赫)', 'Rinkaku (鱗赫)', 'Bikaku (尾赫)', 'Unknown'],
          description: lang === Lang.ZH ? '預測的赫子類型。' : 'Predicted Kagune type.'
        },
        rcFactor: {
          type: Type.NUMBER,
          description: lang === Lang.ZH ? 'RC 細胞數量（人類：200-500，喰種：1000-8000+）。' : 'Rc Cell count (human: 200-500, ghoul: 1000-8000+).'
        },
        battlePower: {
          type: Type.NUMBER,
          description: lang === Lang.ZH ? '戰鬥力估算（例如：C 級 500，SSS 級 9000+）。' : 'Combat power estimation (e.g., 500 for C rank, 9000+ for SSS).'
        },
        commentary: {
          type: Type.STRING,
          description: lang === Lang.ZH
            ? '有趣、諷刺的分析，必須使用繁體中文。如果識別出角色：使用他們的語錄/迷因。'
            : 'Funny, sarcastic analysis in English. IF CHARACTER RECOGNIZED: Use their quotes/memes.'
        },
        traits: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: lang === Lang.ZH ? '3-5 個視覺特徵。必須使用繁體中文。' : '3-5 visual traits. Must be in English.'
        },
        maskDesign: {
          type: Type.STRING,
          description: lang === Lang.ZH
            ? '描述他們獨特的喰種面具。要有創意且視覺化。必須使用繁體中文。'
            : 'Description of their unique ghoul mask. Creative and visual. Must be in English.'
        },
        countermeasure: {
          type: Type.STRING,
          description: lang === Lang.ZH
            ? '給搜查官的戰術建議，說明如何對抗他們。如果適用，使用角色背景故事。必須使用繁體中文。'
            : 'Tactical advice to investigators on how to fight them. Use character lore if applicable. Must be in English.'
        },
        survivalRate: {
          type: Type.STRING,
          description: lang === Lang.ZH 
            ? '人類遭遇此對象的生存機率（例如：「0%」、「99%」）。' 
            : 'Percentage chance of a human surviving an encounter (e.g. "0%", "99%").'
        },
        ward: {
          type: Type.STRING,
          description: lang === Lang.ZH
            ? '他們可能居住的東京區域（例如：「第20區」或「第四區」）。必須使用繁體中文。'
            : 'Which Tokyo Ward they likely inhabit (e.g., "20th Ward" or "Fourth Ward"). Must be in English.'
        }
      },
      required: [
        'rating',
        'alias',
        'rcType',
        'rcFactor',
        'battlePower',
        'commentary',
        'traits',
        'maskDesign',
        'countermeasure',
        'survivalRate',
        'ward'
      ]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: promptText
          }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: dynamicResponseSchema,
        temperature: 0.85
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GhoulInsightAnalysis;
    }

    throw new Error('No analysis data returned.');
  } catch (error) {
    console.error('Ghoul Insight Analysis Error:', error);
    const errorMessages = lang === Lang.ZH ? {
      alias: '系統錯誤',
      commentary: 'CCG 伺服器被青銅樹入侵，暫時無法判讀此對象。',
      maskDesign: '無法生成',
      countermeasure: '請撤離並重試。',
      ward: 'Unknown'
    } : {
      alias: 'System Error',
      commentary: 'CCG servers have been compromised by Aogiri Tree. Unable to analyze this subject.',
      maskDesign: 'Unable to generate',
      countermeasure: 'Please evacuate and retry.',
      ward: 'Unknown'
    };
    
    return {
      rating: GhoulThreatRating.UNKNOWN,
      alias: errorMessages.alias,
      rcType: 'Unknown',
      rcFactor: 0,
      battlePower: 0,
      commentary: errorMessages.commentary,
      traits: [lang === Lang.ZH ? '錯誤' : 'Error'],
      maskDesign: errorMessages.maskDesign,
      countermeasure: errorMessages.countermeasure,
      survivalRate: '???',
      ward: errorMessages.ward
    };
  }
};

