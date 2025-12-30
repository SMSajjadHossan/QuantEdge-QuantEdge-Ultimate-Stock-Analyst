
import React from 'react';
import { AnalysisResult } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import * as XLSX from 'xlsx';

interface AnalysisViewProps {
  result: AnalysisResult;
  history: any[];
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result, history }) => {
  const getDecisionColor = (decision: string = '') => {
    const d = decision.toUpperCase();
    if (d.includes('STRONG BUY')) return 'text-emerald-400 border-emerald-500 shadow-emerald-500/20 bg-emerald-500/5';
    if (d.includes('AVOID') || d.includes('TRAP')) return 'text-rose-400 border-rose-500 shadow-rose-500/20 bg-rose-500/5';
    if (d.includes('WAIT')) return 'text-amber-400 border-amber-500/50';
    return 'text-zinc-400 border-zinc-500/50';
  };

  const exportToExcel = () => {
    const wsData = [
      ["TITAN GOD-MODE ULTIMATE STRATEGY REPORT", new Date().toLocaleString()],
      ["Asset Symbol", history[0]?.symbol || "N/A"],
      ["Titan Score", result.score],
      ["Final Decision", result.decision],
      ["Risk Rating", result.riskRating],
      ["Entry Target", result.entryPrice],
      ["Exit Target", result.exitPrice],
      ["Stop Loss", result.stopLoss],
      ["Bengali Strategic Verdict", result.titanVerdict],
      ["Strategy Summary", result.summary],
      [],
      ["RECONSTRUCTED QUANT DATA"],
      ["Date", "Close Price", "P/E Ratio", "EPS", "NAV", "Div Yield %", "Sponsor %"],
      ...history.map(h => [h.date, h.close, h.peRatio, h.eps, h.nav, h.dividendYield, h.sponsorHolding])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Titan Strategy");
    XLSX.writeFile(wb, `Titan_GodMode_${history[0]?.symbol || 'Stock'}_Report.xlsx`);
  };

  const ChecklistItem = ({ label, passed }: { label: string, passed: boolean }) => (
    <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 transition-all hover:border-zinc-700">
      <span className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">{label}</span>
      <i className={`fas ${passed ? 'fa-check-circle text-emerald-400' : 'fa-times-circle text-rose-500'}`}></i>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
      {/* God-Mode Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-zinc-950 border-2 border-zinc-800 rounded-[50px] p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <div className="text-[11px] font-black text-zinc-600 uppercase tracking-widest mb-2">Titan Score</div>
              <div className="text-5xl font-black text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                {result.score || 0}<span className="text-xl text-zinc-700 ml-1">/100</span>
              </div>
            </div>
            
            <div className="mb-10 inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[9px] font-black uppercase tracking-widest">
              <i className="fas fa-microchip animate-pulse"></i> Quantitative Oracle Active
            </div>

            <div className={`text-6xl font-black py-10 border-y border-zinc-900 mb-10 transition-all duration-500 italic rounded-2xl ${getDecisionColor(result.decision)}`}>
              {result.decision}
            </div>
            
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="text-left bg-zinc-900/50 p-4 rounded-3xl">
                <span className="text-[10px] text-zinc-600 font-black uppercase block mb-2 tracking-widest">Entry</span>
                <span className="text-emerald-400 font-black text-lg">{result.entryPrice}</span>
              </div>
              <div className="text-center bg-zinc-900/50 p-4 rounded-3xl">
                <span className="text-[10px] text-zinc-600 font-black uppercase block mb-2 tracking-widest">Target</span>
                <span className="text-blue-400 font-black text-lg">{result.exitPrice}</span>
              </div>
              <div className="text-right bg-zinc-900/50 p-4 rounded-3xl">
                <span className="text-[10px] text-zinc-600 font-black uppercase block mb-2 tracking-widest">Stop Loss</span>
                <span className="text-rose-400 font-black text-lg">{result.stopLoss}</span>
              </div>
            </div>

            <button 
              onClick={exportToExcel}
              className="w-full bg-white text-black py-6 rounded-[30px] font-black text-[12px] uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-white/5 flex items-center justify-center gap-4"
            >
              <i className="fas fa-file-excel text-emerald-600"></i>
              Export Ultimate Report
            </button>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[40px] p-10 relative">
            <div className="absolute -top-5 -left-5 w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40">
              <i className="fas fa-crown text-white text-2xl"></i>
            </div>
            <h4 className="text-emerald-400 text-[11px] font-black uppercase tracking-widest mb-6 ml-10">Titan Strategic Verdict</h4>
            <p className="text-2xl font-black text-zinc-100 leading-snug italic">
              "{result.titanVerdict}"
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <div className="bg-zinc-950 border border-zinc-800 rounded-[50px] p-10">
            <div className="flex items-center justify-between mb-10">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">Titan Decision Matrix</h4>
              <span className="text-[10px] text-emerald-500 font-mono">100% SECURE PROTOCOL</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ChecklistItem label="PE Benchmark Validation" passed={result.checklist?.peUnder15} />
              <ChecklistItem label="Dividend Yield (>7%)" passed={result.checklist?.dividendAbove7} />
              <ChecklistItem label="Sponsor Integrity (>30%)" passed={result.checklist?.sponsorAbove30} />
              <ChecklistItem label="Debt/Equity Safety" passed={result.checklist?.lowDebt} />
              <ChecklistItem label="Asset Quality (Tier-A)" passed={result.checklist?.categoryA} />
              <ChecklistItem label="NAV Undervaluation" passed={result.checklist?.navSafety} />
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-[50px] p-10 h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '20px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="close" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClose)" strokeWidth={6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
        <div className="bg-zinc-950/50 border border-emerald-500/10 rounded-[50px] p-12">
          <h5 className="text-emerald-400 font-black mb-10 flex items-center gap-4 uppercase tracking-[0.3em] text-[11px]">
            <i className="fas fa-bolt-lightning"></i> Dominant Catalysts
          </h5>
          <ul className="space-y-8">
            {result.pros?.map((pro, i) => (
              <li key={i} className="text-zinc-300 text-lg flex gap-6 items-start">
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-[10px] flex-shrink-0 mt-1">
                  <i className="fas fa-plus"></i>
                </div>
                <span className="font-bold">{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-zinc-950/50 border border-rose-500/10 rounded-[50px] p-12">
          <h5 className="text-rose-400 font-black mb-10 flex items-center gap-4 uppercase tracking-[0.3em] text-[11px]">
            <i className="fas fa-shield-virus"></i> Strategic Risks
          </h5>
          <ul className="space-y-8">
            {result.cons?.map((con, i) => (
              <li key={i} className="text-zinc-300 text-lg flex gap-6 items-start">
                <div className="w-8 h-8 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center text-[10px] flex-shrink-0 mt-1">
                  <i className="fas fa-minus"></i>
                </div>
                <span className="font-bold">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
