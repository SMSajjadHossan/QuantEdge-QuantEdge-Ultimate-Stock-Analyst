
export interface StockRow {
  symbol: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  peRatio?: number | null;
  eps?: number | null;
  dividendYield?: number | null;
  sponsorHolding?: number | null;
  debtToEquity?: number | null;
  nav?: number | null;
  category?: 'A' | 'B' | 'Z' | 'N/A';
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
  decision: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  pros: string[];
  cons: string[];
  targetPrice: number;
  stopLoss: number;
  checklist: TitanChecklist;
  titanVerdict: string; // The "Bengali" deep insight
}

export interface MissingDataField {
  rowIdx: number;
  field: string;
  symbol: string;
}
