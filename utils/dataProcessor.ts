
import { StockRow, MissingDataField } from "../types";

export const validateAndRepairData = (rows: StockRow[]): { data: StockRow[], missing: MissingDataField[] } => {
  const missing: MissingDataField[] = [];
  const processed = rows.map((row, i) => {
    const r = { ...row };
    
    // Smart Calculation for missing fundamentals
    if (r.close && r.peRatio && (r.eps === null || r.eps === undefined)) {
      r.eps = r.close / r.peRatio;
    }
    if (r.close && r.eps && (r.peRatio === null || r.peRatio === undefined)) {
      r.peRatio = r.close / r.eps;
    }

    // Essential Check
    const essential = ["close", "symbol", "date", "open", "high", "low", "volume"];
    essential.forEach(field => {
      if (r[field] === null || r[field] === undefined || r[field] === "") {
        missing.push({ rowIdx: i + 1, field, symbol: r.symbol || "Unknown" });
      }
    });

    return r;
  });

  return { data: processed, missing };
};

export const parseCSVLineByLine = (text: string): { data: StockRow[], missing: MissingDataField[] } => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) return { data: [], missing: [] };

  const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
  const rows: StockRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim());
    const row: any = {};
    
    headers.forEach((header, idx) => {
      const val = values[idx];
      if (header === "symbol" || header === "date") {
        row[header] = val || "";
      } else {
        const num = parseFloat(val.replace(/[^0-9.-]+/g,""));
        row[header] = isNaN(num) ? null : num;
      }
    });
    rows.push(row as StockRow);
  }

  return validateAndRepairData(rows);
};

export const formatCurrency = (val: number | undefined | null) => {
  if (val === null || val === undefined) return "N/A";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};
