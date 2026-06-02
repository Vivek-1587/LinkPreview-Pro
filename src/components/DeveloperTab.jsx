import React, { useState } from 'react';
import { FileCode, Copy, Check, Sparkles, BookOpen, Star, HelpCircle, Layers, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DeveloperTab() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [embedTheme, setEmbedTheme] = useState('dark'); // 'dark' | 'light'
  const [borderRadius, setBorderRadius] = useState('16px'); // '8px' | '12px' | '16px'
  const [showBorder, setShowBorder] = useState(true);

  // Dynamic code snippet generation
  const embedCodeSnippet = `<div class="link-preview-pro" 
     data-url="https://github.com" 
     data-theme="${embedTheme}" 
     data-radius="${borderRadius}"
     data-border="${showBorder ? 'true' : 'false'}">
</div>
<script async src="https://cdn.linkpreviewpro.com/v1/embed.js"></script>`;

  const bookmarkletJS = `javascript:(function(){const url=window.location.href;window.open('https://linkpreviewpro.com/dashboard?analyze='+encodeURIComponent(url),'_blank');})();`;

  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Developer Scaffolding Tools</h2>
        <p className="text-xs text-zinc-400 mt-1">Configure client-side preview snippets, embed dynamic widgets, and install the extraction bookmarklet utility.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Embed Widget Generator (7/12 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="premium-card p-6 flex flex-col justify-between min-h-[500px]">
            
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-white">Embed Code Generator</h3>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded">
                  CLIENT COMPONENT
                </span>
              </div>

              {/* Layout Customizer Controls */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Theme Palette</label>
                  <select
                    value={embedTheme}
                    onChange={(e) => setEmbedTheme(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-zinc-900/60 p-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/40 cursor-pointer"
                  >
                    <option value="dark" className="bg-zinc-950">Premium Dark</option>
                    <option value="light" className="bg-zinc-950">Clean Light</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Corner Radius</label>
                  <select
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-zinc-900/60 p-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/40 cursor-pointer"
                  >
                    <option value="8px" className="bg-zinc-950">Sleek (8px)</option>
                    <option value="12px" className="bg-zinc-950">Rounded (12px)</option>
                    <option value="16px" className="bg-zinc-950">Circular (16px)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Card Borders</label>
                  <select
                    value={showBorder ? 'true' : 'false'}
                    onChange={(e) => setShowBorder(e.target.value === 'true')}
                    className="w-full rounded-lg border border-white/5 bg-zinc-900/60 p-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/40 cursor-pointer"
                  >
                    <option value="true" className="bg-zinc-950">Show Outline</option>
                    <option value="false" className="bg-zinc-950">Borderless Flat</option>
                  </select>
                </div>
              </div>

              {/* Code Snippet Editor Display */}
              <div className="relative mb-6 rounded-xl border border-white/5 bg-zinc-950 p-4 font-mono text-[11px] text-zinc-400 group">
                <pre className="text-blue-400/90 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {embedCodeSnippet}
                </pre>
                <button
                  onClick={() => handleCopyCode(embedCodeSnippet)}
                  className="absolute right-3.5 top-3.5 p-1.5 rounded-lg border border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  {copiedCode ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Live Embed Mockup Preview */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Generated Live Widget Preview</label>
                <div
                  className={`w-full p-5 flex items-center justify-center transition-all ${
                    embedTheme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
                  }`}
                  style={{
                    borderRadius: borderRadius,
                    border: showBorder ? `1px solid ${embedTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` : 'none',
                  }}
                >
                  <div className="flex gap-4 items-center max-w-md w-full">
                    <img
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop"
                      alt="GitHub"
                      className="h-14 w-24 object-cover rounded-lg border border-white/5 flex-shrink-0"
                    />
                    <div>
                      <h4 className={`text-xs font-bold ${embedTheme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>GitHub: Let's build from here</h4>
                      <p className={`text-[10px] mt-0.5 ${embedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} line-clamp-2`}>
                        GitHub is where over 100 million developers shape the future of software, hosting code libraries and managing workflows.
                      </p>
                      <span className="text-[9px] text-blue-500 uppercase font-semibold mt-1 inline-block">github.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 mt-5 border-t border-white/5 pt-3">
              Embed widget fetches cached preview data instantly. Includes lazy loading and zero layout shifts.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Scrapping Bookmarklet Card (5/12 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="premium-card p-6 flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-white">Browser Bookmarklet</h3>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded">
                  SETUP GUIDE
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Quickly crawl any tab in your web browser. Drag the button below to your bookmark toolbar to instantly send the URL to the analyzer with one click.
              </p>

              {/* DRAGGABLE WORKING BOOKMARKLET BUTTON */}
              <div className="flex items-center justify-center p-6 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20 mb-6">
                <a
                  href={bookmarkletJS}
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Drag this button to your Browser Bookmarks bar! To use: open any website, click the bookmark, and the dashboard will analyze the URL.');
                  }}
                  className="inline-flex items-center gap-2 bg-gradient-to-tr from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs px-5 py-3.5 rounded-xl shadow-lg cursor-grab transition-all select-none hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:cursor-grabbing"
                  title="Drag me to bookmarks toolbar"
                >
                  <Layers className="h-4 w-4" />
                  <span>Preview Page Pro</span>
                </a>
              </div>

              {/* Detailed Installation Instructions */}
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span>Installation Directions</span>
                </h4>
                
                <ol className="space-y-2.5 list-decimal pl-4 text-zinc-400 leading-relaxed">
                  <li>Ensure your browser bookmarks/favorites bar is visible (<kbd className="bg-zinc-900 px-1 py-0.5 rounded text-[10px] text-zinc-300 border border-white/5">Ctrl+Shift+B</kbd>).</li>
                  <li>Click and drag the glowing <strong className="text-white">Preview Page Pro</strong> button up into your bookmarks toolbar.</li>
                  <li>Open any live webpage you wish to test (e.g. `linear.app`).</li>
                  <li>Click the bookmarklet button. The active URL is captured and instantly loaded in the analyzer dashboard!</li>
                </ol>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mt-6 flex items-center gap-1.5 text-[10px] text-zinc-500">
              <HelpCircle className="h-3.5 w-3.5 text-zinc-600" />
              <span>Supports Chrome, Safari, Firefox, and Edge desktop browsers.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
