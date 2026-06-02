import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, MoreHorizontal, ExternalLink, Copy, Check, Trash2, Calendar, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryTable({ items, onDelete, onCopyToClipboard }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'domain'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  
  const itemsPerPage = 5;

  // Handles toggle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const copyCurl = (item) => {
    const curlCommand = `curl -X GET "https://api.linkpreviewpro.com/v1/preview?url=${encodeURIComponent(item.url)}" \\
  -H "Authorization: Bearer lp_live_f8a2c4e687b1"`;
    navigator.clipboard.writeText(curlCommand);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and Sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.url.toLowerCase().includes(q) ||
          item.domain.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter);
    }

    // Collection filter
    if (collectionFilter !== 'all') {
      result = result.filter((item) => (item.collection?.name || item.collection) === collectionFilter);
    }

    // Sorting logic
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
      } else if (sortBy === 'domain') {
        comparison = a.domain.localeCompare(b.domain);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [items, searchQuery, statusFilter, collectionFilter, sortBy, sortOrder]);

  // Paginated items
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedItems, currentPage]);

  const uniqueCollections = useMemo(() => {
    const collections = items.map((i) => i.collection?.name || i.collection).filter(Boolean);
    return ['all', ...new Set(collections)];
  }, [items]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* View Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Crawler Activity Log</h2>
          <p className="text-xs text-zinc-400 mt-1">Review, search, and export metadata history extracted across your API tokens.</p>
        </div>
      </div>

      <div className="premium-card p-6">
        {/* Table Filters controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 items-center justify-between">
          
          {/* Search Field */}
          <div className="relative w-full md:max-w-xs flex items-center p-1 border border-white/5 rounded-xl bg-zinc-950/60 focus-within:border-blue-500/40 transition-colors">
            <Search className="h-4 w-4 text-zinc-500 ml-2.5 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search history by URL or Domain..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent text-xs text-white placeholder-zinc-500 p-1.5 focus:outline-none"
            />
          </div>

          {/* Filters Selectors */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 p-1 px-2.5 border border-white/5 rounded-xl bg-zinc-950/60">
              <Filter className="h-3.5 w-3.5 text-zinc-500" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-950 text-zinc-300">All Statuses</option>
                <option value="Success" className="bg-zinc-950 text-zinc-300">Success (200)</option>
                <option value="Error" className="bg-zinc-950 text-zinc-300">Error</option>
              </select>
            </div>

            {/* Collection Filter */}
            <div className="flex items-center gap-1.5 p-1 px-2.5 border border-white/5 rounded-xl bg-zinc-950/60">
              <FileCode className="h-3.5 w-3.5 text-zinc-500" />
              <select
                value={collectionFilter}
                onChange={(e) => {
                  setCollectionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-950 text-zinc-300">All Collections</option>
                {uniqueCollections.filter(c => c !== 'all').map((col) => (
                  <option key={col} value={col} className="bg-zinc-950 text-zinc-300">
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/20">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-zinc-900/40 text-zinc-400 font-semibold uppercase tracking-wider select-none">
                <th className="py-4 px-5">Target URL</th>
                <th className="py-4 px-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('domain')}>
                  <div className="flex items-center gap-1">
                    <span>Domain</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-4 px-5">Preview Status</th>
                <th className="py-4 px-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">
                    <span>Crawled Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-4 px-5">Collection</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-zinc-300"
                  >
                    {/* URL & Title */}
                    <td className="py-4 px-5 max-w-xs">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-white truncate">{item.title}</span>
                        <span className="text-[10px] text-zinc-500 truncate hover:text-blue-400 transition-colors">
                          <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                            {item.url}
                            <ExternalLink className="h-2.5 w-2.5 inline" />
                          </a>
                        </span>
                      </div>
                    </td>

                    {/* Domain */}
                    <td className="py-4 px-5 font-semibold text-zinc-400">
                      {item.domain}
                    </td>

                    {/* Preview Status */}
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.status === 'Success'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'Success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {item.status === 'Success' ? '200 Success' : 'Error'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-5 text-zinc-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                        <span>{new Date(item.createdAt || item.date).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Collection */}
                    <td className="py-4 px-5">
                      {item.collection ? (
                        <span className="inline-flex rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                          {item.collection.name || item.collection}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-600 italic">None</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right space-x-2">
                      <button
                        onClick={() => copyCurl(item)}
                        className="p-1.5 rounded-lg border border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                        title="Copy cURL fetch command"
                      >
                        {copiedId === item.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-lg border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all cursor-pointer inline-flex items-center justify-center"
                        title="Delete from log"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty state inside the table */
                <tr>
                  <td colSpan="6" className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 text-zinc-700 mb-2.5 stroke-[1.5]" />
                      <p className="font-semibold text-zinc-400 text-xs">No records found matching filters</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Try widening your search inputs or resetting dashboard tags.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Details */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5 text-xs">
            <span className="text-zinc-500">
              Showing page <strong className="text-zinc-300">{currentPage}</strong> of <strong className="text-zinc-300">{totalPages}</strong>
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1.5 rounded-lg border border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1.5 rounded-lg border border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
