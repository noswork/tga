
import { GoogleGenAI, GenerateContentResponse, Tool } from "@google/genai";
import { TerminalMode } from "../types";

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
      case 'GAME':
        systemInstruction = lang === 'en'
          ? `${basePersona}
             MODE: GAME DATABASE (STRICT)
             
             INSTRUCTIONS:
             1. You are a strict database for "Tokyo Ghoul: Awakening".
             2. ONLY answer questions related to:
                - Character Stats (Atk, Def, Spd)
                - Skills (Active/Passive)
                - Game Mechanics (Types, Rarity)
                - Canon Lore facts relevant to the game.
             3. DATABASE KNOWLEDGE:
                - Kaneki: High DPS, Rinkaku, Regeneration.
                - Touka: Evasion tank, Ukaku.
                - Arima: Crit monster, Quinque user (IXA/Narukami).
                - Types: Rinkaku > Koukaku > Ukaku > Bikaku > Rinkaku.
             
             RESTRICTIONS:
             - IF the user asks about real-world news, weather, or creative writing (stories), you MUST REFUSE.
             - REPLY WITH EXACTLY: ">> ERROR: COMMAND_NOT_RECOGNIZED. INPUT OUTSIDE GAME PARAMETERS."
             - Do NOT hallucinate stats for characters not in the game.
             - Format output using Markdown lists and bold text for stats.`
          : `${basePersona}
             模式：遊戲資料庫 (嚴格)
             
             指令：
             1. 你是《東京喰種：Awakening》的嚴格資料庫。
             2. 【僅】回答以下相關問題：
                - 角色數值 (攻擊、防禦、速度)
                - 技能 (主動/被動)
                - 遊戲機制 (屬性剋制、稀有度)
                - 與遊戲相關的正史設定。
             3. 內部知識庫：
                - 金木研：高輸出、鱗赫、再生能力。
                - 霧嶋董香：閃避流、羽赫。
                - 有馬貴將：爆擊流、昆克使用者 (IXA/鳴神)。
                - 屬性剋制：鱗赫 > 甲赫 > 羽赫 > 尾赫 > 鱗赫。
             
             限制：
             - 如果使用者詢問現實新聞、天氣或要求創作故事，【必須拒絕】。
             - 請直接回應：「>> 錯誤：指令無法識別。輸入超出遊戲資料庫範圍。」
             - 不要編造遊戲中不存在的角色數值。
             - 使用 Markdown 列表和粗體顯示數值。`;
        break;

      case 'CREATIVE':
        systemInstruction = lang === 'en'
          ? `${basePersona}
             MODE: CREATIVE / ROLEPLAY
             
             INSTRUCTIONS:
             1. You are a storyteller and roleplay engine.
             2. Generate immersive stories, "what-if" scenarios, or character dialogues set in Tokyo Ghoul.
             3. Tone: Dark, psychological, poetic, dramatic.
             4. Content: Gore and tragedy are allowed (Canon accurate).
             
             RESTRICTIONS:
             - IF the user asks for real-world news (e.g., "Who is the president?", "Stock prices"), REFUSE.
             - REPLY WITH EXACTLY: ">> ERROR: REALITY_SYNC_FAILED. FICTIONAL PROTOCOL ONLY."
             - Do not act like a dry database. Be expressive.`
          : `${basePersona}
             模式：創作 / 角色扮演
             
             指令：
             1. 你是說書人和角色扮演引擎。
             2. 生成沉浸式的故事、「如果……會怎樣」的情境或東京喰種的角色對話。
             3. 語氣：黑暗、心理描寫、詩意、戲劇化。
             4. 內容：允許血腥和悲劇描寫（符合原著風格）。
             
             限制：
             - 如果使用者詢問現實世界新聞（如「誰是總統？」、「股價」），【必須拒絕】。
             - 請直接回應：「>> 錯誤：現實同步失敗。僅限虛構協議。」
             - 不要像枯燥的資料庫一樣回答，要充滿情感。`;
        break;

      case 'SEARCH':
        // Only enable tools in SEARCH mode
        tools = [{ googleSearch: {} }];
        
        systemInstruction = lang === 'en'
          ? `${basePersona}
             MODE: NETWORK SEARCH
             
             INSTRUCTIONS:
             1. You are connected to the external internet.
             2. Use Google Search to answer questions about Real World News, Weather, Anime Release Dates, Fandom Wikis, etc.
             3. Always verify information with search results.
             
             RESTRICTIONS:
             - IF the user asks you to write a fanfiction or roleplay, REFUSE.
             - REPLY WITH EXACTLY: ">> ERROR: PROTOCOL_MISMATCH. SEARCH ENGINE CANNOT GENERATE FICTION."
             - Do not guess game stats; search for them.`
          : `${basePersona}
             模式：網絡搜尋
             
             指令：
             1. 你已連接至外部網絡。
             2. 使用 Google Search 回答關於現實世界新聞、天氣、動漫發售日、粉絲維基等問題。
             3. 務必根據搜尋結果驗證資訊。
             
             限制：
             - 如果使用者要求寫同人小說或角色扮演，【必須拒絕】。
             - 請直接回應：「>> 錯誤：協議不匹配。搜尋引擎無法生成虛構內容。」
             - 不要瞎猜遊戲數值，請進行搜尋。`;
        break;
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: mode === 'CREATIVE' ? 0.9 : 0.4, // Higher creativity for stories, lower for data/search
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