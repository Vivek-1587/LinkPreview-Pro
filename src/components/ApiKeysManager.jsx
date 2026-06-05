// src/components/ApiKeysManager.jsx - Secure API Key management view
import React, { useState, useEffect } from 'react';
import { Key, Plus, Copy, Check, RefreshCw, Trash2, Calendar, ShieldAlert, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';

export default function ApiKeysManager() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  
  // Credentials modal for newly generated keys (shown only once)
  const [rawSecretToken, setRawSecretToken] = useState(null);
  const [rawSecretName, setRawSecretName] = useState('');
  const [copiedRawSecret, setCopiedRawSecret] = useState(false);

  // Confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmRegenId, setConfirmRegenId] = useState(null);

  // Load API keys from database
  const loadKeys = async () => {
    try {
      setLoading(true);
      const data = await api.apiKeys.list();
      setKeys(data);
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const newKey = await api.apiKeys.create(newKeyName.trim());
      // Prepend key to list (it will render with maskedKey in list)
      setKeys((prev) => [newKey, ...prev]);
      setNewKeyName('');
      setCreateOpen(false);
      
      // Expose the raw secret key exactly once
      setRawSecretToken(newKey.key);
      setRawSecretName(newKey.name);
      setCopiedRawSecret(false);
    } catch (err) {
      console.error('Failed to create API key:', err);
    }
  };

  const handleRegenerateKey = async (id) => {
    try {
      const updated = await api.apiKeys.regenerate(id);
      setKeys((prev) => prev.map((k) => (k.id === id ? updated : k)));
      setConfirmRegenId(null);
      
      // Expose the regenerated raw secret key exactly once
      setRawSecretToken(updated.key);
      setRawSecretName(updated.name);
      setCopiedRawSecret(false);
    } catch (err) {
      console.error('Failed to regenerate API key:', err);
    }
  };

  const handleDeleteKey = async (id) => {
    try {
      await api.apiKeys.delete(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to revoke API key:', err);
    }
  };

  const handleCopyRawSecret = () => {
    if (!rawSecretToken) return;
    navigator.clipboard.writeText(rawSecretToken);
    setCopiedRawSecret(true);
    setTimeout(() => setCopiedRawSecret(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* View Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">API Key Management</h2>
          <p className="text-xs text-zinc-400 mt-1">Generate and scope secure credentials tokens to access the metadata crawler engine.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Main Keys List Card */}
      <div className="premium-card p-6">
        <div className="space-y-6">
          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-xs">Loading API credentials...</div>
          ) : keys.length > 0 ? (
            keys.map((key) => {
              const formattedDate = new Date(key.createdAt).toISOString().split('T')[0];
              const lastUsed = key.lastUsedAt ? new Date(key.lastUsedAt).toISOString().split('T')[0] : 'Never';
              
              return (
                <div
                  key={key.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-5 rounded-2xl border border-white/5 bg-black/20 hover:border-white/10 transition-all gap-5"
                >
                  {/* Left: Key details & scope name */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400">
                        <Key className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="text-sm font-bold text-white">{key.name}</h3>
                    </div>

                    {/* Token display block */}
                    <div className="flex items-center gap-2 max-w-md w-full p-2 px-3.5 rounded-xl bg-zinc-950 border border-white/5">
                      <span className="font-mono text-xs text-zinc-400 tracking-wide select-none truncate">
                        {key.maskedKey}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-600 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded ml-auto">
                        READ-ONLY
                      </span>
                    </div>
                  </div>

                  {/* Center: Analytical stats details */}
                  <div className="grid grid-cols-3 gap-6 lg:gap-10 text-xs">
                    <div>
                      <p className="text-zinc-500 mb-1">Requests</p>
                      <p className="font-semibold text-white font-mono">{key.requestCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Created</p>
                      <p className="font-semibold text-white font-mono">{formattedDate}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Last Used</p>
                      <p className="font-semibold text-white font-mono">{lastUsed}</p>
                    </div>
                  </div>

                  {/* Right: Security Settings (Regen & Delete) */}
                  <div className="flex items-center gap-2 justify-end border-t border-white/5 pt-4 lg:border-t-0 lg:pt-0">
                    <button
                      onClick={() => setConfirmRegenId(key.id)}
                      className="p-2 rounded-xl border border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                      title="Regenerate token secret"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(key.id)}
                      className="p-2 rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all cursor-pointer inline-flex items-center justify-center"
                      title="Revoke key credential"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <Key className="h-12 w-12 text-zinc-800 mx-auto mb-4 stroke-[1.5]" />
              <h4 className="text-sm font-semibold text-zinc-300 mb-1">No API keys created yet</h4>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-5">
                Generate an API credential token to begin querying LinkPreview Pro programmatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECURE KEY REVEAL POPUP MODAL (SHOWS EXACTLY ONCE) */}
      <AnimatePresence>
        {rawSecretToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-2xl border border-blue-500/20 bg-zinc-950 p-7 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Save Your API Secret Key</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Description: {rawSecretName}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Please copy this key now. For your security, <strong className="text-white">we will not show it to you again</strong> after you close this window.
                </p>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-white/5 relative overflow-hidden mt-3">
                  <span className="font-mono text-xs text-blue-400 tracking-wide select-all truncate max-w-[340px]">
                    {rawSecretToken}
                  </span>
                  
                  <button
                    onClick={handleCopyRawSecret}
                    className="ml-auto flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedRawSecret ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>COPY KEY</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setRawSecretToken(null)}
                  className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white border border-white/5 transition-colors cursor-pointer"
                >
                  I've Saved It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE DIALOG MODAL LAYOVER */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl z-10"
            >
              <h3 className="text-base font-bold text-white mb-1">Generate API Credential</h3>
              <p className="text-xs text-zinc-400 mb-5">Define a description name to easily filter logs for this key token.</p>

              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Key Description Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Mobile Android SDK client..."
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/40"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-[0_4px_15px_rgba(59,130,246,0.35)] transition-colors cursor-pointer"
                  >
                    Create Key
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM REGENERATE DIALOG MODAL */}
      <AnimatePresence>
        {confirmRegenId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmRegenId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl z-10 text-center">
              <div className="h-11 w-11 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Regenerate Key Secret?</h3>
              <p className="text-xs text-zinc-400 leading-normal mb-5">
                This will instantly invalidate the existing token. Applications using this credential will fail until updated.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmRegenId(null)} className="w-full px-3 py-2 rounded-xl border border-white/5 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer">Cancel</button>
                <button onClick={() => handleRegenerateKey(confirmRegenId)} className="w-full px-3 py-2 rounded-xl bg-amber-600 text-xs font-semibold text-white hover:bg-amber-500 transition-colors cursor-pointer">Confirm Regen</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE DIALOG MODAL */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl z-10 text-center">
              <div className="h-11 w-11 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Revoke Access Credential?</h3>
              <p className="text-xs text-zinc-400 leading-normal mb-5">
                This action is permanent. The scoped access key token will be completely deleted and blocked from our routing engines.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="w-full px-3 py-2 rounded-xl border border-white/5 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer">Cancel</button>
                <button onClick={() => handleDeleteKey(confirmDeleteId)} className="w-full px-3 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-500 transition-colors cursor-pointer">Confirm Revoke</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
