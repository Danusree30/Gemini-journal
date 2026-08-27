import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  Pin,
  Archive,
  Trash2,
  Calendar,
  Tag,
  Clock,
  BookOpen,
  Sparkles,
  LayoutGrid,
  List,
  FileDown,
  ArrowUpDown,
  X,
  Plus,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { useTheme } from '../lib/themeContext';

interface JournalHistoryProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onToggleFavorite: (entry: JournalEntry) => void;
  onTogglePin: (entry: JournalEntry) => void;
  onToggleArchive: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const JournalHistory: React.FC<JournalHistoryProps> = ({
  entries,
  onSelectEntry,
  onNewEntry,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  onDeleteEntry,
}) => {
  const { palette } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned' | 'favorites' | 'archived' | 'summaries'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'words'>('newest');

  // Collect all unique tags and mood emojis
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [entries]);

  const allMoods = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.emoji) set.add(e.emoji);
    });
    return Array.from(set);
  }, [entries]);

  // Filter & Search Logic
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Tab Filter
        if (activeFilter === 'pinned' && !entry.pinned) return false;
        if (activeFilter === 'favorites' && !entry.favorite) return false;
        if (activeFilter === 'archived' && !entry.archived) return false;
        if (activeFilter !== 'archived' && entry.archived) return false; // hide archived from general views
        if (activeFilter === 'summaries' && !entry.summary) return false;

        // Tag filter
        if (selectedTag && !entry.tags?.includes(selectedTag)) return false;

        // Mood filter
        if (selectedMood && entry.emoji !== selectedMood) return false;

        // Search Query (matches title, content, tags, summary)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = entry.title?.toLowerCase().includes(q);
          const matchContent = entry.content?.toLowerCase().includes(q);
          const matchTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
          const matchSummary = entry.summary?.toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchTags && !matchSummary) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned entries always on top in default views
        if (activeFilter !== 'archived') {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
        }

        if (sortBy === 'oldest') return a.createdAt - b.createdAt;
        if (sortBy === 'words') return (b.wordCount || 0) - (a.wordCount || 0);
        return b.createdAt - a.createdAt; // newest
      });
  }, [entries, activeFilter, selectedTag, selectedMood, searchQuery, sortBy]);

  // Export single entry to Markdown
  const exportEntryMarkdown = (entry: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const dateStr = new Date(entry.createdAt).toISOString().split('T')[0];
    const mdContent = `# ${entry.emoji || '🌸'} ${entry.title || 'Untitled Journal'}
**Date:** ${new Date(entry.createdAt).toLocaleString()}
**Tags:** ${entry.tags?.join(', ') || 'None'}

---

${entry.content}

${entry.summary ? `\n\n---\n## AI Summary\n\n${entry.summary}` : ''}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal_${dateStr}_${entry.title?.slice(0, 20).replace(/\s+/g, '_') || 'entry'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col min-h-0 overflow-y-auto space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Journal Archive & Search</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-semibold">
              {filteredEntries.length} entries
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Privately browse, search, and reflect over all your previous memories
          </p>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search thoughts, memories, tags, or AI summaries..."
            className="w-full pl-10 pr-10 py-2.5 text-xs rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-800 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
        {/* Main Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveFilter('all');
              setSelectedTag(null);
              setSelectedMood(null);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'all' && !selectedTag && !selectedMood
                ? 'bg-pink-500 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Entries
          </button>

          <button
            onClick={() => setActiveFilter('pinned')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'pinned'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Pinned</span>
          </button>

          <button
            onClick={() => setActiveFilter('favorites')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'favorites'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Favorites</span>
          </button>

          <button
            onClick={() => setActiveFilter('archived')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'archived'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived</span>
          </button>
        </div>

        {/* View Mode & Sort Toggle */}
        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="words">Word Count</option>
          </select>

          {/* Grid vs List toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-pink-100 text-pink-700' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-pink-100 text-pink-700' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Compact List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Tags & Moods Chips Bar */}
      {(allTags.length > 0 || allMoods.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
            <Tag className="w-3 h-3" /> Filter by:
          </span>

          {allMoods.map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
              className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                selectedMood === mood
                  ? 'bg-pink-500 text-white border-pink-500 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-pink-300'
              }`}
            >
              <span>{mood}</span>
            </button>
          ))}

          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-purple-600 text-white border-purple-600 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
              }`}
            >
              #{tag}
            </button>
          ))}

          {(selectedTag || selectedMood) && (
            <button
              onClick={() => {
                setSelectedTag(null);
                setSelectedMood(null);
              }}
              className="text-pink-600 hover:text-pink-800 text-[11px] font-bold underline cursor-pointer ml-2"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Entries List or Grid */}
      {filteredEntries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white/70 rounded-3xl border border-dashed border-slate-200">
          <div className="w-14 h-14 rounded-3xl bg-pink-50 text-pink-500 flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No journal entries found</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            {searchQuery
              ? `No journals matching "${searchQuery}". Try clearing search filters.`
              : 'You have not written in this category yet. Start a new mindful reflection today!'}
          </p>
          <button
            onClick={onNewEntry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-semibold shadow-xs transition-transform hover:scale-105 cursor-pointer"
            style={{ backgroundColor: palette.buttonPrimary }}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Journal Entry</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Scrapbook Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="group p-5 rounded-3xl bg-white border border-pink-100 hover:border-pink-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Meta & Icons */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{entry.emoji || '🌸'}</span>
                    <span className="text-xs font-medium text-slate-500">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Actions: Favorite, Pin, Export */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(entry);
                      }}
                      title={entry.pinned ? 'Unpin' : 'Pin'}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-purple-600 transition-colors ${
                        entry.pinned ? 'text-purple-600 bg-purple-50' : ''
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${entry.pinned ? 'fill-purple-300' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(entry);
                      }}
                      title={entry.favorite ? 'Unfavorite' : 'Favorite'}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors ${
                        entry.favorite ? 'text-amber-500 bg-amber-50' : ''
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${entry.favorite ? 'fill-amber-400' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => exportEntryMarkdown(entry, e)}
                      title="Export Markdown"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-pink-600 transition-colors">
                  {entry.title || 'Untitled Journal Entry'}
                </h3>

                {/* Snippet */}
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                  {entry.content || '(Empty journal entry)'}
                </p>

                {/* Adorned Stickers Preview */}
                {entry.stickers && entry.stickers.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 bg-purple-50/70 border border-purple-100 rounded-2xl p-2 overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-1">
                      {entry.stickers.slice(0, 6).map((stk) => (
                        <span
                          key={stk.id}
                          title={stk.name || 'Sticker'}
                          className="text-lg hover:scale-125 transition-transform"
                        >
                          {stk.emoji}
                        </span>
                      ))}
                      {entry.stickers.length > 6 && (
                        <span className="text-[10px] text-purple-700 font-bold ml-0.5">
                          +{entry.stickers.length - 6}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-purple-700 font-bold ml-auto whitespace-nowrap">
                      {entry.stickers.length} sticker{entry.stickers.length === 1 ? '' : 's'}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Tags & Word Count */}
              <div>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {entry.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{entry.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>{entry.wordCount || 0} words</span>
                  <span className="flex items-center gap-1 text-pink-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Open Entry →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Compact Timeline List View */
        <div className="bg-white rounded-3xl border border-pink-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="p-4 hover:bg-pink-50/40 transition-colors flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{entry.emoji || '🌸'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {entry.title || 'Untitled Entry'}
                    </h3>
                    {entry.pinned && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">
                        Pinned
                      </span>
                    )}
                    {entry.favorite && (
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    )}
                    {entry.stickers && entry.stickers.length > 0 && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-[10px] text-purple-700 font-medium">
                        {entry.stickers.slice(0, 3).map((stk) => stk.emoji).join('')}
                        {entry.stickers.length > 3 ? `+${entry.stickers.length - 3}` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-md">
                    {entry.content}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                <span>
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <button
                  onClick={(e) => exportEntryMarkdown(entry, e)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <FileDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
