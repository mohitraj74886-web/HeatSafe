// src/features/landing/HeatSafeLanding.tsx
import { motion } from 'framer-motion';
import { 
  ThermometerSun, Navigation, ShieldCheck, Bot, 
  Map, ArrowRight, Sun, Layers, Activity 
} from 'lucide-react';

interface LandingProps {
  onLaunch: () => void;
}
// animated phone 
// ─────────────────────────────────────────────────────────
const PhoneMockup = () => {
  return (
    <div className="relative w-[280px] h-[560px] md:w-[300px] md:h-[600px] bg-zinc-950 border-[8px] border-zinc-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden flex-shrink-0">
      
      
      <div className="absolute top-0 inset-x-0 h-5 w-28 bg-zinc-800 mx-auto rounded-b-xl z-50"></div>

      
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#27272a 1px, transparent 1px), linear-gradient(90deg, #27272a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} 
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} 
        className="absolute top-32 right-[-20px] w-40 h-40 bg-rose-500/40 blur-3xl rounded-full"
      />

      
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} 
        transition={{ repeat: Infinity, duration: 5, delay: 1, ease: "easeInOut" }} 
        className="absolute bottom-40 left-[-10px] w-48 h-48 bg-emerald-500/30 blur-3xl rounded-full"
      />

      
      <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 300 600">
        
        <path 
          d="M 50 480 Q 150 280 240 140" 
          fill="transparent" stroke="#f43f5e" strokeWidth="3" strokeDasharray="6 6" opacity="0.4" 
        />
        
      
        <motion.path
          d="M 50 480 Q 30 380 70 300 T 150 200 Q 190 160 240 140"
          fill="transparent"
          stroke="#10b981"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "loop", ease: "easeInOut", repeatDelay: 1.5 }}
        />

        {/* Moving Pulse Marker */}
        <motion.circle 
          r="5" fill="#fff" className="drop-shadow-[0_0_8px_rgba(16,185,129,1)]"
          initial={{ cx: 50, cy: 480 }}
          animate={{ cx: 240, cy: 140 }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
        />
      </svg>

      
      <div className="absolute top-10 left-4 right-4 h-10 bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-xl flex items-center px-4 z-20 shadow-lg">
        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
        <div className="flex-1">
          <div className="h-1.5 w-12 bg-zinc-600 rounded-full mb-1"></div>
          <div className="h-1.5 w-20 bg-zinc-700 rounded-full"></div>
        </div>
      </div>

     
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", repeatDelay: 3.5, delay: 2 }}
        className="absolute top-24 left-4 right-4 bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl rounded-xl p-3 z-30 flex items-start gap-3 shadow-2xl"
      >
        <div className="p-1.5 bg-emerald-500/20 rounded-lg shrink-0">
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div>
          <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">RAG Intelligence</p>
          <p className="text-[10px] text-zinc-300 leading-tight">Route altered. Bypassing 42°C concrete zone via tree canopy.</p>
        </div>
      </motion.div>

      {/* UI: Bottom Floating Analytics Card (Fixed cutoff issue) */}
      <div className="absolute bottom-6 left-4 right-4 z-30">
        <div className="bg-zinc-900/95 border border-zinc-700/80 rounded-2xl p-4 backdrop-blur-2xl shadow-2xl">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Safety Index</p>
              <p className="text-lg font-black text-white leading-none">94<span className="text-xs text-zinc-500 font-medium">/100</span></p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Shade Gain</p>
              <p className="text-xs font-bold text-emerald-400 leading-none">+45%</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }} animate={{ width: "94%" }} 
              transition={{ duration: 2, ease: "easeOut", delay: 0.5 }} 
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HeatSafeLanding({ onLaunch }: LandingProps) {
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px]"></div>
      </div>

     
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center shadow-inner">
            <ThermometerSun className="h-6 w-6 text-emerald-400" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
            HeatSafe
          </span>
        </div>
        <button 
          onClick={onLaunch}
          className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded-full text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          Launch App
        </button>
      </nav>

      <main className="relative z-10">
        
       
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pb-24 min-h-[75vh] flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center w-full">
            
          
            <div className="flex flex-col items-start text-left order-2 lg:order-1">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Thermal Grid Online
              </motion.div>

              <motion.h1 
                initial="hidden" animate="visible" variants={fadeInUp}
                className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-6"
              >
                Navigate the heat. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500">
                  Save lives.
                </span>
              </motion.h1>

              <motion.p 
                initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: 0.1 }}
                className="text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed"
              >
                AI-powered thermal route optimization for outdoor workers. We analyze solar positioning, shade data, and LLaMA-3 indexed OSHA guidelines to calculate the safest path forward.
              </motion.p>

              <motion.div 
                initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
              >
                <button 
                  onClick={onLaunch}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                >
                  <Navigation className="h-5 w-5" /> Initialize Navigator
                </button>
                <a 
                  href="#features"
                  className="w-full sm:w-auto px-8 py-4 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 font-bold rounded-xl flex items-center justify-center gap-3 transition-all backdrop-blur-xl"
                >
                  Explore Features <ArrowRight className="h-5 w-5 text-zinc-500" />
                </a>
              </motion.div>
            </div>

            
            <motion.div 
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
              className="flex justify-center lg:justify-end order-1 lg:order-2 perspective-1000"
            >
              <div className="transform lg:rotate-y-[-10deg] lg:rotate-x-[5deg] transition-transform duration-700 hover:rotate-y-0 hover:rotate-x-0 cursor-default">
                <PhoneMockup />
              </div>
            </motion.div>

          </div>
        </section>

      
        <section id="features" className="max-w-7xl mx-auto px-6 py-16 relative z-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Core Intelligence</h2>
            <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">Powered by Advanced Algorithms & RAG</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 hover:border-emerald-500/30 transition-colors group">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <Map className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Thermal Routing Engine</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Our backend utilizes NetworkX and dynamic Dijkstra's algorithms to map the coolest possible routes, minimizing dangerous heat exposure.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 hover:border-emerald-500/30 transition-colors group">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Sun className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Solar Position Analytics</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Shadows change. So do our routes. Adjust the time-slider to see how building shadows and tree canopies affect thermal safety throughout the day.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 hover:border-emerald-500/30 transition-colors group">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <Bot className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">HeatSafe AI Assistant</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Chat with our integrated LLaMA-3 RAG pipeline. Instantly query official OSHA and NIOSH heat safety manuals with exact page citations.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 hover:border-emerald-500/30 transition-colors group">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Safety Index Scoring</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Evaluate trade-offs between the shortest path and the coolest path with real-time analytics, distance percentages, and a 1-100 Route Safety Index.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 hover:border-emerald-500/30 transition-colors group">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6 text-rose-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Emergency Shelters</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Identify pre-verified safe shelters, cooling centers, and high-shade parks injected directly onto the map via GeoJSON layers.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 hover:border-emerald-500/30 transition-colors group">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Tier Architecture</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Built on a highly scalable stack featuring a React/Vite frontend, a FastAPI routing engine, and a separate FastAPI RAG inference server.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}