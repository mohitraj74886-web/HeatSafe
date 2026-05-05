// src/features/risk-profile/HeatSafeChatPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, BookOpen, Sun, Moon, ArrowLeft } from 'lucide-react';

interface SourceRef {
  source_tag: string;
  page: string | number;
  preview: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  sources?: SourceRef[];
}

export default function HeatSafeChatPage({ onBack }: { onBack?: () => void }) {
  const [isNightMode, setIsNightMode] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dayVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Slow down the day video playback speed
  useEffect(() => {
    if (dayVideoRef.current) {
      dayVideoRef.current.playbackRate = 0.5; // 0.5 = 50% speed. Change this value to adjust speed.
    }
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8002/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.text, language: 'en' }),
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: data.answer,
        sources: data.sources,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: '⚠️ Communication array offline. Please ensure the RAG API is running on port 8002.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className={`relative h-screen w-full overflow-hidden transition-colors duration-1000 ${
      isNightMode ? 'bg-[#09152b] text-zinc-100' : 'bg-sky-100 text-sky-950'
    }`}>
      
      {/* ───────────────────────────────────────────────────────── */}
      {/* DYNAMIC VIDEO BACKGROUND LAYER                            */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-zinc-950">
        
        {/* Night Video Layer */}
        <motion.video
          autoPlay 
          loop 
          muted 
          playsInline
          animate={{ opacity: isNightMode ? 1 : 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
          src="/videos/night.mp4"
        />
        
        {/* Day Video Layer (With Ref for Speed Control) */}
        <motion.video
          ref={dayVideoRef}
          autoPlay 
          loop 
          muted 
          playsInline
          animate={{ opacity: isNightMode ? 0 : 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
          src="/videos/day.mp4"
        />

        {/* Color Overlay (Ensures the white chat text remains readable regardless of how bright the video gets) */}
        <motion.div 
          animate={{ 
            backgroundColor: isNightMode ? 'rgba(11, 29, 58, 0.6)' : 'rgba(255, 255, 255, 0.1)' 
          }}
          className="absolute inset-0 transition-colors duration-1000"
        />
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* TOP NAVIGATION & CONTROLS                                 */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="relative z-20 flex justify-between items-center p-6 max-w-5xl mx-auto">
        <button 
          onClick={onBack}
          className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl transition-all border ${
            isNightMode ? 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border-zinc-700' : 'bg-white/30 hover:bg-white/50 text-sky-900 border-white/50 shadow-lg'
          }`}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Map
        </button>

        <button 
          onClick={() => setIsNightMode(!isNightMode)}
          className={`p-3 rounded-full backdrop-blur-xl transition-all border ${
            isNightMode ? 'bg-[#0F2646]/80 hover:bg-[#163863]/80 text-cyan-200 border-[#1C436D] shadow-lg' : 'bg-white/30 hover:bg-white/50 text-amber-600 border-white/50 shadow-lg'
          }`}
        >
          {isNightMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* MAIN CHAT INTERFACE                                       */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto px-4">
        
        <motion.div 
          layout
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: hasMessages ? 0 : '20vh', scale: hasMessages ? 0.9 : 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
          className={`text-center ${hasMessages ? 'mb-4' : 'mb-8'}`}
        >
          <h1 className={`text-4xl md:text-6xl font-black tracking-tight mb-4 drop-shadow-md ${
            isNightMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-cyan-400' 
                        : 'text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
          }`}>
            HeatSafe Intelligence
          </h1>
          {!hasMessages && (
            <p className={`text-lg md:text-xl font-medium drop-shadow-sm ${isNightMode ? 'text-cyan-100/70' : 'text-white/90'}`}>
              What safety guidelines can I help you find today?
            </p>
          )}
        </motion.div>

        {/* Scrollable Messages */}
        <AnimatePresence>
          {hasMessages && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex-1 overflow-y-auto custom-scrollbar px-2 md:px-8 space-y-6 pb-24"
            >
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} 
                  className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center border mt-1 shadow-lg ${
                      isNightMode ? 'bg-[#0F2646] border-[#1C436D]' : 'bg-white/80 border-white'
                    }`}>
                      <Bot className={`h-4 w-4 ${isNightMode ? 'text-cyan-400' : 'text-emerald-600'}`} />
                    </div>
                  )}

                  <div className={`rounded-3xl p-5 text-sm md:text-base leading-relaxed shadow-xl backdrop-blur-2xl ${
                    msg.role === 'user' 
                      ? (isNightMode ? 'bg-cyan-900/90 text-cyan-50 rounded-tr-sm border border-cyan-700/50' : 'bg-white/90 text-sky-950 rounded-tr-sm border border-white/50') 
                      : (isNightMode ? 'bg-[#09152B]/90 border border-[#163863] text-cyan-100 rounded-tl-sm' : 'bg-white/60 border border-white/40 text-sky-950 rounded-tl-sm')
                  }`}>
                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                    
                    {msg.sources && msg.sources.length > 0 && (
                      <div className={`mt-4 pt-4 border-t space-y-2 ${isNightMode ? 'border-[#1C436D]' : 'border-sky-900/10'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isNightMode ? 'text-cyan-600' : 'text-sky-900/50'}`}>
                          <BookOpen className="h-3 w-3" /> Source Documents
                        </p>
                        <ul className="space-y-1">
                          {msg.sources.map((src, i) => (
                            <li key={i} className={`text-xs flex items-center gap-2 ${isNightMode ? 'text-cyan-400' : 'text-sky-900/70'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isNightMode ? 'bg-cyan-500' : 'bg-emerald-500'}`}></span>
                              {src.source_tag} <span className="opacity-50">(Pg. {src.page})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center mt-1 shadow-lg ${
                      isNightMode ? 'bg-[#163863] border border-[#1C436D]' : 'bg-white/80 border border-white'
                    }`}>
                      <User className={`h-4 w-4 ${isNightMode ? 'text-cyan-200' : 'text-sky-700'}`} />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex gap-4 mr-auto max-w-3xl">
                  <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center border mt-1 shadow-lg ${
                      isNightMode ? 'bg-[#0F2646] border-[#1C436D]' : 'bg-white/80 border-white'
                    }`}>
                    <Bot className={`h-4 w-4 ${isNightMode ? 'text-cyan-400' : 'text-emerald-600'}`} />
                  </div>
                  <div className={`rounded-3xl rounded-tl-sm p-5 flex gap-1.5 items-center backdrop-blur-2xl shadow-xl ${
                    isNightMode ? 'bg-[#09152B]/90 border border-[#163863]' : 'bg-white/60 border border-white/40'
                  }`}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay }} 
                        className={`w-2 h-2 rounded-full ${isNightMode ? 'bg-cyan-500' : 'bg-emerald-500'}`} 
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Dock */}
        <motion.div layout className="absolute bottom-8 left-0 right-0 px-4">
          <form onSubmit={handleSend} className={`relative flex items-center max-w-3xl mx-auto rounded-2xl shadow-2xl backdrop-blur-2xl border transition-colors ${
            isNightMode ? 'bg-[#0B1D3A]/90 border-[#1C436D] focus-within:border-cyan-400/50' : 'bg-white/70 border-white/60 focus-within:border-emerald-400'
          }`}>
            <input
              type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading}
              placeholder="Ask HeatSafe about thermal guidelines..."
              className={`w-full bg-transparent py-4 pl-6 pr-14 text-base focus:outline-none disabled:opacity-50 font-medium ${
                isNightMode ? 'text-cyan-50 placeholder:text-cyan-700' : 'text-sky-950 placeholder:text-sky-900/50'
              }`}
            />
            <button
              type="submit" disabled={!input.trim() || isLoading}
              className={`absolute right-3 h-10 w-10 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all shadow-md ${
                isNightMode ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-1" />}
            </button>
          </form>
          <p className={`text-center text-[10px] mt-4 font-bold uppercase tracking-widest drop-shadow-sm ${isNightMode ? 'text-cyan-800' : 'text-white/80'}`}>
            HeatSafe AI can make mistakes. Verify critical safety protocols.
          </p>
        </motion.div>

      </div>
    </div>
  );
}