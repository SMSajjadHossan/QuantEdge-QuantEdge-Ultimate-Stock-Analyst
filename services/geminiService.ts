
import { GoogleGenAI, Type } from "@google/genai";
import { StockRow, AnalysisResult } from "../types";

export const extractDataFromMedia = async (base64Data: string, mimeType: string): Promise<StockRow[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    ACT AS TITAN DATA SURGEON. 
    OBJECTIVE: Extract and RECONSTRUCT stock data from this ${mimeType}.
    
    CRITICAL INSTRUCTION:
    If any field (Close, PE, EPS, Sponsor Holding) is missing, YOU MUST CALCULATE IT using financial formulas:
    - If PE and Close are present, calculate EPS (EPS = Close / PE).
    - If Close and EPS are present, calculate PE (PE = Close / EPS).
    - If specific fundamental metrics are missing from the table but industry context is available, use logical estimation to provide a 100% COMPLETE DATASET.
    - NEVER leave a null value. Provide the most accurate mathematical reconstruction possible.
    
    Map headers dynamically: 'Price'/'LTP' -> 'close', 'Directors' -> 'sponsorHolding', 'Profit' -> 'eps'.
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
            nav: { type: Type.NUMBER }
          },
          required: ["symbol", "date", "close", "peRatio", "eps", "sponsorHolding"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const analyzeStockData = async (data: StockRow[]): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    YOU ARE TITAN: THE SUPREME STRATEGIST.
    OBJECTIVE: 100% ACCURATE DECISION based on the reconstructed data.
    
    TITAN RULES:
    1. P/E Ratio < 15 = UNDEVALUED.
    2. Dividend > 7% = CASH FLOW KING.
    3. Sponsor > 30% = OWNERSHIP TRUST.
    4. Debt < 0.5 = FINANCIAL HEALTH.
    
    TRIPLE-CHECK the mathematical consistency of the provided data before final verdict.
    Response must be JSON with a deep 'titanVerdict' in Bengali.
  `;

  const prompt = `
    Analyze this asset: ${data[0]?.symbol}. 
    Metrics provided: ${JSON.stringify(data.slice(-10))}
    Provide the final "Empire Build" decision.
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

  return JSON.parse(response.text || "{}");
};
