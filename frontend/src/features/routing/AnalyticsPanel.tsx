// src/features/routing/AnalyticsPanel.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import SummaryPanel from './SummaryPanel';
import type { RouteSummaryData } from '../../types/route';

interface AnalyticsPanelProps {
  summaryData: RouteSummaryData | null;
  loading: boolean;
}

export default function AnalyticsPanel({ summaryData, loading }: AnalyticsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-expand the panel whenever a new search is initiated
  useEffect(() => {
    if (loading) {
      setIsCollapsed(false);
    }
  }, [loading]);

  // Calculate the score safely
  const safetyScore = summaryData 
    ? Math.max(10, 100 - Math.round(summaryData.cool_route.heat_exposure_pct)) 
    : 0;

  // Calculate SVG stroke array for the animated gauge (Radius 28 -> Circumference ~175.9)
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (circumference * safetyScore) / 100;

  return (
    <AnimatePresence>
      {(summaryData || loading) && (
        <motion.aside 
          initial={{ width: 0, opacity: 0 }}
          animate={{ 
            width: isCollapsed ? 0 : 'auto', 
            opacity: 1 
          }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-full flex-shrink-0 bg-zinc-900/60 backdrop-blur-2xl border-l border-zinc-800/60 shadow-[-8px_0_32px_rgba(0,0,0,0.4)] z-20"
        >
          {/* ───────────────────────────────────────────────────────── */}
          {/* FLOATING TOGGLE HANDLE                                    */}
          {/* ───────────────────────────────────────────────────────── */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-1/2 -left-6 -translate-y-1/2 w-6 h-16 bg-zinc-800/90 border border-zinc-700/60 backdrop-blur-xl text-zinc-400 hover:text-emerald-400 flex items-center justify-center rounded-l-xl z-50 shadow-[-4px_0_12px_rgba(0,0,0,0.3)] border-r-0 transition-colors focus:outline-none"
            title={isCollapsed ? "Expand Analytics" : "Collapse Analytics"}
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* ───────────────────────────────────────────────────────── */}
          {/* INNER CONTENT (Fixed width prevents squishing)            */}
          {/* ───────────────────────────────────────────────────────── */}
          <div className="h-full overflow-hidden">
            <div className="w-80 md:w-96 h-full overflow-y-auto custom-scrollbar">
              
              {loading ? (
                // LOADING SKELETON
                <div className="p-6 space-y-6">
                  <div className="h-6 w-32 bg-zinc-800/50 rounded-md animate-pulse"></div>
                  <div className="h-32 w-full bg-zinc-800/30 rounded-2xl border border-zinc-700/30 animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-zinc-800/30 rounded-2xl border border-zinc-700/30 animate-pulse"></div>
                    <div className="h-24 bg-zinc-800/30 rounded-2xl border border-zinc-700/30 animate-pulse"></div>
                  </div>
                </div>
              ) : summaryData ? (
                // LOADED DASHBOARD
                <div className="p-6 space-y-6">
                  
                  {/* Header */}
                  <div className="relative pb-4">
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-500/50 via-zinc-800 to-transparent"></div>
                    <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2 uppercase tracking-widest">
                      <Activity className="h-4 w-4 text-emerald-400" /> Route Intelligence
                    </h2>
                  </div>

                  {/* External Summary Component */}
                  <SummaryPanel 
                    comparison={summaryData.comparison} 
                    coolRouteInfo={summaryData.cool_route} 
                  />

                  {/* Route Safety Index Card */}
                  <div className="mt-8 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors"></div>
                    
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Route Safety Index</h3>
                    
                    <div className="flex items-center gap-5">
                      {/* Animated SVG Gauge */}
                      <div className="relative flex items-center justify-center">
                        <svg className="w-16 h-16 transform -rotate-90 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                          {/* Background Track */}
                          <circle 
                            cx="32" cy="32" r="28" 
                            stroke="currentColor" strokeWidth="5" fill="transparent" 
                            className="text-zinc-800" 
                          />
                          {/* Animated Progress Track */}
                          <motion.circle 
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                            cx="32" cy="32" r="28" 
                            stroke="currentColor" strokeWidth="5" fill="transparent" 
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            className="text-emerald-500" 
                          />
                        </svg>
                        <span className="absolute text-lg font-bold text-white tracking-tight">
                          {safetyScore}
                        </span>
                      </div>
                      
                      {/* Status Text */}
                      <div>
                        <p className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 
                          Optimal Condition
                        </p>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                          Thermal exposure is actively minimized.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              ) : null}
              
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}