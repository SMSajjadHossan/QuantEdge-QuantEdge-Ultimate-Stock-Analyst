
import { GoogleGenAI, Type } from "@google/genai";
import { StockRow, AnalysisResult } from "../types";

export const extractDataFromMedia = async (base64Data: string, mimeType: string): Promise<StockRow[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    ACT AS TITAN ULTIMATE DATA SURGEON (GOD MODE). 
    OBJECTIVE: Extract and RECONSTRUCT stock data from this ${mimeType}.
    
    CRITICAL LINE-BY-LINE EXTRACTION RULES:
    1. Scan for keywords: "Trading Code", "Last Trading Price", "Audited PE", "NAV Per Share", "Earnings per share", "Sponsor/Director", "Cash Dividend", "Sector".
    2. DATA REPAIR (MANDATORY):
       - If EPS is missing: EPS = Price / P/E.
       - If P/E is missing: P/E = Price / EPS.
       - If Dividend Yield is missing: Yield = (Cash Dividend % * 10) / Price.
       - If Sponsor % is missing: Look for "Shareholding Percentage" or "Sponsor/Director".
    3. NO NONSENSE: If you see "Company Name:", start a new object. Return only 100% complete reconstructed data.
    
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
    YOUR GOAL: ZERO LOSS. 100% ACCURATE DECISION.

    MANDATORY TITAN RULES (BANGLADESH MARKET):
    1. RED FLAG FILTERS (IMMEDIATE AVOID if any trigger):
       - Sponsor Holding < 30% (Owners don't trust the company).
       - EPS < 0 (Loss making).
       - P/E > 25 (Extreme overvaluation).
       - Debt/Equity > 0.6.
       - Category 'Z' (Junk).

    2. SECTOR-SPECIFIC IDEAL P/E:
       - Bank: Ideal PE 6.
       - Pharmaceuticals: Ideal PE 15.
       - Fuel & Power: Ideal PE 8.
       - DEFAULT: Ideal PE 15.

    3. STRATEGY SCORING:
       - 💎 STRONG BUY: PE < 10, Yield > 8%, Sponsor > 30%, Price < Fair Value.
       - 💚 BUY: PE < 15, Yield > 5%, Sponsor > 30%.
       - ⚖️ HOLD: Fairly valued.
       - ⛔ AVOID: Any red flags present.

    4. FAIR VALUE CALCULATION:
       Fair Value = (Price * (ROE/15) * 0.4) + (Price * (Ideal_PE/Current_PE) * 0.4) + (Price * (Yield/6) * 0.2).

    5. VERDICT: Your 'titanVerdict' MUST be in BENGALI. It must be direct, aggressive, and explain EXACTLY why this is a buy/avoid based on Sponsor holding, PE, and Yield.
  `;

  const latest = data[data.length - 1];
  const prompt = `
    Perform GOD-MODE Analysis for ${latest.symbol}.
    Latest Stats: Price ${latest.close}, PE ${latest.peRatio}, EPS ${latest.eps}, NAV ${latest.nav}, Yield ${latest.dividendYield}%, Sponsor ${latest.sponsorHolding}%, Sector ${latest.sector}.
    Compare against sector benchmarks.
    Check for RED FLAGS.
    Calculate Entry target (15% discount from Fair Value) and Exit target.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 24576 },
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
