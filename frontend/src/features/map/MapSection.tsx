// src/features/map/MapSection.tsx
import { motion } from 'framer-motion';
import { Map as MapIcon } from 'lucide-react';
import MapWidget from './MapWidget'; // Your existing robust map component

interface MapSectionProps {
  coolRoute: any;
  shortRoute: any;
  shelters: any;
  loading: boolean;
}

export default function MapSection({ coolRoute, shortRoute, shelters, loading }: MapSectionProps) {
  return (
    <main className="flex-1 relative bg-zinc-950 z-0">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      {!coolRoute && !loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="h-24 w-24 rounded-full border border-zinc-800 bg-zinc-900/50 flex items-center justify-center mb-6 shadow-2xl"
          >
            <MapIcon className="h-8 w-8 text-zinc-700" />
          </motion.div>
          <h2 className="text-lg font-medium text-zinc-400">Grid Standby</h2>
          <p className="text-sm text-zinc-600 mt-2">Initialize a search to begin thermal analysis.</p>
        </div>
      )}

      {/* MapWrapper - Absolute inset-0 guarantees Leaflet works */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${loading ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
        <MapWidget coolRoute={coolRoute} shortRoute={shortRoute} shelters={shelters} />
      </div>

      {/* Floating Legend */}
      {coolRoute && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 px-5 py-3 rounded-full shadow-2xl flex items-center gap-6 z-20"
        >
          <div className="flex items-center gap-2 group">
            <div className="w-5 h-0.5 border-b-2 border-dashed border-cyan-500"></div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 group-hover:text-cyan-400 transition-colors">Fastest Route</span>
          </div>
          <div className="w-px h-4 bg-zinc-800"></div>
          <div className="flex items-center gap-2 group">
            <div className="w-5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-amber-500"></div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 group-hover:text-emerald-400 transition-colors">HeatSafe Optimized</span>
          </div>
        </motion.div>
      )}
    </main>
  );
}