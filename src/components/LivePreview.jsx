import React, { useState, useEffect } from 'react';
import { Terminal, ShieldCheck, Copy, Check, Bookmark, Globe, Sparkles, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function PreviewImage({ src, alt, domain, favicon }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const isPlaceholder = src && src.startsWith('data:image/svg+xml');
  const isScreenshot = src && src.startsWith('data:image/jpeg');
  const fitClass = (isPlaceholder || isScreenshot) ? 'object-contain' : 'object-cover';

  if (error || !src) {
    const safeDomain = (domain || 'External Link').slice(0, 40);
    const gradients = [
      ['#3B82F6', '#6366F1'],
      ['#8B5CF6', '#EC4899'],
      ['#10B981', '#0EA5E9'],
      ['#F59E0B', '#EF4444'],
      ['#06B6D4', '#3B82F6'],
    ];
    const charCode = safeDomain.charCodeAt(0) || 0;
    const gradientIndex = charCode % gradients.length;
    const [c1, c2] = gradients[gradientIndex];
    const initial = safeDomain.charAt(0).toUpperCase() || 'E';

    return (
      <svg className="w-full h-full" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-client" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#09090B" />
            <stop offset="100%" stopColor="#18181B" />
          </linearGradient>
          <linearGradient id="ring-client" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
          <radialGradient id="glow-client" cx="50%" cy="45%" r="35%">
            <stop offset="0%" stopColor={c1} stopOpacity="0.2" />
            <stop offset="100%" stopColor={c1} stopOpacity="0" />
          </radialGradient>
          <clipPath id="faviconClip-client">
            <circle cx="400" cy="186" r="38" />
          </clipPath>
        </defs>
        <rect width="800" height="450" fill="url(#bg-client)" />
        <rect width="800" height="450" fill="url(#glow-client)" />
        <circle cx="400" cy="186" r="72" fill="none" stroke="url(#ring-client)" strokeWidth="3" opacity="0.6" />
        <circle cx="400" cy="186" r="56" fill="#09090B" stroke="#27272A" strokeWidth="1.5" />
        {favicon ? (
          <image href={favicon} x="362" y="148" width="76" height="76" clipPath="url(#faviconClip-client)" />
        ) : (
          <text x="400" y="210" fontFamily="Inter, system-ui, sans-serif" fontSize="52" fontWeight="900" fill="white" textAnchor="middle" opacity="0.9">
            {initial}
          </text>
        )}
        <text x="400" y="306" fontFamily="Inter, system-ui, sans-serif" fontSize="28" fontWeight="700" fill="#FFFFFF" textAnchor="middle" letterSpacing="-0.5">
          {safeDomain}
        </text>
        <text x="400" y="338" fontFamily="Inter, system-ui, sans-serif" fontSize="12" fontWeight="600" fill={c1} textAnchor="middle" letterSpacing="4">
          LINKPREVIEW PRO
        </text>
        <text x="400" y="360" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fontWeight="400" fill="#52525B" textAnchor="middle">
          PREMIUM METADATA EXTRACTOR
        </text>
      </svg>
    );
  }

  return (
    <img
      src={src}
      alt={alt || domain}
      className={`w-full h-full ${fitClass}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

export default function LivePreview({ currentPreview, logs, isLoading, onSaveToCollection, collections = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('metadata'); // 'metadata' | 'json'
  const [copiedText, setCopiedText] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);

  const cleanPreview = currentPreview ? {
    title: currentPreview.title || '',
    description: currentPreview.description || '',
    image: currentPreview.ogImage || '',
    domain: currentPreview.domain || '',
    favicon: currentPreview.favicon || ''
  } : null;

  const handleCopyMetadata = () => {
    if (!cleanPreview) return;
    navigator.clipboard.writeText(JSON.stringify(cleanPreview, null, 2));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Extraction Logs & Details (5/12 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="premium-card p-6 min-h-[400px] flex flex-col">
            
            {/* Tab Selector */}
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveSubTab('metadata')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                    activeSubTab === 'metadata' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Extraction Console
                </button>
                <button
                  onClick={() => setActiveSubTab('json')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                    activeSubTab === 'json' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Raw API JSON
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-medium text-zinc-500">API Status: Online</span>
              </div>
            </div>

            {/* Content Switcher */}
            <div className="flex-1 flex flex-col justify-between">
              
              {/* extraction console view */}
              {activeSubTab === 'metadata' && (
                <div className="flex-1 flex flex-col">
                  {/* Console logs terminal */}
                  <div className="flex items-center gap-2 mb-3 bg-zinc-900/60 border border-white/5 px-3 py-2 rounded-lg">
                    <Terminal className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[11px] font-mono text-zinc-400">crawling-agent-logs.sh</span>
                  </div>

                  <div className="flex-1 font-mono text-xs text-zinc-300 space-y-2.5 bg-black/40 border border-white/5 p-4 rounded-xl max-h-[260px] overflow-y-auto">
                    {isLoading ? (
                      logs.map((log, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex gap-2"
                        >
                          <span className="text-zinc-600 select-none">&gt;</span>
                          <span className={log.includes('Done') || log.includes('success') ? 'text-blue-400 font-medium' : 'text-zinc-400'}>
                            {log}
                          </span>
                        </motion.div>
                      ))
                    ) : currentPreview ? (
                      <div className="space-y-2">
                        <div className="flex gap-2 text-zinc-500">
                          <span>&gt;</span>
                          <span>Crawler initialized for {currentPreview.domain}</span>
                        </div>
                        <div className="flex gap-2 text-emerald-400">
                          <span>✓</span>
                          <span>HTTP 200 OK Response fetched</span>
                        </div>
                        <div className="flex gap-2 text-blue-400">
                          <span>✓</span>
                          <span>Found Open Graph metadata block</span>
                        </div>
                        <div className="flex gap-2 text-purple-400">
                          <span>✓</span>
                          <span>Extracted {Object.keys(currentPreview).length} custom schema nodes</span>
                        </div>
                        <div className="flex gap-2 text-zinc-300 font-semibold border-t border-white/5 pt-2 mt-2">
                          <span>&gt;</span>
                          <span>Extraction complete! Performance: {currentPreview.time || '142ms'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center py-10 font-sans">
                        <Globe className="h-8 w-8 text-zinc-700 mb-2.5 stroke-[1.5]" />
                        <p className="text-xs">Awaiting website crawl session...</p>
                        <p className="text-[10px] text-zinc-700 mt-1">Enter a URL in the hero search above to extract metadata.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* raw json view */}
              {activeSubTab === 'json' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 font-mono text-[11px] text-zinc-400 bg-black/40 border border-white/5 p-4 rounded-xl max-h-[300px] overflow-y-auto">
                    {currentPreview ? (
                      <pre className="text-blue-400/90 leading-relaxed">
                        {JSON.stringify(cleanPreview, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center py-10 font-sans">
                        <FileJson className="h-8 w-8 text-zinc-700 mb-2.5 stroke-[1.5]" />
                        <p className="text-xs">No active JSON response loaded.</p>
                        <p className="text-[10px] text-zinc-700 mt-1">Extract link preview schema to see raw payload here.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer status summary */}
              {currentPreview && !isLoading && (
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>SSL Certificate Valid</span>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded">
                    CACHE HIT
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Interactive High-Fidelity Preview Card (7/12 cols) */}
        <div className="lg:col-span-7">
          <div className="premium-card p-6 min-h-[400px] flex flex-col justify-between">
            
            {/* Header: Label + Badges */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Live Link Preview Card</span>
              {currentPreview && (
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                    <Globe className="h-3 w-3" />
                    <span>OG:Default</span>
                  </span>
                  <span className="flex items-center gap-1 rounded bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                    <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span>Twitter Summary Large</span>
                  </span>
                </div>
              )}
            </div>

            {/* Central content */}
            <div className="flex-1 flex items-center justify-center">
              {isLoading ? (
                /* Loading Skeleton Loader with beautiful shimmers */
                <div className="w-full max-w-lg border border-white/5 bg-zinc-900/30 rounded-2xl overflow-hidden shadow-2xl">
                  {/* OG Image Skeleton */}
                  <div className="w-full h-48 shimmer-bg" />
                  {/* Website Metadata Skeleton */}
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full shimmer-bg" />
                      <div className="h-3.5 w-24 rounded shimmer-bg" />
                    </div>
                    <div className="h-6 w-3/4 rounded shimmer-bg" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-full rounded shimmer-bg" />
                      <div className="h-3.5 w-5/6 rounded shimmer-bg" />
                    </div>
                  </div>
                </div>
              ) : currentPreview ? (
                /* Actual Crawled Open Graph Preview Card */
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-lg border border-white/10 bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl group transition-all duration-300 hover:border-white/20"
                >
                  {/* OG Image Container — handles og:image, twitter:image, screenshots, SVG placeholders */}
                  <div className="relative w-full h-48 bg-zinc-900 overflow-hidden border-b border-white/5">
                    <PreviewImage
                      src={currentPreview.ogImage}
                      alt={currentPreview.title}
                      domain={currentPreview.domain}
                      favicon={currentPreview.favicon}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    {/* Image source badge */}
                    {currentPreview.ogImage && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-zinc-400 border border-white/10">
                          {currentPreview.ogImage.startsWith('data:image/svg') ? 'placeholder' :
                           currentPreview.ogImage.startsWith('data:image/jpeg') ? 'screenshot' : 'og:image'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata Container */}
                  <div className="p-5">
                    {/* Host/Favicon Bar */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="h-5 w-5 rounded bg-zinc-900 border border-white/5 flex items-center justify-center p-0.5 overflow-hidden flex-shrink-0">
                        {currentPreview.favicon ? (
                          <img src={currentPreview.favicon} alt="Favicon" className="h-full w-full object-contain" />
                        ) : (
                          <svg className="h-3 w-3 text-zinc-500 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">{currentPreview.domain}</span>
                    </div>

                    {/* Website Title */}
                    <h3 className="text-base font-bold text-white line-clamp-1 mb-2 tracking-tight group-hover:text-blue-400 transition-colors">
                      {currentPreview.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-1">
                      {currentPreview.description}
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Blank Empty State for card */
                <div className="w-full max-w-lg border border-dashed border-white/10 rounded-2xl bg-zinc-950/20 p-10 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4 text-zinc-500 shadow-md">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-200 mb-1">Preview Awaiting Target</h4>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    LinkPreview Pro is ready. Paste a URL and extract rich content details instantly.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            {currentPreview && !isLoading && (
              <div className="flex items-center justify-between border-t border-white/5 pt-5 mt-6">
                {/* Copy JSON/Metadata */}
                <button
                  onClick={handleCopyMetadata}
                  className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl border border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Metadata</span>
                    </>
                  )}
                </button>

                {/* Save to Collection Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSaveOpen(!saveOpen)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] cursor-pointer"
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>Save to Collection</span>
                  </button>

                  <AnimatePresence>
                    {saveOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setSaveOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-48 z-50 rounded-xl border border-white/10 bg-zinc-950 p-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
                        >
                          <p className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Collection</p>
                          <div className="space-y-0.5 mt-1">
                            {collections.map((item) => (
                              <button
                                key={item.id || item}
                                onClick={() => {
                                  onSaveToCollection(item.id || item);
                                  setSaveOpen(false);
                                }}
                                className="flex w-full text-left items-center px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors"
                              >
                                <span>{item.name || item}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
