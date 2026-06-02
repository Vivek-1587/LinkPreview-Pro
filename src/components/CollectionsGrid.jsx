import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, Calendar, ChevronRight, ArrowLeft, ExternalLink, Bookmark, Plus, Edit2, Trash2, X } from 'lucide-react';
import { motion as framerMotion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';

export default function CollectionsGrid({ items, onUpdate }) {
  const [collections, setCollections] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  
  // Modals / forms state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [editingCol, setEditingCol] = useState(null);

  // Load collections from database
  const loadCollections = async () => {
    try {
      const data = await api.collections.list();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  };

  useEffect(() => {
    loadCollections();
  }, [items]);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    try {
      const newCol = await api.collections.create(newColName.trim(), newColDesc.trim());
      setCollections((prev) => [...prev, newCol]);
      setNewColName('');
      setNewColDesc('');
      setCreateOpen(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to create collection:', err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCol || !newColName.trim()) return;

    try {
      const updated = await api.collections.update(editingCol.id, newColName.trim(), newColDesc.trim());
      setCollections((prev) => prev.map((c) => (c.id === editingCol.id ? updated : c)));
      setNewColName('');
      setNewColDesc('');
      setEditingCol(null);
      setEditOpen(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to update collection:', err);
    }
  };

  const handleDeleteCollection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this collection? Previews in it will not be deleted.')) return;
    try {
      await api.collections.delete(id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      if (selectedFolder && selectedFolder.id === id) {
        setSelectedFolder(null);
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to delete collection:', err);
    }
  };

  const handleRemovePreview = async (collectionId, previewId) => {
    try {
      await api.collections.removePreview(collectionId, previewId);
      if (onUpdate) onUpdate();
      // Reload collections to update previews list
      await loadCollections();
      if (selectedFolder && selectedFolder.id === collectionId) {
        setSelectedFolder((prev) => ({
          ...prev,
          previews: prev.previews.filter((p) => p.id !== previewId),
        }));
      }
    } catch (err) {
      console.error('Failed to remove preview from collection:', err);
    }
  };

  const getLinksCount = (col) => {
    return items.filter((item) => item.collectionId === col.id).length;
  };

  const getLinksForFolder = (col) => {
    return items.filter((item) => item.collectionId === col.id);
  };

  // Color mapping based on ID or index for UI aesthetics
  const getGradientColor = (index) => {
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-purple-600 to-pink-600',
      'from-emerald-600 to-teal-600',
      'from-amber-600 to-orange-600',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AnimatePresence mode="wait">
        {!selectedFolder ? (
          /* GRID VIEW */
          <framerMotion.div
            key="grid"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Resource Collections</h2>
                <p className="text-xs text-zinc-400 mt-1">Organize crawled previews into custom categories, tagging models, and assets.</p>
              </div>
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all cursor-pointer w-full sm:w-auto justify-center"
              >
                <Plus className="h-4 w-4" />
                <span>Create Collection</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {collections.map((folder, index) => {
                const count = getLinksCount(folder);
                const color = getGradientColor(index);
                return (
                  <framerMotion.div
                    key={folder.id}
                    whileHover={{ y: -4 }}
                    className="premium-card p-6 flex flex-col justify-between min-h-[220px] relative group"
                  >
                    {/* Top: Icon, Badges & Actions */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${color} flex items-center justify-center text-white shadow-lg`}>
                          <Folder className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-full">
                            {count} {count === 1 ? 'Link' : 'Links'}
                          </span>
                        </div>
                      </div>

                      {/* Title & Desc */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{folder.name}</h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingCol(folder);
                              setNewColName(folder.name);
                              setNewColDesc(folder.description || '');
                              setEditOpen(true);
                            }}
                            className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                            title="Edit collection"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCollection(folder.id)}
                            className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete collection"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4">{folder.description || 'No description provided.'}</p>
                    </div>

                    {/* Bottom: Action */}
                    <div className="border-t border-white/5 pt-4 mt-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-zinc-500 font-mono">
                          ID: {folder.id.slice(0, 8)}
                        </span>
                        
                        <button
                          onClick={() => setSelectedFolder(folder)}
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition-colors cursor-pointer"
                        >
                          <span>Open</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </framerMotion.div>
                );
              })}
            </div>

            {collections.length === 0 && (
              <div className="py-16 text-center premium-card">
                <Folder className="h-12 w-12 text-zinc-800 mx-auto mb-4 stroke-[1.5]" />
                <h4 className="text-sm font-semibold text-zinc-300 mb-1">No collections yet</h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-5">
                  Create a custom resource collection to keep your scraped URL previews structured and managed.
                </p>
              </div>
            )}
          </framerMotion.div>
        ) : (
          /* FOLDER DETAIL VIEW */
          <framerMotion.div
            key="details"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header / Back */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedFolder(null)}
                className="p-2 rounded-xl border border-white/5 bg-zinc-950 hover:bg-zinc-900 hover:border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedFolder.name}</h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{selectedFolder.description || 'Saved URLs categorized in this segment.'}</p>
              </div>
            </div>

            {/* Links List */}
            <div className="premium-card p-6">
              {getLinksForFolder(selectedFolder).length > 0 ? (
                <div className="space-y-4">
                  {getLinksForFolder(selectedFolder).map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/[0.01] transition-all gap-4"
                    >
                      <div className="flex gap-3.5 items-start">
                        {item.ogImage ? (
                          <img src={item.ogImage} alt={item.title} className="h-10 w-16 object-cover rounded-lg border border-white/5 flex-shrink-0 bg-zinc-900" />
                        ) : (
                          <div className="h-10 w-16 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-center text-zinc-600 flex-shrink-0">
                            <Bookmark className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-white leading-normal line-clamp-1">{item.title}</h4>
                          <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{item.description}</p>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] text-blue-400 hover:underline inline-flex items-center gap-0.5 mt-1"
                          >
                            <span>{item.url}</span>
                            <ExternalLink className="h-2 w-2" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-auto sm:ml-0">
                        <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </span>
                        
                        <button
                          onClick={() => handleRemovePreview(selectedFolder.id, item.id)}
                          className="px-3 py-1.5 rounded-lg border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-white/5 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Visit</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <Folder className="h-12 w-12 text-zinc-800 mx-auto mb-4 stroke-[1.5]" />
                  <h4 className="text-sm font-semibold text-zinc-300 mb-1">No links in this collection yet</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-5">
                    Extract link metadata in the analyzer and click "Save to Collection" to add them here.
                  </p>
                </div>
              )}
            </div>
          </framerMotion.div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL LAYOVER */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <framerMotion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <framerMotion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Create Collection</h3>
                <button onClick={() => setCreateOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Collection Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Work Projects..."
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    placeholder="Brief details about what goes in this collection..."
                    value={newColDesc}
                    onChange={(e) => setNewColDesc(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/40 resize-none"
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
                    Create
                  </button>
                </div>
              </form>
            </framerMotion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL LAYOVER */}
      <AnimatePresence>
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <framerMotion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <framerMotion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Edit Collection</h3>
                <button onClick={() => setEditOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Collection Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Work Projects..."
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    placeholder="Brief details about what goes in this collection..."
                    value={newColDesc}
                    onChange={(e) => setNewColDesc(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/40 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditOpen(false);
                      setEditingCol(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-[0_4px_15px_rgba(59,130,246,0.35)] transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </framerMotion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
