// src/features/risk-profile/HeatSafeChatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, BookOpen } from 'lucide-react';

// Types based on your FastAPI schema
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

export default function HeatSafeChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      text: 'Hello! I am HeatSafe AI. Ask me any questions about outdoor worker safety, OSHA guidelines, or NIOSH heat standards.',
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Calling your FastAPI RAG endpoint
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

  return (
    <>
      
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 h-14 w-14 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.4)] transition-colors focus:outline-none"
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>

     
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-8 right-8 z-50 w-[400px] h-[600px] max-h-[80vh] flex flex-col bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Bot className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">HeatSafe AI</h3>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 uppercase tracking-widest">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    System Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 p-2 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI Avatar */}
                  {msg.role === 'ai' && (
                    <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 mt-1">
                      <Bot className="h-3 w-3 text-emerald-400" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-zinc-100 text-zinc-900 rounded-tr-sm' 
                      : 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 rounded-tl-sm shadow-inner'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    
                    {/* Citations/Sources from FastAPI */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-700/50 space-y-2">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> Sources cited
                        </p>
                        <ul className="space-y-1">
                          {msg.sources.map((src, i) => (
                            <li key={i} className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-500/50"></span>
                              {src.source_tag} (Pg. {src.page})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-700 flex items-center justify-center mt-1">
                      <User className="h-3 w-3 text-zinc-300" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 mt-1">
                    <Bot className="h-3 w-3 text-emerald-400" />
                  </div>
                  <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center h-[42px]">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-zinc-950/50 border-t border-zinc-800">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a heat safety question..."
                  disabled={isLoading}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 h-8 w-8 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}