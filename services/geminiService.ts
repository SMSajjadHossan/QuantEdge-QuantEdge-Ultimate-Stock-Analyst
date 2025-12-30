
import { GoogleGenAI, Type } from "@google/genai";
import { StockRow, AnalysisResult } from "../types";

export const extractDataFromMedia = async (base64Data: string, mimeType: string): Promise<StockRow[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    ACT AS TITAN DATA SURGEON. 
    OBJECTIVE: Extract and RECONSTRUCT stock data from this ${mimeType}.
    
    CRITICAL INSTRUCTION:
    1. Read every line and identify financial markers (LTP, Close, P/E, EPS, NAV, Dividend, Sponsor Holding, Category).
    2. If any critical field is missing, YOU MUST CALCULATE OR DERIVE IT:
       - EPS missing? Calculate from Price / PE.
       - PE missing? Calculate from Price / EPS.
       - Dividend Yield missing? Calculate from (Cash Dividend % * 10) / Price.
       - If specific data is unreadable, estimate based on the "Bangladesh Market Alpha" (e.g., standard NAV of 10 if missing but price is low, or historical context).
    3. NEVER leave a null value for Close, PE, EPS, or Sponsor Holding. Provide a 100% complete reconstructed matrix.
    
    Map headers: 'Trading Code' -> 'symbol', 'Last Trading Price'/'LTP' -> 'close', 'Net Asset Value' -> 'nav'.
    Return an array of JSON objects.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            symbol: { type: Type.STRING },
            date: { type: Type.STRING },
            close: { type: Type.NUMBER },
            volume: { type: Type.NUMBER },
            peRatio: { type: Type.NUMBER },
            eps: { type: Type.NUMBER },
            sponsorHolding: { type: Type.NUMBER },
            dividendYield: { type: Type.NUMBER },
            debtToEquity: { type: Type.NUMBER },
            nav: { type: Type.NUMBER },
            category: { type: Type.STRING }
          },
          required: ["symbol", "date", "close", "peRatio", "eps", "sponsorHolding"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]") as StockRow[];
  } catch (e) {
    console.error("Extraction Parse Error:", e);
    return [];
  }
};

export const analyzeStockData = async (data: StockRow[]): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    YOU ARE TITAN: THE SUPREME EMPIRE STRATEGIST & QUANT.
    OBJECTIVE: 100% ACCURATE DECISION based on "Zero Loss" philosophy.
    
    TITAN MASTER RULES (Bengali Context):
    1. P/E Ratio: < 15 is Undervalued (Green). > 40 is a Trap.
    2. Dividend Yield: > 7% is mandatory for "Cash Flow King" status.
    3. Sponsor Holding: MUST be > 30%. If owners are selling, we are not buying.
    4. EPS Growth: Must be increasing over 3-5 years. Avoid "Z" category junk.
    5. NAV Safety: Price near NAV is safer.
    
    TRIPLE-CHECK VALIDATION:
    - Cross-verify PE vs Price/EPS.
    - Check for "Dividend Traps" (Yield > ROE).
    - Remove "Hype" influence.
    
    OUTPUT:
    - Provide a decision: STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL.
    - Provide a 'titanVerdict' in BENGALI that is aggressive, direct, and strategic.
  `;

  const latestData = data[data.length - 1];
  const prompt = `
    Analyze this asset: ${latestData.symbol}. 
    Data Set (Extracted & Repaired): ${JSON.stringify(data.slice(-20))}
    
    Current Stats:
    - Price: ${latestData.close}
    - P/E: ${latestData.peRatio}
    - Yield: ${latestData.dividendYield}%
    - Sponsor: ${latestData.sponsorHolding}%
    
    Give me the final TITAN STRATEGY result.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          decision: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          riskRating: { type: Type.STRING },
          summary: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          targetPrice: { type: Type.NUMBER },
          stopLoss: { type: Type.NUMBER },
          titanVerdict: { type: Type.STRING },
          checklist: {
            type: Type.OBJECT,
            properties: {
              peUnder15: { type: Type.BOOLEAN },
              dividendAbove7: { type: Type.BOOLEAN },
              sponsorAbove30: { type: Type.BOOLEAN },
              lowDebt: { type: Type.BOOLEAN },
              categoryA: { type: Type.BOOLEAN },
              navSafety: { type: Type.BOOLEAN }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}") as AnalysisResult;
};
