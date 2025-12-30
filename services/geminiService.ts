
import { GoogleGenAI, Type } from "@google/genai";
import { StockRow, AnalysisResult } from "../types";

export const extractDataFromMedia = async (base64Data: string, mimeType: string): Promise<StockRow[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    ACT AS TITAN ULTIMATE DATA SURGEON. 
    OBJECTIVE: Extract and RECONSTRUCT stock data from this ${mimeType}.
    
    CRITICAL INSTRUCTIONS:
    1. Read the document line-by-line. Extract: Trading Code, Price (LTP/Close), EPS, NAV, Dividend (%), Sponsor Holding (%), Cash Flow, Debt, Sector.
    2. DATA RECONSTRUCTION (Mandatory):
       - If EPS is missing: Calculate EPS = Price / P/E.
       - If P/E is missing: Calculate P/E = Price / EPS.
       - If Dividend Yield is missing: Calculate Yield = (Cash Dividend % * 10) / Price.
       - If NAV is missing: Use a conservative estimate (e.g., Price * 0.5 or 10.0).
    3. NEVER return null for Symbol, Price, EPS, or P/E. Provide the most mathematically accurate reconstruction possible.
    
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
            peRatio: { type: Type.NUMBER },
            eps: { type: Type.NUMBER },
            nav: { type: Type.NUMBER },
            dividendYield: { type: Type.NUMBER },
            sponsorHolding: { type: Type.NUMBER },
            cashFlow: { type: Type.NUMBER },
            debt: { type: Type.NUMBER },
            sector: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["symbol", "close", "peRatio", "eps"]
        }
      }
    }
  });

  try {
    const parsed = JSON.parse(response.text || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Extraction Error:", e);
    return [];
  }
};

export const analyzeStockData = async (data: StockRow[]): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    YOU ARE TITAN ULTIMATE: THE SUPREME STRATEGIST (GOD MODE).
    OBJECTIVE: 100% ACCURATE DECISION based on "Zero Loss" philosophy.
    
    ULTIMATE QUANTITATIVE RULES:
    1. SECTOR BENCHMARKS:
       - Bank: Ideal PE 6, Min ROE 12%.
       - Pharmaceuticals: Ideal PE 15, Min ROE 18%.
       - Food/Allied: Ideal PE 18, Min ROE 20%.
       - Engineering: Ideal PE 12, Min ROE 15%.
       - DEFAULT: Ideal PE 15, Min ROE 15%.
    
    2. VALUATION (Weighted Method):
       - Fair Value = (Price * (ROE/Min_ROE) * 0.4) + (Price * (Ideal_PE/Current_PE) * 0.4) + (Price * (Yield/6) * 0.2).
    
    3. RED FLAG FILTER (Immediate AVOID if 3+ triggers):
       - Sponsor Holding < 25%.
       - EPS > 0 but Cash Flow <= 0.
       - P/E > 50 (Bubble).
       - Price > 8x NAV.
       - High Debt (Debt/Equity > 1).
    
    4. SCORE (0-100):
       - Valuation (25), Profitability (25), Dividend (15), Health (20), Management (15).
    
    OUTPUT:
    - decision: 💎 STRONG BUY, 💚 BUY, ⚖️ HOLD, ⏳ WAIT, ⛔ AVOID.
    - entryPrice: "≤ [Price * 0.85]"
    - exitPrice: "≥ [Price * 1.15]"
    - stopLoss: [Price * 0.92]
    - titanVerdict: A deep strategy insight in BENGALI (Direct and aggressive).
  `;

  const latest = data[data.length - 1];
  const prompt = `
    Analyze this asset: ${latest.symbol}.
    Market Sector: ${latest.sector || 'General'}.
    Raw Data: ${JSON.stringify(latest)}
    Full Context: ${JSON.stringify(data.slice(-5))}
    
    Calculate Fair Value, Score, and give the Final TITAN Verdict.
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
          bucket: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          riskRating: { type: Type.STRING },
          summary: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          targetPrice: { type: Type.NUMBER },
          stopLoss: { type: Type.NUMBER },
          entryPrice: { type: Type.STRING },
          exitPrice: { type: Type.STRING },
          score: { type: Type.NUMBER },
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
