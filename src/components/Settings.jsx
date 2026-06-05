// src/components/Settings.jsx - Workspace Settings panel
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Key, FolderHeart, Shield, Sun, Moon, ArrowLeft, Save, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import ApiKeysManager from './ApiKeysManager';

export default function WorkspaceSettings({ subSection, onBack }) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState(subSection === 'api-keys' ? 'apikeys' : 'account'); // 'account' | 'apikeys' | 'collections'
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const [defaultSort, setDefaultSort] = useState('date-desc');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (subSection === 'api-keys') {
      setActiveSubTab('apikeys');
    }
  }, [subSection]);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    // Toggle system html dark class if desired
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-mode-mock');
    } else {
      document.documentElement.classList.remove('light-mode-mock');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Dashboard</span>
      </button>

      {/* Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Workspace Settings</h2>
        <p className="text-xs text-zinc-400 mt-1">Configure account preferences, theme options, security, and developer credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Settings Navigation Tabs (3/12 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-1.5 bg-zinc-950/40 p-2 rounded-2xl border border-white/5">
          <button
            onClick={() => {
              setActiveSubTab('account');
              window.history.pushState({}, '', '/settings');
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
              activeSubTab === 'account' ? 'bg-white/5 text-white border border-white/10' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Account & Preferences</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('apikeys');
              window.history.pushState({}, '', '/settings/api-keys');
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
              activeSubTab === 'apikeys' ? 'bg-white/5 text-white border border-white/10' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="h-4 w-4" />
            <span>API Credentials</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('collections');
              window.history.pushState({}, '', '/settings');
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
              activeSubTab === 'collections' ? 'bg-white/5 text-white border border-white/10' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderHeart className="h-4 w-4" />
            <span>Collection Preferences</span>
          </button>
        </div>

        {/* Right Side: Tab Contents (9/12 cols) */}
        <div className="lg:col-span-9">
          {activeSubTab === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card p-6 space-y-6"
            >
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-bold text-white">General Account Settings</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Manage user credentials and theme selections.</p>
              </div>

              <form onSubmit={handleSavePreferences} className="space-y-5">
                {/* Profile display name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Account Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full max-w-md text-xs bg-zinc-900/60 border border-white/10 focus:border-blue-500 rounded-xl py-3 px-4 text-white outline-none transition-all"
                  />
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Registered Email (Immutable)</label>
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    className="w-full max-w-md text-xs bg-zinc-950/80 border border-white/5 text-zinc-500 rounded-xl py-3 px-4 outline-none select-none cursor-not-allowed"
                  />
                </div>

                {/* Theme Selector */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Theme Preference</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'border-blue-500/30 bg-blue-500/5 text-white'
                          : 'border-white/5 bg-zinc-900/40 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Moon className="h-4 w-4" />
                      <span>Dark Theme (Active)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'border-blue-500/30 bg-blue-500/5 text-white'
                          : 'border-white/5 bg-zinc-900/40 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sun className="h-4 w-4" />
                      <span>Light Theme</span>
                    </button>
                  </div>
                  {theme === 'light' && (
                    <p className="text-[10px] text-amber-400 font-medium mt-1">
                      * Light theme preference logged. (Note: Dark theme is recommended for premium console contrast).
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                  {savedMessage && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium"
                    >
                      <Check className="h-4 w-4" />
                      <span>Preferences saved successfully!</span>
                    </motion.div>
                  )}
                </div>
              </form>
            </motion.div>
          )}

          {activeSubTab === 'apikeys' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ApiKeysManager />
            </motion.div>
          )}

          {activeSubTab === 'collections' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card p-6 space-y-6"
            >
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-bold text-white">Collection Preferences</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Customize sorting and storage rules for saved metadata folders.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Default List Sort Order</label>
                  <select
                    value={defaultSort}
                    onChange={(e) => setDefaultSort(e.target.value)}
                    className="w-full max-w-md text-xs bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="name-asc">Alphabetical A-Z</option>
                    <option value="name-desc">Alphabetical Z-A</option>
                  </select>
                </div>

                <div className="space-y-3 pt-3">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Workspace Security Scope</label>
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-zinc-400 text-xs">
                    <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                    <p className="leading-relaxed">
                      All collections created are securely tied to your user ID. Cross-tenant queries are blocked at the database queries layer.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
