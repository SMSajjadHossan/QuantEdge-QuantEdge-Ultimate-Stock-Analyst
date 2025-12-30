
import React from 'react';
import { AnalysisResult } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatCurrency } from '../utils/dataProcessor';
import * as XLSX from 'xlsx';

interface AnalysisViewProps {
  result: AnalysisResult;
  history: any[];
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result, history }) => {
  const getDecisionColor = (decision: string = '') => {
    const d = decision.toUpperCase();
    if (d.includes('BUY')) return 'text-emerald-400 border-emerald-500 shadow-emerald-900/20';
    if (d.includes('AVOID') || d.includes('SELL')) return 'text-rose-400 border-rose-500 shadow-rose-900/20';
    if (d.includes('WAIT')) return 'text-amber-400 border-amber-500/50';
    return 'text-zinc-400 border-zinc-500/50';
  };

  const exportToExcel = () => {
    const wsData = [
      ["TITAN ULTIMATE REPORT", new Date().toLocaleString()],
      ["Asset", history[0]?.symbol || "N/A"],
      ["Decision", result.decision],
      ["Score", result.score],
      ["Entry Target", result.entryPrice],
      ["Exit Target", result.exitPrice],
      ["Stop Loss", result.stopLoss],
      ["Titan Verdict", result.titanVerdict],
      ["Summary", result.summary],
      [],
      ["Historical Extraction Data"],
      ["Date", "Close", "P/E", "EPS", "NAV", "Dividend Yield", "Sponsor %"],
      ...history.map(h => [h.date, h.close, h.peRatio, h.eps, h.nav, h.dividendYield, h.sponsorHolding])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Titan Analysis");
    XLSX.writeFile(wb, `Titan_Ultimate_${history[0]?.symbol || 'Stock'}_Analysis.xlsx`);
  };

  const ChecklistItem = ({ label, passed }: { label: string, passed: boolean }) => (
    <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{label}</span>
      <i className={`fas ${passed ? 'fa-check-circle text-emerald-400' : 'fa-times-circle text-rose-500/50'}`}></i>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Primary Signal Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-[40px] p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Score</div>
              <div className="text-2xl font-black text-blue-500">{result.score || 0}<span className="text-xs text-zinc-700">/100</span></div>
            </div>
            
            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">Titan Signal Output</span>
            <div className={`text-5xl font-black py-6 border-y border-zinc-800/50 mb-8 transition-all duration-500 ${getDecisionColor(result.decision)}`}>
              {result.decision}
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-left">
                <span className="text-[9px] text-zinc-600 font-black uppercase block mb-1">Entry</span>
                <span className="text-emerald-400 font-bold text-sm">{result.entryPrice}</span>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-zinc-600 font-black uppercase block mb-1">Exit</span>
                <span className="text-blue-400 font-bold text-sm">{result.exitPrice}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-zinc-600 font-black uppercase block mb-1">Stop Loss</span>
                <span className="text-rose-400 font-bold text-sm">{result.stopLoss}</span>
              </div>
            </div>

            <button 
              onClick={exportToExcel}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3"
            >
              <i className="fas fa-file-excel text-emerald-500"></i>
              Download Ultimate Report
            </button>
          </div>

          <div className="bg-blue-600/5 border border-blue-500/20 rounded-[32px] p-8 relative">
            <div className="absolute -top-3 -left-3 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
              <i className="fas fa-comment-alt text-white"></i>
            </div>
            <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4 ml-6">Titan Deep Verdict</h4>
            <p className="text-xl font-bold text-zinc-100 leading-relaxed italic">
              "{result.titanVerdict}"
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-8">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Strategy Matrix</h4>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-lg uppercase tracking-widest">Validated</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ChecklistItem label="P/E Benchmark" passed={result.checklist?.peUnder15} />
              <ChecklistItem label="Div Yield > 7%" passed={result.checklist?.dividendAbove7} />
              <ChecklistItem label="Sponsor > 30%" passed={result.checklist?.sponsorAbove30} />
              <ChecklistItem label="Debt Safety" passed={result.checklist?.lowDebt} />
              <ChecklistItem label="Blue Chip Cat" passed={result.checklist?.categoryA} />
              <ChecklistItem label="NAV Margin" passed={result.checklist?.navSafety} />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="close" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClose)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[40px] p-10">
          <h5 className="text-emerald-400 font-black mb-8 flex items-center gap-3 uppercase tracking-widest text-[10px]">
            <i className="fas fa-arrow-trend-up"></i> Dominant Indicators
          </h5>
          <ul className="space-y-6">
            {result.pros?.map((pro, i) => (
              <li key={i} className="text-zinc-300 text-sm flex gap-4 items-start">
                <span className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  <i className="fas fa-plus"></i>
                </span>
                <span className="leading-relaxed">{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-[40px] p-10">
          <h5 className="text-rose-400 font-black mb-8 flex items-center gap-3 uppercase tracking-widest text-[10px]">
            <i className="fas fa-shield-virus"></i> Critical Red Flags
          </h5>
          <ul className="space-y-6">
            {result.cons?.map((con, i) => (
              <li key={i} className="text-zinc-300 text-sm flex gap-4 items-start">
                <span className="w-6 h-6 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  <i className="fas fa-minus"></i>
                </span>
                <span className="leading-relaxed">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
