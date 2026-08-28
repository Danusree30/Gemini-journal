import React, { useState, useEffect, useMemo } from 'react';
import {
  Smile,
  Sparkles,
  Search,
  Plus,
  Star,
  Check,
  Heart,
  Tag,
  Trash2,
  BookOpen,
  FolderPlus,
  Folder,
  Layers,
  X,
  Share2,
  Info,
  Palette,
  Filter,
} from 'lucide-react';
import { STICKER_COLLECTION, STICKER_CATEGORIES } from '../data/stickers';
import { StickerItem, JournalEntry } from '../types';
import { useTheme } from '../lib/themeContext';
import { useAuth } from '../lib/authContext';
import {
  saveCustomSticker,
  deleteCustomSticker,
  subscribeToCustomStickers,
  toggleFavoriteSticker,
  saveStickerCollections,
} from '../lib/storage';

interface StickerStudioProps {
  entries: JournalEntry[];
  onUseStickerOnJournal?: (sticker: StickerItem) => void;
}

const PRESET_EMOJIS = [
  '🌸', '🌻', '🌷', '🌹', '💐', '🌼', '🌿', '🌱',
  '☕', '🍵', '🧋', '🍰', '🍪', '🍫', '🍩', '🧁',
  '📚', '📖', '✏️', '🎯', '💡', '📝', '🎓', '💻',
  '⭐', '🌙', '✨', '🌌', '🔮', '🪄', '💫', '💎',
  '🐻', '🐰', '🐱', '🐶', '🎀', '💖', '🍀', '🔥',
];

const PRESET_COLORS = [
  { name: 'Pastel Pink', bg: 'bg-pink-100 text-pink-800 border-pink-200', hex: '#fdf2f8' },
  { name: 'Warm Amber', bg: 'bg-amber-100 text-amber-900 border-amber-200', hex: '#fef3c7' },
  { name: 'Matcha Green', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', hex: '#ecfdf5' },
  { name: 'Pastel Blue', bg: 'bg-sky-100 text-sky-800 border-sky-200', hex: '#f0f9ff' },
  { name: 'Lavender', bg: 'bg-purple-100 text-purple-800 border-purple-200', hex: '#faf5ff' },
  { name: 'Rose Coral', bg: 'bg-rose-100 text-rose-800 border-rose-200', hex: '#ffe4e6' },
];

export const StickerStudio: React.FC<StickerStudioProps> = ({
  entries,
  onUseStickerOnJournal,
}) => {
  const { palette, settings, updateSettings } = useTheme();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customStickers, setCustomStickers] = useState<StickerItem[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<StickerItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Sticker Modal Form State
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🌸');
  const [customCategory, setCustomCategory] = useState('cute');
  const [customColor, setCustomColor] = useState(PRESET_COLORS[0].bg);
  const [customDescription, setCustomDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collections State
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Favorites list from user settings or local fallback
  const favoriteIds = useMemo(
    () => settings.favoriteStickerIds || [],
    [settings.favoriteStickerIds]
  );

  const customCollections = useMemo(
    () => settings.customCollections || {},
    [settings.customCollections]
  );

  // Subscribe to real-time custom stickers from Firestore
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToCustomStickers(user.uid, (stickers) => {
      setCustomStickers(stickers);
    });
    return () => unsubscribe();
  }, [user]);

  // Combined master sticker catalog
  const allStickers = useMemo(() => {
    return [...STICKER_COLLECTION, ...customStickers];
  }, [customStickers]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allStickers.length,
      favorites: allStickers.filter((s) => favoriteIds.includes(s.id)).length,
      custom: customStickers.length,
    };

    STICKER_CATEGORIES.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = allStickers.filter((s) => s.category === cat.id).length;
      }
    });

    return counts;
  }, [allStickers, customStickers, favoriteIds]);

  // Filtered Stickers based on category, search, favorites, collections
  const filteredStickers = useMemo(() => {
    return allStickers.filter((sticker) => {
      // Collection Filter
      if (selectedCollection) {
        const idsInCollection = customCollections[selectedCollection] || [];
        if (!idsInCollection.includes(sticker.id)) return false;
      }

      // Special Filter Categories
      if (selectedCategory === 'favorites') {
        if (!favoriteIds.includes(sticker.id)) return false;
      } else if (selectedCategory === 'custom') {
        if (!sticker.isCustom) return false;
      } else if (selectedCategory !== 'all') {
        if (sticker.category !== selectedCategory) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = sticker.name.toLowerCase().includes(q);
        const matchesCategory = sticker.category.toLowerCase().includes(q);
        const matchesEmoji = sticker.emoji.includes(q);
        const matchesDesc = (sticker.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesEmoji && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [allStickers, selectedCategory, searchQuery, favoriteIds, selectedCollection, customCollections]);

  // Toast trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Favorite
  const handleToggleFavorite = async (sticker: StickerItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;

    try {
      const updated = await toggleFavoriteSticker(user.uid, sticker.id, favoriteIds);
      updateSettings({ favoriteStickerIds: updated });
      showToast(
        updated.includes(sticker.id)
          ? `Added "${sticker.name}" to favorites`
          : `Removed "${sticker.name}" from favorites`
      );
    } catch (err) {
      console.error('[Error toggling sticker favorite]:', err);
    }
  };

  // Add Custom Sticker
  const handleCreateCustomSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setFormError('Please enter a sticker name.');
      return;
    }
    if (!user) {
      setFormError('You must be signed in to create custom stickers.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const newSticker: StickerItem = {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        emoji: customEmoji.trim() || '✨',
        category: customCategory,
        color: customColor,
        description: customDescription.trim() || undefined,
        isCustom: true,
        userId: user.uid,
        createdAt: Date.now(),
      };

      await saveCustomSticker(user.uid, newSticker);

      // Optimistic update
      setCustomStickers((prev) => [newSticker, ...prev]);

      // Reset form
      setCustomName('');
      setCustomDescription('');
      setCustomEmoji('🌸');
      setShowAddCustomModal(false);
      showToast(`Created custom sticker "${newSticker.name}"!`);
    } catch (err: any) {
      console.error('[Create Sticker Error]:', err);
      setFormError(err.message || 'Failed to save custom sticker. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Custom Sticker
  const handleDeleteCustomSticker = async (sticker: StickerItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user || !sticker.isCustom) return;

    if (window.confirm(`Delete "${sticker.name}" from your custom stickers?`)) {
      try {
        await deleteCustomSticker(user.uid, sticker.id);
        setCustomStickers((prev) => prev.filter((s) => s.id !== sticker.id));
        if (selectedSticker?.id === sticker.id) {
          setSelectedSticker(null);
        }
        showToast(`Deleted "${sticker.name}"`);
      } catch (err) {
        console.error('[Delete Sticker Error]:', err);
      }
    }
  };

  // Add/Remove sticker to collection
  const handleToggleCollectionSticker = async (collectionName: string, stickerId: string) => {
    if (!user) return;
    const currentList = customCollections[collectionName] || [];
    const updatedList = currentList.includes(stickerId)
      ? currentList.filter((id) => id !== stickerId)
      : [...currentList, stickerId];

    const newCollections = {
      ...customCollections,
      [collectionName]: updatedList,
    };

    updateSettings({ customCollections: newCollections });
    await saveStickerCollections(user.uid, newCollections);
    showToast(
      updatedList.includes(stickerId)
        ? `Added to collection "${collectionName}"`
        : `Removed from "${collectionName}"`
    );
  };

  // Create new collection
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || !user) return;
    const name = newCollectionName.trim();
    if (customCollections[name]) {
      alert('A collection with this name already exists.');
      return;
    }

    const newCollections = {
      ...customCollections,
      [name]: selectedSticker ? [selectedSticker.id] : [],
    };

    updateSettings({ customCollections: newCollections });
    await saveStickerCollections(user.uid, newCollections);
    setNewCollectionName('');
    setShowNewCollectionModal(false);
    showToast(`Created collection "${name}"`);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col min-h-0 overflow-y-auto space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Action Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/60 backdrop-blur-xs p-6 rounded-3xl border border-pink-100/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl text-white shadow-xs"
              style={{ backgroundColor: palette.accent }}
            >
              🌸
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Sticker & Scrapbook Studio
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Curate, create, and adorn your digital journals with mindful aesthetic stickers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              setFormError(null);
              setShowAddCustomModal(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-white text-xs font-bold shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            style={{ backgroundColor: palette.buttonPrimary }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Sticker</span>
          </button>
        </div>
      </div>

      {/* Categories & Search Navigation Bar */}
      <div className="flex flex-col gap-3 pb-2">
        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs font-semibold">
          {/* All Stickers */}
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedCollection(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all' && !selectedCollection
                ? 'bg-slate-900 text-white shadow-xs scale-102'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>✨</span>
            <span>All Stickers</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full font-bold">
              {categoryCounts.all}
            </span>
          </button>

          {/* Favorites */}
          <button
            onClick={() => {
              setSelectedCategory('favorites');
              setSelectedCollection(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'favorites' && !selectedCollection
                ? 'bg-amber-500 text-white shadow-xs scale-102'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Favorites</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-bold">
              {categoryCounts.favorites}
            </span>
          </button>

          {/* Built-in Categories */}
          {STICKER_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
            const isActive = selectedCategory === cat.id && !selectedCollection;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedCollection(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-pink-500 text-white shadow-xs scale-102'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-pink-400 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {categoryCounts[cat.id] || 0}
                </span>
              </button>
            );
          })}

          {/* Custom Stickers Filter */}
          <button
            onClick={() => {
              setSelectedCategory('custom');
              setSelectedCollection(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'custom' && !selectedCollection
                ? 'bg-purple-600 text-white shadow-xs scale-102'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>🎨</span>
            <span>Custom Stickers</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full font-bold">
              {categoryCounts.custom}
            </span>
          </button>
        </div>

        {/* Search & Collection Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="sticker-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stickers (e.g. coffee, flower, books, star)..."
              className="w-full pl-10 pr-9 py-2 text-xs rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-800 placeholder-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Collections Quick Filter */}
          {Object.keys(customCollections).length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Folder className="w-3 h-3" />
                Collections:
              </span>
              {Object.keys(customCollections).map((colName) => (
                <button
                  key={colName}
                  onClick={() => {
                    setSelectedCollection(selectedCollection === colName ? null : colName);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCollection === colName
                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📁 {colName} ({customCollections[colName]?.length || 0})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid & Selected Sticker Action Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stickers Grid View (3 Cols on desktop) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Active Filter Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-700">
              Showing {filteredStickers.length} sticker{filteredStickers.length === 1 ? '' : 's'}
              {searchQuery && <span> matching &ldquo;{searchQuery}&rdquo;</span>}
              {selectedCollection && <span> in collection &ldquo;{selectedCollection}&rdquo;</span>}
            </span>
            <span className="text-[11px] text-slate-400">Click any sticker to preview & use</span>
          </div>

          {filteredStickers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 text-2xl flex items-center justify-center">
                🔍
              </div>
              <h3 className="text-sm font-bold text-slate-800">No stickers found</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Try searching for different keywords or select &quot;All Stickers&quot; to explore the full
                collection.
              </p>
              <div className="flex gap-2 mt-2">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedCollection(null);
                    setSearchQuery('');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold cursor-pointer"
                >
                  View All Stickers
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {filteredStickers.map((sticker) => {
                const isFav = favoriteIds.includes(sticker.id);
                const isSelected = selectedSticker?.id === sticker.id;

                return (
                  <div
                    key={sticker.id}
                    onClick={() => setSelectedSticker(sticker)}
                    className={`group relative p-4 rounded-3xl bg-white transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer select-none ${
                      isSelected
                        ? 'ring-2 ring-pink-500 shadow-md scale-102 bg-pink-50/20'
                        : 'border border-slate-100 hover:border-pink-200 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Favorite Button on Card */}
                    <button
                      onClick={(e) => handleToggleFavorite(sticker, e)}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      className={`absolute top-2.5 right-2.5 p-1.5 rounded-full transition-all cursor-pointer ${
                        isFav
                          ? 'text-amber-400 bg-amber-50 hover:bg-amber-100'
                          : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Custom Badge */}
                    {sticker.isCustom && (
                      <span className="absolute top-2.5 left-2.5 px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 text-[9px] font-bold">
                        Custom
                      </span>
                    )}

                    {/* Sticker Visual Emoji */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 group-hover:scale-115 transition-transform duration-200">
                      <span className="text-3xl sm:text-4xl drop-shadow-xs">{sticker.emoji}</span>
                    </div>

                    {/* Name & Category */}
                    <span className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-pink-600 transition-colors">
                      {sticker.name}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize mt-0.5">
                      {sticker.category}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Sticker Detail & Action Panel (Right side) */}
        <div className="lg:col-span-1">
          {selectedSticker ? (
            <div className="sticky top-6 p-5 rounded-3xl bg-white border border-pink-100 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">
                  Selected Sticker
                </span>
                <button
                  onClick={() => setSelectedSticker(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Big Preview */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-pink-50/50 to-purple-50/30 border border-pink-100/50 flex flex-col items-center justify-center text-center">
                <span className="text-6xl mb-3 animate-bounce">{selectedSticker.emoji}</span>
                <h3 className="text-sm font-extrabold text-slate-900">{selectedSticker.name}</h3>
                <span className="text-xs text-slate-500 capitalize mt-0.5">
                  {selectedSticker.category} Category
                </span>
                {selectedSticker.description && (
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed italic">
                    &ldquo;{selectedSticker.description}&rdquo;
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* Use on Active Journal */}
                {onUseStickerOnJournal && (
                  <button
                    onClick={() => {
                      onUseStickerOnJournal(selectedSticker);
                      showToast(`Placed "${selectedSticker.name}" on your journal!`);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-xs active:scale-98 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Use on Active Journal</span>
                  </button>
                )}

                {/* Favorite Button */}
                <button
                  onClick={() => handleToggleFavorite(selectedSticker)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer ${
                    favoriteIds.includes(selectedSticker.id)
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      favoriteIds.includes(selectedSticker.id) ? 'fill-amber-400 text-amber-500' : ''
                    }`}
                  />
                  <span>
                    {favoriteIds.includes(selectedSticker.id) ? 'Favorited' : 'Add to Favorites'}
                  </span>
                </button>

                {/* Add to Collection Dropdown */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                    <span>Organize Collections:</span>
                    <button
                      onClick={() => setShowNewCollectionModal(true)}
                      className="text-pink-600 hover:text-pink-700 text-[10px] flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>

                  {Object.keys(customCollections).length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      No custom collections yet. Click &quot;+ New&quot; to create one!
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(customCollections).map((colName) => {
                        const inCollection = customCollections[colName]?.includes(
                          selectedSticker.id
                        );
                        return (
                          <button
                            key={colName}
                            onClick={() =>
                              handleToggleCollectionSticker(colName, selectedSticker.id)
                            }
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors cursor-pointer ${
                              inCollection
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {inCollection ? '✓ ' : '+ '}
                            {colName}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* If Custom Sticker -> Allow Delete */}
                {selectedSticker.isCustom && (
                  <button
                    onClick={() => handleDeleteCustomSticker(selectedSticker)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors mt-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Custom Sticker</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs text-center flex flex-col items-center justify-center space-y-2 text-slate-400">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xl">
                ✨
              </div>
              <p className="text-xs font-bold text-slate-600">Select a sticker</p>
              <p className="text-[11px] text-slate-400 max-w-[180px]">
                Click any sticker to view details, add to favorites, or place onto your active journal.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Custom Sticker Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-pink-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-lg">
                  ✨
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Create Custom Sticker</h3>
              </div>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCustomSticker} className="space-y-4">
              {/* Sticker Preview & Emoji Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Choose Icon / Emoji
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                    {customEmoji || '🌸'}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      placeholder="Type or paste emoji"
                      maxLength={4}
                      className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                    />
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                      {PRESET_EMOJIS.slice(0, 16).map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setCustomEmoji(em)}
                          className="text-base p-1 hover:scale-125 transition-transform cursor-pointer"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticker Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sticker Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="custom-sticker-name"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Cozy Blanket, Matcha Boba, Midnight Study"
                  required
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-800"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-800 capitalize"
                >
                  <option value="cute">🌸 Cute & Cozy</option>
                  <option value="mindful">🌙 Mindfulness</option>
                  <option value="treats">🍰 Sweet Treats</option>
                  <option value="study">📚 Study & Goals</option>
                  <option value="nature">🌱 Nature & Bloom</option>
                  <option value="cosmic">💫 Cosmic & Magic</option>
                </select>
              </div>

              {/* Optional Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Description
                </label>
                <input
                  id="custom-sticker-desc"
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="e.g. For cozy winter evenings and reflections"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Collection Modal */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-pink-100 space-y-4 animate-in zoom-in-95">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-purple-600" />
              <span>Create Sticker Collection</span>
            </h3>
            <form onSubmit={handleCreateCollection} className="space-y-3">
              <input
                id="new-collection-name"
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection Name (e.g. Study Vibes, Matcha)"
                required
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCollectionModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-xs hover:bg-purple-700 cursor-pointer"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
