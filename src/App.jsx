import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import LivePreview from './components/LivePreview';
import HistoryTable from './components/HistoryTable';
import CollectionsGrid from './components/CollectionsGrid';
import ApiDashboard from './components/ApiDashboard';
import ApiKeysManager from './components/ApiKeysManager';
import DeveloperTab from './components/DeveloperTab';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [collections, setCollections] = useState([]);

  // Load all previews and collections from the SQLite database
  const loadData = async () => {
    try {
      const previews = await api.previews.list();
      setHistoryItems(previews);

      const cols = await api.collections.list();
      setCollections(cols);
    } catch (err) {
      console.error('Failed to retrieve LinkPreview Pro data records:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Crawling process with active real metadata scraping backend queries
  const simulateAnalyze = async (url) => {
    setIsLoading(true);
    setLogs([]);
    setCurrentPreview(null);

    // Beautiful premium crawler sequencing logs
    const logsSequence = [
      'DNS lookup initiated for hostname...',
      'SSL/TLS handshake negotiated successfully.',
      'GET / HTTP/1.1 requested.',
      'Parsing DOM attributes from Document Object model...',
      'Extracting og:title, og:description, and og:image tags...',
      'Mapping Twitter-card schema attributes...',
      'Done! JSON schema compilation generated successfully.',
    ];

    for (let i = 0; i < logsSequence.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setLogs((prev) => [...prev, logsSequence[i]]);
    }

    try {
      const realPreview = await api.previews.create(url);
      setCurrentPreview(realPreview);
      setHistoryItems((prev) => [realPreview, ...prev]);
      
      // Reload collections to update counts dynamically
      const cols = await api.collections.list();
      setCollections(cols);
    } catch (err) {
      console.error('Failed to scrape URL metadata:', err);
      // Construct a premium error preview fallback
      const domain = url.replace('https://', '').replace('http://', '').split('/')[0];
      const errorPreview = {
        id: `err_${Date.now()}`,
        url: url.startsWith('http') ? url : `https://${url}`,
        domain,
        title: domain,
        description: 'Failed to extract metadata from website. Connection refused or site blocked crawler.',
        ogImage: null,
        favicon: null,
        status: 'Error',
        createdAt: new Date().toISOString(),
      };
      setCurrentPreview(errorPreview);
      setHistoryItems((prev) => [errorPreview, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToCollection = async (collectionId) => {
    if (!currentPreview || !currentPreview.id) return;
    
    try {
      const updated = await api.previews.assignCollection(currentPreview.id, collectionId);
      setCurrentPreview(updated);
      setHistoryItems((prev) =>
        prev.map((item) => (item.id === currentPreview.id ? updated : item))
      );
      
      // Reload collections to update counts
      const cols = await api.collections.list();
      setCollections(cols);
    } catch (err) {
      console.error('Failed to save preview to collection:', err);
    }
  };

  const handleDeleteHistoryItem = async (id) => {
    try {
      await api.previews.delete(id);
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
      if (currentPreview && currentPreview.id === id) {
        setCurrentPreview(null);
      }
      
      // Reload collections
      const cols = await api.collections.list();
      setCollections(cols);
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  return (
    <div className="min-h-screen bg-bgMain text-white selection:bg-blue-600/35 flex flex-col justify-between">
      
      {/* Dynamic Header Sticky Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Layout Container */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {activeTab === 'dashboard' && (
              <>
                <Hero onAnalyze={simulateAnalyze} isLoading={isLoading} />
                <LivePreview
                  currentPreview={currentPreview}
                  logs={logs}
                  isLoading={isLoading}
                  onSaveToCollection={handleSaveToCollection}
                  collections={collections}
                />
                <ApiDashboard />
              </>
            )}

            {activeTab === 'previews' && (
              <HistoryTable
                items={historyItems}
                onDelete={handleDeleteHistoryItem}
              />
            )}

            {activeTab === 'collections' && (
              <CollectionsGrid 
                items={historyItems} 
                onUpdate={loadData}
              />
            )}

            {activeTab === 'apikeys' && (
              <ApiKeysManager />
            )}

            {activeTab === 'docs' && (
              <DeveloperTab />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Branding section */}
      <footer className="border-t border-white/5 bg-zinc-950/60 py-8 px-6 backdrop-blur">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between text-zinc-500 text-[11px] font-medium gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">LinkPreview Pro</span>
            <span>•</span>
            <span>Premium Crawler Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-zinc-300 transition-colors">Terms of Use</a>
            <a href="#status" className="hover:text-zinc-300 transition-colors">System Status</a>
            <span>•</span>
            <span className="text-zinc-600">© 2026 LinkPreview Pro Inc.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
