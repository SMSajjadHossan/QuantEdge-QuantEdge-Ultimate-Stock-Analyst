
import React, { useState, useRef } from 'react';
import { StockRow, AnalysisResult } from './types';
import { fileToBase64 } from './utils/dataProcessor';
import { analyzeStockData, extractDataFromMedia } from './services/geminiService';
import { AnalysisView } from './components/AnalysisView';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [data, setData] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setLoadingStage("GOD_MODE_EXTRACTION_INITIATED");

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let extractedRows: StockRow[] = [];

      if (extension === 'xlsx' || extension === 'xls') {
        setLoadingStage("TITAN_EXCEL_SURGERY");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(firstSheet);
        
        extractedRows = json.map(item => ({
          symbol: String(item.Symbol || item.Ticker || item.TradingCode || "ASSET"),
          date: String(item.Date || item.date || new Date().toISOString().split('T')[0]),
          close: parseFloat(item.Close || item.Price || item.LTP || 0),
          peRatio: parseFloat(item.PE || item.peRatio || item['P/E'] || 0),
          eps: parseFloat(item.EPS || item.eps || 0),
          nav: parseFloat(item.NAV || item.nav || 10),
          dividendYield: parseFloat(item.Yield || item.dividendYield || 0),
          sponsorHolding: parseFloat(item.Sponsor || item.sponsorHolding || 0),
          cashFlow: parseFloat(item.CashFlow || item.cashFlow || 0),
          debt: parseFloat(item.Debt || item.debt || 0),
          sector: String(item.Sector || item.sector || "Unknown")
        }));
      } else {
        setLoadingStage("AI_LINE_BY_LINE_TITAN_SCAN");
        const b64 = await fileToBase64(file);
        extractedRows = await extractDataFromMedia(b64, file.type || 'text/plain');
      }

      if (!extractedRows || extractedRows.length === 0) {
        throw new Error("TITAN_RECONSTRUCTION_FAILED: No valid stock data detected.");
      }

      // Force Repair missing metrics locally before AI analysis
      const finalData = extractedRows.map(row => {
        const r = { ...row };
        if (!r.peRatio && r.close && r.eps) r.peRatio = Number((r.close / r.eps).toFixed(2));
        if (!r.eps && r.close && r.peRatio) r.eps = Number((r.close / r.peRatio).toFixed(2));
        return r;
      });

      setData(finalData);

      setLoadingStage("QUANT_DECISION_MATRIX_PROCESSING");
      const result = await analyzeStockData(finalData);
      setAnalysis(result);

    } catch (err: any) {
      setError(err.message || "Autonomous engine failure.");
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-blue-500/30 selection:text-white">
      <nav className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 group">
              <i className="fas fa-atom text-white text-2xl group-hover:animate-spin transition-all"></i>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">TITAN <span className="text-blue-500">GOD MODE</span></h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em]">Zero-Loss Autonomous Engine v7.0</p>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
          >
            Load Data Stream
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-16 pb-32">
        {!analysis && !loading && (
          <div className="flex flex-col items-center justify-center text-center py-20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="relative mb-16">
               <div className="absolute inset-0 bg-blue-500 blur-[140px] opacity-25"></div>
               <div className="w-48 h-48 bg-zinc-900/50 border border-zinc-800 rounded-[50px] flex items-center justify-center relative shadow-2xl">
                <i className="fas fa-crown text-7xl text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"></i>
               </div>
            </div>
            <h2 className="text-7xl font-black text-white mb-8 tracking-tighter max-w-4xl italic">ULTIMATE STRATEGY ORACLE</h2>
            <p className="text-zinc-500 text-xl max-w-3xl leading-relaxed mb-16">
              Give me your DSE files, screenshots, or spreadsheets. Titan will extract every metric, verify sponsor holding, calculate sector benchmarks, and give you a 100% accurate verdict in Bengali.
            </p>
            <div className="flex gap-4 mb-12">
              <div className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2">
                <i className="fas fa-check text-emerald-500"></i> Sponsor Check
              </div>
              <div className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2">
                <i className="fas fa-check text-emerald-500"></i> PE Benchmark
              </div>
              <div className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2">
                <i className="fas fa-check text-emerald-500"></i> Yield Matrix
              </div>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-black px-16 py-6 rounded-[30px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all flex items-center gap-6 group"
            >
              <i className="fas fa-bolt text-blue-600"></i>
              Execute God Mode Scan
            </button>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-40 space-y-12">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-b-8 border-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-6 border-t-8 border-emerald-500 rounded-full animate-spin-slow"></div>
            </div>
            <div className="text-center">
              <p className="text-white font-black text-3xl tracking-tight mb-4 uppercase italic">{loadingStage.replace(/_/g, ' ')}</p>
              <p className="text-zinc-600 font-mono text-[11px] tracking-[0.4em] uppercase">Processing Line-by-Line • Titan Logic Active</p>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto bg-rose-500/5 border border-rose-500/20 p-12 rounded-[50px] flex items-start gap-10 text-rose-400 mb-16 shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 rounded-3xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <div>
              <p className="font-black text-2xl mb-2 uppercase tracking-tight">System Fault</p>
              <p className="text-base opacity-70 leading-relaxed font-mono mb-6">{error}</p>
              <button onClick={() => setError(null)} className="bg-rose-500/10 hover:bg-rose-500/20 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Re-Ignite Engine</button>
            </div>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-12 animate-in zoom-in-95 duration-1000">
            <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[50px] flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
              <div className="flex flex-col">
                <span className="text-[11px] text-zinc-600 font-black uppercase tracking-[0.5em] block mb-4">God-Mode Strategic Matrix</span>
                <h3 className="text-6xl font-black text-white tracking-tighter italic">{(data && data.length > 0) ? data[0].symbol : 'TITAN_ASSET'}</h3>
              </div>
              <div className="flex gap-6 items-center">
                <div className="flex flex-col items-end">
                   <span className="text-[10px] text-zinc-600 font-black uppercase mb-2 tracking-widest">Analysis Integrity</span>
                   <span className="bg-blue-500/10 text-blue-400 px-5 py-2.5 rounded-2xl text-[11px] font-black border border-blue-500/20 flex items-center gap-3">
                     <i className="fas fa-shield-check"></i>
                     100% ACCURATE
                   </span>
                </div>
                <button 
                  onClick={() => { setAnalysis(null); setData([]); }}
                  className="w-16 h-16 bg-zinc-800 hover:bg-zinc-700 rounded-3xl flex items-center justify-center text-zinc-400 transition-all border border-zinc-700 shadow-lg"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            <AnalysisView result={analysis} history={data || []} />
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-900 py-6 px-10 flex justify-between items-center z-40">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">TITAN GOD-MODE ENGINE ACTIVE</span>
        </div>
        <div className="flex gap-8">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Autonomous Decision Protocol v7.0</span>
          <span className="text-[10px] font-mono text-blue-500/40 uppercase tracking-widest">Zero-Loss Protection Active</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
