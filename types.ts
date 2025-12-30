
export interface StockRow {
  symbol: string;
  date: string;
  close: number;
  peRatio: number;
  eps: number;
  nav: number;
  dividendYield: number;
  sponsorHolding: number;
  cashFlow?: number;
  debt?: number;
  sector?: string;
  category?: string;
  [key: string]: any;
}

export interface TitanChecklist {
  peUnder15: boolean;
  dividendAbove7: boolean;
  sponsorAbove30: boolean;
  lowDebt: boolean;
  categoryA: boolean;
  navSafety: boolean;
}

export interface AnalysisResult {
  decision: string;
  bucket: string;
  confidence: number;
  riskRating: string;
  summary: string;
  pros: string[];
  cons: string[];
  targetPrice: number;
  stopLoss: number;
  entryPrice: string;
  exitPrice: string;
  checklist: TitanChecklist;
  titanVerdict: string;
  score: number;
}
