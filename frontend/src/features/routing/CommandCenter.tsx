// src/features/routing/CommandCenter.tsx

import { motion, AnimatePresence } from 'framer-motion';
import { ThermometerSun, MapPin, Clock, Sun, Moon, Navigation, AlertCircle } from 'lucide-react';

interface CommandCenterProps {
  origin: string;
  setOrigin: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  hour: string;
  setHour: (val: string) => void;
  loading: boolean;
  error: string | null;
  onSearch: (e: React.FormEvent) => void;
}

export default function CommandCenter({
  origin, setOrigin, destination, setDestination, hour, setHour, loading, error, onSearch
}: CommandCenterProps) {
  
  const numHour = parseInt(hour) || 14;
  const isDaytime = numHour >= 6 && numHour <= 18;
  const timeColor = isDaytime ? (numHour > 11 && numHour < 16 ? 'text-amber-500' : 'text-yellow-400') : 'text-indigo-400';

  return (
    <motion.aside 
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-80 md:w-96 flex-shrink-0 border-r border-zinc-800/60 bg-zinc-900/50 backdrop-blur-2xl flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.4)]"
    >
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center shadow-inner">
            <ThermometerSun className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500">
              HeatSafe
            </h1>
          </div>
        </div>
        <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">
          heatsafe
        </p>
      </div>

      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        <form onSubmit={onSearch} className="space-y-6">
          <div className="space-y-5 relative">
            <div className="absolute left-4 top-8 bottom-8 w-px bg-zinc-800 z-0"></div>

            <div className="relative z-10 group">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Origin</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 w-2.5 h-2.5 rounded-full border-2 border-zinc-400 bg-zinc-950 group-focus-within:border-white transition-colors"></div>
                <input 
                  type="text" value={origin} onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Search starting point..."
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all placeholder:text-zinc-600 shadow-inner"
                />
              </div>
            </div>

            <div className="relative z-10 group">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Destination</label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-2.5 h-4 w-4 text-emerald-500" />
                <input 
                  type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
                  placeholder="Search destination..."
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
            <div className="flex justify-between items-end mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Time (Hour)</label>
              </div>
              <span className={`text-sm font-mono font-bold ${timeColor}`}>
                {numHour.toString().padStart(2, '0')}:00
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-zinc-600" />
              <input 
                type="range" min="0" max="23" 
                value={hour} onChange={(e) => setHour(e.target.value)}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <Sun className={`h-4 w-4 ${isDaytime ? 'text-amber-400' : 'text-zinc-600'} transition-colors`} />
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading}
            className="w-full relative overflow-hidden group bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin"></div>
                Analyzing Thermal Grid...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Navigation className="h-4 w-4" /> Find Optimal Route
              </span>
            )}
          </motion.button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}