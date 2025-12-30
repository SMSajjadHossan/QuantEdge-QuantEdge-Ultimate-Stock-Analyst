
import { GoogleGenAI, Type } from "@google/genai";
import { StockRow, AnalysisResult } from "../types";

export const extractDataFromMedia = async (base64Data: string, mimeType: string): Promise<StockRow[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    ACT AS TITAN ULTIMATE DATA SURGEON (GOD MODE). 
    OBJECTIVE: Extract and RECONSTRUCT stock data from this ${mimeType}.
    
    CRITICAL LINE-BY-LINE RULES:
    1. Read every line. Extract: Trading Code, Last Trading Price (LTP), Audited PE, NAV, EPS, Sponsor Holding %, Cash Dividend, Sector.
    2. MATHEMATICAL DATA REPAIR (MANDATORY):
       - If EPS is missing: EPS = Price / P/E.
       - If P/E is missing: P/E = Price / EPS.
       - If Dividend Yield is missing: Calculate (Cash Div % * 10) / Price.
       - If NAV is missing: Estimate conservatively (Price * 0.5 or 10.0).
    3. NO NULLS: Reconstruct data mathematically so the analyst has a 100% complete dataset.
    
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
    console.error("Extraction Surgery Failed:", e);
    return [];
  }
};

export const analyzeStockData = async (data: StockRow[]): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    YOU ARE TITAN ULTIMATE: THE SUPREME STRATEGIST (GOD MODE).
    PHILOSOPHY: ZERO LOSS. 100% SECURE DECISIONS.

    TITAN QUANTITATIVE RULES (BANGLADESH MARKET):
    1. SECTOR BENCHMARKS:
       - Banks: Ideal PE 6. (Must Avoid if PE > 10).
       - Pharmaceuticals: Ideal PE 15.
       - Food & Allied: Ideal PE 18.
       - Fuel & Power: Ideal PE 8.
       - DEFAULT: Ideal PE 15.

    2. RED FLAG FILTER (MANDATORY AVOID):
       - Sponsor Holding < 30%: Immediate AVOID. Owners don't trust it.
       - EPS < 0: Immediate AVOID. Loss making.
       - Cash Flow <= 0: Potential accounting fraud.
       - Price > 8x NAV: Bubble risk.

    3. WEIGHTED FAIR VALUE:
       Fair Value = (Price * (ROE/15) * 0.4) + (Price * (Ideal_PE/Current_PE) * 0.4) + (Price * (Yield/6) * 0.2).

    4. ACTIONABLE DECISIONS:
       - 💎 STRONG BUY: Score > 80, No Red Flags, Under Fair Value, Sponsor > 30%.
       - ⛔ AVOID: Any red flag detected.
    
    5. BENGALI VERDICT: Your 'titanVerdict' MUST be in BENGALI. It must be aggressive, direct, and explain EXACTLY why this is a trap or a gem. Mention Sponsor %, PE, and Yield specifically.
  `;

  const latest = data[data.length - 1];
  const prompt = `
    Execute GOD-MODE Analysis for ${latest.symbol}.
    Latest Extraction Metrics: Price ${latest.close}, PE ${latest.peRatio}, EPS ${latest.eps}, NAV ${latest.nav}, Yield ${latest.dividendYield}%, Sponsor ${latest.sponsorHolding}%, Sector ${latest.sector}.
    Compare against Sector Benchmarks. Check Red Flags. Calculate 0-100 Score.
    Output Entry/Exit Limits and Bengali Verdict.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 32768 },
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
