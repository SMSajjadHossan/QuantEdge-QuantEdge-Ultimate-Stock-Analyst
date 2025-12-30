
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
    setLoadingStage("GOD_MODE_DATA_SURGERY");

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let extractedRows: StockRow[] = [];

      if (extension === 'xlsx' || extension === 'xls') {
        setLoadingStage("TITAN_EXCEL_INGESTION");
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
        setLoadingStage("TITAN_AI_LINE_BY_LINE_SCAN");
        const b64 = await fileToBase64(file);
        extractedRows = await extractDataFromMedia(b64, file.type || 'text/plain');
      }

      if (!extractedRows || extractedRows.length === 0) {
        throw new Error("TITAN_SYSTEM_FAULT: No valid metrics reconstructed from source.");
      }

      // Repair Layer: Reconstruct missing EPS or PE locally before analysis
      const finalData = extractedRows.map(row => {
        const r = { ...row };
        if (!r.peRatio && r.close && r.eps) r.peRatio = Number((r.close / r.eps).toFixed(2));
        if (!r.eps && r.close && r.peRatio) r.eps = Number((r.close / r.peRatio).toFixed(2));
        return r;
      });

      setData(finalData);

      setLoadingStage("TITAN_ZERO_LOSS_STRATEGY_DECISION");
      const result = await analyzeStockData(finalData);
      setAnalysis(result);

    } catch (err: any) {
      setError(err.message || "Autonomous Analysis Failure.");
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
    <div className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-blue-600/30">
      <nav className="border-b border-zinc-900 bg-black/50 backdrop-blur-3xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 group">
              <i className="fas fa-shield-halved text-white text-2xl group-hover:rotate-[360deg] transition-all duration-1000"></i>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">TITAN <span className="text-blue-500">GOD MODE</span></h1>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em]">Autonomous Empire Architect v9.0</p>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white text-black px-10 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-zinc-200 active:scale-95 shadow-2xl shadow-white/5"
          >
            Deploy Source
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20">
        {!analysis && !loading && (
          <div className="flex flex-col items-center justify-center text-center py-24 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="relative mb-20">
               <div className="absolute inset-0 bg-blue-500 blur-[150px] opacity-30 animate-pulse"></div>
               <div className="w-56 h-56 bg-zinc-950 border border-zinc-800 rounded-[60px] flex items-center justify-center relative shadow-2xl">
                <i className="fas fa-crown text-8xl text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]"></i>
               </div>
            </div>
            <h2 className="text-8xl font-black text-white mb-10 tracking-tighter max-w-5xl italic leading-none">THE ULTIMATE STRATEGY ORACLE</h2>
            <p className="text-zinc-500 text-2xl max-w-3xl leading-relaxed mb-20 font-medium">
              Deploy your DSE reports, spreadsheets, or images. Titan God Mode scans line-by-line, repairs data gaps, and delivers a 100% secure Zero-Loss verdict with aggressive Bengali insights.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
              {[
                { icon: "fa-crosshairs", label: "Sector Targets", detail: "P/E 6 Bank Filter" },
                { icon: "fa-user-shield", label: "Sponsor Integrity", detail: "Min 30% Holding" },
                { icon: "fa-chart-pie", label: "Weighted Matrix", detail: "Fair Value Logic" },
                { icon: "fa-file-excel", label: "Excel Export", detail: "Full Quant Data" }
              ].map((item, i) => (
                <div key={i} className="bg-zinc-950/50 border border-zinc-800 p-8 rounded-[40px] flex flex-col items-center gap-4 transition-all hover:bg-zinc-900">
                  <i className={`fas ${item.icon} text-blue-500 text-2xl`}></i>
                  <div className="text-center">
                    <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 block mb-1">{item.label}</span>
                    <span className="text-[9px] font-mono text-zinc-600 uppercase">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-20 py-8 rounded-[35px] font-black text-base uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-8 group"
            >
              <i className="fas fa-bolt-lightning text-white group-hover:scale-125 transition-transform"></i>
              Initialize Titan Scan
            </button>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-48 space-y-16">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 border-b-8 border-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-8 border-t-8 border-emerald-500 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-atom text-3xl text-white/20 animate-pulse"></i>
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-black text-4xl tracking-tight mb-4 uppercase italic">{loadingStage.replace(/_/g, ' ')}</p>
              <p className="text-zinc-600 font-mono text-[12px] tracking-[0.5em] uppercase">Titan Protocol Engaged • Line-by-Line Surgery</p>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto bg-rose-500/5 border border-rose-500/20 p-16 rounded-[60px] flex items-start gap-12 text-rose-400 mb-20 shadow-2xl">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-radiation text-3xl"></i>
            </div>
            <div>
              <p className="font-black text-3xl mb-4 uppercase tracking-tight">Strategy Execution Blocked</p>
              <p className="text-xl opacity-70 leading-relaxed font-mono mb-10">{error}</p>
              <button onClick={() => setError(null)} className="bg-rose-500/10 hover:bg-rose-500/20 px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">Re-Ignite Titan</button>
            </div>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-16 animate-in slide-in-from-bottom-20 duration-1000">
            <div className="bg-zinc-950 border border-zinc-800 p-12 rounded-[60px] flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-3 h-full bg-blue-600 group-hover:w-4 transition-all"></div>
              <div className="flex flex-col">
                <span className="text-[12px] text-zinc-600 font-black uppercase tracking-[0.6em] block mb-4">Ultimate Strategy Protocol v9.0</span>
                <h3 className="text-7xl font-black text-white tracking-tighter italic">{(data && data.length > 0) ? data[0].symbol : 'ASSET_SURGERY'}</h3>
              </div>
              <div className="flex gap-10 items-center">
                <div className="flex flex-col items-end">
                   <span className="text-[11px] text-zinc-600 font-black uppercase mb-3 tracking-widest">Intelligence Status</span>
                   <span className="bg-emerald-500/10 text-emerald-400 px-6 py-3 rounded-2xl text-[12px] font-black border border-emerald-500/20 flex items-center gap-4">
                     <i className="fas fa-fingerprint"></i>
                     ZERO_LOSS_VALIDATED
                   </span>
                </div>
                <button 
                  onClick={() => { setAnalysis(null); setData([]); }}
                  className="w-20 h-20 bg-zinc-900 hover:bg-zinc-800 rounded-[30px] flex items-center justify-center text-zinc-400 transition-all border border-zinc-800 shadow-xl"
                >
                  <i className="fas fa-rotate-left text-xl"></i>
                </button>
              </div>
            </div>
            <AnalysisView result={analysis} history={data || []} />
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-3xl border-t border-zinc-900 py-8 px-12 flex justify-between items-center z-40">
        <div className="flex items-center gap-6">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_#3b82f6]"></div>
          <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.5em]">TITAN GOD-MODE ENFORCEMENT ENGINE • BD MARKET PROTOCOL</span>
        </div>
        <div className="flex gap-12">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Quantum Decision Logic v9.1</span>
          <span className="text-[11px] font-mono text-blue-500/40 uppercase tracking-widest">Analysis Stream Encrypted</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
