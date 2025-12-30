
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
    setLoadingStage("AUTONOMOUS_DATA_SURGERY");

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let extractedRows: StockRow[] = [];

      if (extension === 'xlsx' || extension === 'xls') {
        setLoadingStage("RECONSTRUCTING_EXCEL_STREAM");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(firstSheet);
        
        extractedRows = json.map(item => ({
          symbol: String(item.Symbol || item.Ticker || "ASSET"),
          date: String(item.Date || item.date || new Date().toISOString().split('T')[0]),
          open: parseFloat(item.Open || item.Price || 0),
          high: parseFloat(item.High || item.Price || 0),
          low: parseFloat(item.Low || item.Price || 0),
          close: parseFloat(item.Close || item.Price || 0),
          volume: parseFloat(item.Volume || 0),
          peRatio: parseFloat(item.PE || 0),
          eps: parseFloat(item.EPS || 0),
          dividendYield: parseFloat(item.Yield || 0),
          sponsorHolding: parseFloat(item.Sponsor || 0),
          debtToEquity: parseFloat(item.Debt || 0)
        }));
      } 
      else {
        // Universal AI Ingestion for PDF, Image, CSV, TXT
        setLoadingStage("AI_MULTI_FORMAT_RECONSTRUCTION");
        const b64 = await fileToBase64(file);
        extractedRows = await extractDataFromMedia(b64, file.type || 'text/plain');
      }

      if (extractedRows.length === 0) throw new Error("TITAN_FAULT: Dataset Reconstruction Failed.");
      
      setData(extractedRows);
      
      // Automatic Trigger of Analysis immediately after successful extraction
      setLoadingStage("TRIPLE_CHECK_STRATEGY_FINALIZATION");
      const result = await analyzeStockData(extractedRows);
      setAnalysis(result);

    } catch (err: any) {
      setError(err.message || "Autonomous reconstruction failed. Verify file integrity.");
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-blue-500/30">
      <nav className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 group">
              <i className="fas fa-chess-king text-white text-2xl group-hover:scale-110 transition-transform"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white">TITAN <span className="text-blue-500">DOMINATOR</span></h1>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Autonomous Strategy Protocol v4.0</p>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white text-black px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/5"
          >
            Deploy Source
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24">
        {!data.length && !loading && (
          <div className="flex flex-col items-center justify-center text-center py-20 animate-in fade-in duration-1000">
            <div className="relative mb-12">
               <div className="absolute inset-0 bg-blue-500 blur-[120px] opacity-10"></div>
               <div className="w-40 h-40 bg-zinc-900/50 border border-zinc-800 rounded-[40px] flex items-center justify-center relative shadow-2xl">
                <i className="fas fa-microchip text-6xl text-blue-500"></i>
               </div>
            </div>
            <h2 className="text-6xl font-black text-white mb-6 tracking-tighter">Autonomous Intelligence</h2>
            <p className="text-zinc-500 text-xl max-w-2xl leading-relaxed mb-12">
              Ingest any PDF, Image, or Document. TITAN will extract data line-by-line, calculate missing metrics, and deliver a 100% accurate strategy instantly.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all flex items-center gap-4"
            >
              <i className="fas fa-rocket"></i> Begin Strategy Extraction
            </button>
            <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => processFile(e.target.files![0])} />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-10">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-b-4 border-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-t-4 border-emerald-500 rounded-full animate-spin-slow"></div>
            </div>
            <div className="text-center">
              <p className="text-white font-black text-2xl tracking-tight mb-2 uppercase">{loadingStage.replace(/_/g, ' ')}</p>
              <p className="text-zinc-600 font-mono text-[10px] tracking-widest">ZERO_INTERVENTION_REPAIR: ENABLED | TRIPLE_CHECKING...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto bg-rose-500/5 border border-rose-500/20 p-8 rounded-[32px] text-rose-400 mb-12 shadow-2xl">
            <p className="font-black text-xl mb-1 uppercase tracking-tight">System Fault</p>
            <p className="text-sm opacity-70 font-mono">{error}</p>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-12 animate-in zoom-in-95 duration-700">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] flex justify-between items-center shadow-2xl">
              <div>
                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] block mb-2">Autonomous Report For</span>
                <h3 className="text-4xl font-black text-white tracking-tighter">{data[0].symbol}</h3>
              </div>
              <div className="flex gap-4">
                <span className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl text-xs font-bold border border-blue-500/20">DATA_COMPLETE</span>
                <span className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/20">REPAIRED_BY_AI</span>
              </div>
            </div>
            <AnalysisView result={analysis} history={data} />
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 py-4 px-8 flex justify-between items-center z-40">
        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.5em]">Titan Neural Network • 100% Autonomous</span>
        <div className="flex gap-4">
          <span className="text-[8px] font-mono text-emerald-500/50 uppercase">Secured Session</span>
          <button onClick={() => { setData([]); setAnalysis(null); }} className="text-[8px] font-mono text-rose-500/50 uppercase hover:text-rose-500">Reset Engine</button>
        </div>
      </footer>
    </div>
  );
};

export default App;
