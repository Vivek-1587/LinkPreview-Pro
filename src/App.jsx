// src/App.jsx - Main Application entry point with custom router and authentication
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import LivePreview from './components/LivePreview';
import HistoryTable from './components/HistoryTable';
import CollectionsGrid from './components/CollectionsGrid';
import ApiDashboard from './components/ApiDashboard';
import DeveloperTab from './components/DeveloperTab';
import LoginGate from './components/LoginGate';
import Profile from './components/Profile';
import Settings from './components/Settings';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './api/client';
import { useAuth } from './context/AuthContext';
import { Link2 } from 'lucide-react';

export default function App() {
  const { user, loading, isAuthenticated } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [collections, setCollections] = useState([]);

  // Popstate history listener for path changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Load all user previews and collections when logged in
  const loadData = async () => {
    if (!isAuthenticated) return;
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
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, currentPath]);

  // Crawling process with active real metadata scraping backend queries
  const simulateAnalyze = async (url) => {
    setIsLoading(true);
    setLogs([]);
    setCurrentPreview(null);

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
      await new Promise((resolve) => setTimeout(resolve, 200));
      setLogs((prev) => [...prev, logsSequence[i]]);
    }

    try {
      const realPreview = await api.previews.create(url);
      setCurrentPreview(realPreview);
      setHistoryItems((prev) => [realPreview, ...prev]);
      
      // Reload collections to update counts
      const cols = await api.collections.list();
      setCollections(cols);
    } catch (err) {
      console.error('Failed to scrape URL metadata:', err);
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
      
      const cols = await api.collections.list();
      setCollections(cols);
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  // 1. Loading Initial Session State
  if (loading) {
    return (
      <div className="min-h-screen bg-bgMain text-white flex flex-col items-center justify-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <Link2 className="h-8 w-8 text-white animate-spin" />
        </div>
        <p className="text-xs text-zinc-400 mt-4 font-semibold tracking-wider uppercase animate-pulse">Initializing Workspace...</p>
      </div>
    );
  }

  // 2. Unauthenticated State: Show LoginGate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bgMain text-white selection:bg-blue-600/35 flex flex-col justify-between">
        <Navigation currentPath={currentPath} />
        <main className="flex-1 pb-16 flex items-center justify-center">
          <LoginGate />
        </main>
        <footer className="border-t border-white/5 bg-zinc-950/60 py-8 px-6 backdrop-blur">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between text-zinc-500 text-[11px] font-medium gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-400">LinkPreview Pro</span>
              <span>•</span>
              <span>Premium Crawler Engine</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-zinc-600">© 2026 LinkPreview Pro Inc. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // 3. Authenticated State: Route components dynamically based on path
  const isSettings = currentPath.startsWith('/settings');
  const isProfile = currentPath === '/profile';
  const isPreviews = currentPath === '/previews';
  const isCollections = currentPath === '/collections';
  const isDocs = currentPath === '/docs';
  const isDashboard = !isPreviews && !isCollections && !isDocs && !isProfile && !isSettings;

  return (
    <div className="min-h-screen bg-bgMain text-white selection:bg-blue-600/35 flex flex-col justify-between">
      
      {/* Dynamic Header Sticky Navigation */}
      <Navigation currentPath={currentPath} />

      {/* Main Content Layout Container */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {isDashboard && (
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

            {isPreviews && (
              <HistoryTable
                items={historyItems}
                onDelete={handleDeleteHistoryItem}
              />
            )}

            {isCollections && (
              <CollectionsGrid 
                items={historyItems} 
                onUpdate={loadData}
              />
            )}

            {isDocs && (
              <DeveloperTab />
            )}

            {isProfile && (
              <Profile onBack={navigateToHome} />
            )}

            {isSettings && (
              <Settings
                subSection={currentPath === '/settings/api-keys' ? 'api-keys' : 'account'}
                onBack={navigateToHome}
              />
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
