// src/features/routing/SummaryPanel.tsx

import { TrendingUp, Route, Footprints, ShieldCheck } from 'lucide-react';
import type { RouteSummaryData } from '../../types/route';

interface SummaryPanelProps {
  comparison: RouteSummaryData['comparison'];
  coolRouteInfo: RouteSummaryData['cool_route'];
}

export default function SummaryPanel({ comparison, coolRouteInfo }: SummaryPanelProps) {
  if (!comparison || !coolRouteInfo) return null;

  return (
    <div className="space-y-4">
      
      {/* ───────────────────────────────────────────────────────── */}
      {/* HERO METRIC: Shade Improvement                            */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between group hover:bg-emerald-500/15 transition-colors relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-colors"></div>
        
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Shade Gain
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-emerald-400 tracking-tight">
              +{comparison.shade_improvement_pct}
            </p>
            <span className="text-lg font-bold text-emerald-500/70">%</span>
          </div>
        </div>
        
        <div className="relative z-10 h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* SECONDARY METRICS: Distance & Trade-offs                  */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Total Distance Card */}
        <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-4 group hover:border-zinc-600/80 transition-colors">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5 text-cyan-400" /> Total Distance
          </p>
          <p className="text-xl font-bold text-zinc-100 tracking-tight">
            {(coolRouteInfo.total_length_m / 1000).toFixed(2)} 
            <span className="text-sm font-medium text-zinc-500 ml-1">km</span>
          </p>
        </div>

        {/* Extra Walk (Trade-off) Card */}
        <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-4 group hover:border-zinc-600/80 transition-colors relative overflow-hidden">
          {/* Conditional subtle warning glow if the detour is long */}
          {comparison.extra_distance_m > 0 && (
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl"></div>
          )}
          
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 relative z-10">
            <Footprints className="h-3.5 w-3.5 text-amber-400" /> Added Detour
          </p>
          
          <div className="relative z-10">
            <p className="text-xl font-bold text-amber-400 tracking-tight">
              +{comparison.extra_distance_m} 
              <span className="text-sm font-medium text-amber-500/50 ml-1">m</span>
            </p>
            <p className="text-[10px] font-medium text-zinc-500 mt-1">
              ({comparison.extra_distance_pct}% longer)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}