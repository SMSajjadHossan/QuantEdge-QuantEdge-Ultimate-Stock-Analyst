
import React from 'react';
import { AnalysisResult } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatCurrency } from '../utils/dataProcessor';

interface AnalysisViewProps {
  result: AnalysisResult;
  history: any[];
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result, history }) => {
  const getDecisionColor = (decision: string) => {
    if (decision.includes('STRONG_BUY')) return 'text-emerald-400 border-emerald-500 shadow-emerald-900/20';
    if (decision.includes('BUY')) return 'text-emerald-400 border-emerald-500/50';
    if (decision.includes('SELL')) return 'text-rose-400 border-rose-500';
    return 'text-amber-400 border-amber-500/50';
  };

  const ChecklistItem = ({ label, passed }: { label: string, passed: boolean }) => (
    <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
      <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{label}</span>
      <i className={`fas ${passed ? 'fa-check-circle text-emerald-400' : 'fa-times-circle text-rose-500'}`}></i>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Top Section: Signal & Verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-8 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">Titan Signal Output</span>
            <div className={`text-4xl font-black py-4 border-y border-zinc-800 mb-6 transition-all duration-500 ${getDecisionColor(result.decision)}`}>
              {result.decision.replace('_', ' ')}
            </div>
            
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-mono">CONFIDENCE</span>
                <span className="text-white font-bold">{result.confidence}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${result.confidence}%` }}></div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-800 grid grid-cols-2 gap-4">
              <div className="text-left">
                <span className="text-[10px] text-zinc-500 font-bold block mb-1">TARGET</span>
                <span className="text-emerald-400 font-black text-lg">{formatCurrency(result.targetPrice)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 font-bold block mb-1">STOP LOSS</span>
                <span className="text-rose-400 font-black text-lg">{formatCurrency(result.stopLoss)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-6">
            <h4 className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fas fa-brain"></i> TITAN VERDICT (BENGALI)
            </h4>
            <p className="text-lg font-medium text-zinc-200 leading-relaxed italic">
              "{result.titanVerdict}"
            </p>
          </div>
        </div>

        {/* Middle: Checklist & Chart */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black uppercase tracking-widest">Master Analysis Matrix</h4>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] rounded font-mono uppercase">Fundamental</span>
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] rounded font-mono uppercase">Ownership</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <ChecklistItem label="P/E Under 15" passed={result.checklist.peUnder15} />
              <ChecklistItem label="Dividend > 7%" passed={result.checklist.dividendAbove7} />
              <ChecklistItem label="Sponsor > 30%" passed={result.checklist.sponsorAbove30} />
              <ChecklistItem label="Low/No Debt" passed={result.checklist.lowDebt} />
              <ChecklistItem label="Category A" passed={result.checklist.categoryA} />
              <ChecklistItem label="NAV Safety" passed={result.checklist.navSafety} />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-[350px]">
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
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="close" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClose)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom: Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8">
          <h5 className="text-emerald-400 font-black mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
            <i className="fas fa-arrow-up"></i> Dominant Strengths
          </h5>
          <ul className="space-y-4">
            {result.pros.map((pro, i) => (
              <li key={i} className="text-zinc-300 text-sm flex gap-3">
                <span className="text-emerald-500 font-bold">»</span> {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-8">
          <h5 className="text-rose-400 font-black mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
            <i className="fas fa-arrow-down"></i> Strategic Risks
          </h5>
          <ul className="space-y-4">
            {result.cons.map((con, i) => (
              <li key={i} className="text-zinc-300 text-sm flex gap-3">
                <span className="text-rose-500 font-bold">»</span> {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
