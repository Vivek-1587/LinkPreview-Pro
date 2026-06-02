import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero({ onAnalyze, isLoading }) {
  const [urlInput, setUrlInput] = useState('');

  const examples = [
    { name: 'Vercel', url: 'https://vercel.com' },
    { name: 'Stripe', url: 'https://stripe.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Linear', url: 'https://linear.app' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onAnalyze(urlInput.trim());
  };

  const handleExampleClick = (url) => {
    setUrlInput(url);
    onAnalyze(url);
  };

  return (
    <div className="relative overflow-hidden pt-20 pb-12 px-6">
      {/* Background Radial Glow */}
      <div className="glow-bg" />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs font-semibold text-blue-400 mb-6 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
        >
          <Sparkles className="h-3 w-3" />
          <span>Announcing LinkPreview Pro v2.0 API</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white mb-6"
        >
          Generate Rich Link Previews{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Instantly
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Extract rich Open Graph metadata, scrape Twitter cards, and generate pixel-perfect link previews using our blazing-fast caching API platform.
        </motion.p>

        {/* URL Input Form */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onSubmit={handleSubmit}
          className="relative max-w-2xl mx-auto flex items-center p-1.5 rounded-2xl border border-white/10 bg-zinc-950/80 shadow-[0_10px_30px_rgba(0,0,0,0.6)] focus-within:border-blue-500/50 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all"
        >
          <div className="flex items-center pl-3 flex-1">
            <Search className="h-5 w-5 text-zinc-500 mr-2.5 flex-shrink-0" />
            <input
              type="text"
              placeholder="Enter a website URL (e.g., https://github.com)..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isLoading}
              className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !urlInput.trim()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-3 rounded-xl disabled:opacity-40 disabled:hover:bg-blue-600 transition-all shadow-[0_4px_15px_rgba(59,130,246,0.35)] cursor-pointer"
          >
            <span>{isLoading ? 'Analyzing...' : 'Analyze'}</span>
            {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </motion.form>

        {/* Quick Example Tags */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-center flex-wrap gap-2.5 mt-5"
        >
          <span className="text-xs text-zinc-500">Try these:</span>
          {examples.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => handleExampleClick(item.url)}
              disabled={isLoading}
              className="text-xs font-medium px-2.5 py-1 rounded-full border border-white/5 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-white/10 transition-all cursor-pointer"
            >
              {item.name}
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
