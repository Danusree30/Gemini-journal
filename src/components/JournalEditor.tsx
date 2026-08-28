import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Star,
  Pin,
  Archive,
  Trash2,
  Smile,
  BookOpen,
  Tag,
  Clock,
  Check,
  Calendar,
  Layers,
  Maximize2,
  Minimize2,
  Share2,
  Download,
  X,
  Plus,
  Search,
  RotateCw,
  RotateCcw,
  Move,
  Palette,
} from 'lucide-react';
import { JournalEntry, StickerPlacement, TemplateItem, SyncStatus, StickerItem } from '../types';
import { useTheme } from '../lib/themeContext';
import { useAuth } from '../lib/authContext';
import { saveJournal, deleteJournal, subscribeToCustomStickers } from '../lib/storage';
import { AiAssistantPanel } from './AiAssistantPanel';
import { EmojiPickerPopover } from './EmojiPickerPopover';
import { TemplatePickerModal } from './TemplatePickerModal';
import { STICKER_COLLECTION, STICKER_CATEGORIES } from '../data/stickers';

interface JournalEditorProps {
  activeEntry: JournalEntry;
  onEntryChange: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  syncStatus: SyncStatus;
}

const SCRAPBOOK_PAPERS = [
  { id: 'default', name: 'Classic Pure', bg: 'bg-white' },
  { id: 'cream', name: 'Warm Cream', bg: 'bg-[#faf7f2]' },
  { id: 'sakura', name: 'Pastel Sakura', bg: 'bg-[#fdf2f8]' },
  { id: 'matcha', name: 'Matcha Mist', bg: 'bg-[#f0fdf4]' },
  { id: 'lavender', name: 'Lavender Haze', bg: 'bg-[#faf5ff]' },
  { id: 'sky', name: 'Pastel Sky', bg: 'bg-[#f0f9ff]' },
  { id: 'grid', name: 'Vintage Grid', bg: 'bg-[#fafaf9]' },
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  activeEntry,
  onEntryChange,
  onDeleteEntry,
  syncStatus,
}) => {
  const { palette, settings, updateSettings } = useTheme();
  const { user } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);
  const [stickerDrawerCategory, setStickerDrawerCategory] = useState('all');
  const [stickerDrawerSearch, setStickerDrawerSearch] = useState('');
  const [customStickers, setCustomStickers] = useState<StickerItem[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  // Scrapbook Mode State
  const [scrapbookMode, setScrapbookMode] = useState(false);
  const [scrapbookPaper, setScrapbookPaper] = useState('default');
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to user custom stickers
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToCustomStickers(user.uid, (stickers) => {
      setCustomStickers(stickers);
    });
    return () => unsubscribe();
  }, [user]);

  // Combined master sticker collection
  const allStickers = useMemo(() => {
    return [...STICKER_COLLECTION, ...customStickers];
  }, [customStickers]);

  // Helper to resolve complete sticker info with fallbacks
  const resolveSticker = (stk: StickerPlacement) => {
    const found = allStickers.find((s) => s.id === stk.stickerId || s.name === stk.name);
    return {
      id: stk.id,
      stickerId: stk.stickerId,
      name: stk.name || found?.name || 'Sticker',
      emoji: stk.emoji || found?.emoji || '🌸',
      rotation: stk.rotation ?? 0,
      color: found?.color || 'bg-pink-100 text-pink-800 border-pink-200',
    };
  };

  const favoriteIds = useMemo(
    () => settings.favoriteStickerIds || [],
    [settings.favoriteStickerIds]
  );

  // Filtered sticker drawer items
  const drawerStickers = useMemo(() => {
    return allStickers.filter((sticker) => {
      if (stickerDrawerCategory === 'favorites') {
        if (!favoriteIds.includes(sticker.id)) return false;
      } else if (stickerDrawerCategory === 'custom') {
        if (!sticker.isCustom) return false;
      } else if (stickerDrawerCategory !== 'all') {
        if (sticker.category !== stickerDrawerCategory) return false;
      }

      if (stickerDrawerSearch.trim()) {
        const q = stickerDrawerSearch.toLowerCase().trim();
        const matchesName = sticker.name.toLowerCase().includes(q);
        const matchesCat = sticker.category.toLowerCase().includes(q);
        const matchesEmoji = sticker.emoji.includes(q);
        const matchesDesc = (sticker.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesEmoji && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [allStickers, stickerDrawerCategory, stickerDrawerSearch, favoriteIds]);

  // Calculate word count and estimated reading time
  const wordCount = activeEntry.content
    ? activeEntry.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Debounced Auto-Save
  useEffect(() => {
    if (!user || !activeEntry.id) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveJournal(user.uid, {
          ...activeEntry,
          wordCount,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.error('[Autosave Error]:', err);
      } finally {
        setIsSaving(false);
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    activeEntry.title,
    activeEntry.content,
    activeEntry.emoji,
    activeEntry.tags,
    activeEntry.favorite,
    activeEntry.pinned,
    activeEntry.archived,
    activeEntry.category,
    activeEntry.stickers,
    user,
  ]);

  const updateField = <K extends keyof JournalEntry>(key: K, value: JournalEntry[K]) => {
    onEntryChange({
      ...activeEntry,
      [key]: value,
    });
  };



  // Auto-straighten any stickers that have legacy or crooked angles
  useEffect(() => {
    if (activeEntry.stickers && activeEntry.stickers.length > 0) {
      const hasCrookedStickers = activeEntry.stickers.some(
        (s) => typeof s.rotation === 'number' && s.rotation !== 0 && s.rotation % 90 !== 0
      );
      if (hasCrookedStickers) {
        updateField(
          'stickers',
          activeEntry.stickers.map((s) => ({
            ...s,
            rotation: 0,
          }))
        );
      }
    }
  }, [activeEntry.stickers]);

  // Add a tag
  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const tag = newTagInput.trim().replace(/^#/, '');
    if (tag && !activeEntry.tags.includes(tag)) {
      updateField('tags', [...activeEntry.tags, tag]);
      setNewTagInput('');
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    updateField(
      'tags',
      activeEntry.tags.filter((t) => t !== tagToRemove)
    );
  };

  // Add decorative sticker to journal in upright straight position (0deg)
  const handleAddSticker = (stickerItem: StickerItem) => {
    const newSticker: StickerPlacement = {
      id: `stk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      stickerId: stickerItem.id,
      name: stickerItem.name,
      emoji: stickerItem.emoji,
      x: 20 + Math.random() * 50,
      y: 20 + Math.random() * 50,
      rotation: 0,
    };
    const current = activeEntry.stickers || [];
    updateField('stickers', [...current, newSticker]);
  };

  // Remove sticker
  const handleRemoveSticker = (stickerPlacementId: string) => {
    const current = activeEntry.stickers || [];
    updateField(
      'stickers',
      current.filter((s) => s.id !== stickerPlacementId)
    );
    if (selectedPlacementId === stickerPlacementId) {
      setSelectedPlacementId(null);
    }
  };

  // Rotate sticker in clean 90-degree cardinal steps (0° -> 90° -> 180° -> 270° -> 0°)
  const handleRotateSticker = (stickerPlacementId: string) => {
    const current = activeEntry.stickers || [];
    updateField(
      'stickers',
      current.map((s) => {
        if (s.id === stickerPlacementId) {
          const currentRot = s.rotation || 0;
          const nextRot = (Math.round(currentRot / 90) * 90 + 90) % 360;
          return { ...s, rotation: nextRot };
        }
        return s;
      })
    );
  };

  // Straighten single sticker directly to 0 degrees
  const handleStraightenSticker = (stickerPlacementId: string) => {
    const current = activeEntry.stickers || [];
    updateField(
      'stickers',
      current.map((s) => (s.id === stickerPlacementId ? { ...s, rotation: 0 } : s))
    );
  };

  // Straighten all stickers on active journal entry to 0 degrees
  const handleStraightenAllStickers = () => {
    const current = activeEntry.stickers || [];
    updateField(
      'stickers',
      current.map((s) => ({ ...s, rotation: 0 }))
    );
  };

  // Pointer Drag handling for stickers on the canvas
  const handleStickerPointerDown = (placementId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedPlacementId(placementId);
    setDraggingId(placementId);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const xPercent = Math.min(92, Math.max(5, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.min(90, Math.max(8, ((moveEvent.clientY - rect.top) / rect.height) * 100));

      const current = activeEntry.stickers || [];
      updateField(
        'stickers',
        current.map((s) => (s.id === placementId ? { ...s, x: Math.round(xPercent * 10) / 10, y: Math.round(yPercent * 10) / 10 } : s))
      );
    };

    const handlePointerUp = () => {
      setDraggingId(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Template selected
  const handleSelectTemplate = (template: TemplateItem, createNew: boolean) => {
    if (createNew) {
      const newEntry: JournalEntry = {
        id: `entry_${Date.now()}`,
        title: template.title,
        content: template.initialContent,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        favorite: false,
        pinned: false,
        archived: false,
        tags: template.defaultTags,
        emoji: template.emoji,
        category: template.category,
        stickers: [],
      };
      onEntryChange(newEntry);
    } else {
      updateField('title', activeEntry.title || template.title);
      updateField('content', `${activeEntry.content}\n\n${template.initialContent}`.trim());
      updateField('emoji', template.emoji);
      updateField('tags', Array.from(new Set([...activeEntry.tags, ...template.defaultTags])));
    }
  };



  // Active paper class
  const activePaperClass = useMemo(() => {
    const found = SCRAPBOOK_PAPERS.find((p) => p.id === scrapbookPaper);
    return found ? found.bg : 'bg-white';
  }, [scrapbookPaper]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 sm:p-6 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
      {/* Main Journal Canvas (Left/Center) */}
      <div
        className={`flex-1 flex flex-col rounded-3xl border border-pink-100 shadow-sm overflow-hidden relative transition-colors duration-300 ${activePaperClass}`}
      >
        {/* Background Pattern Style */}
        {settings.backgroundPattern === 'dots' && (
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60" />
        )}
        {settings.backgroundPattern === 'grid' && (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />
        )}
        {settings.backgroundPattern === 'lines' && (
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:100%_28px] pointer-events-none opacity-70" />
        )}

        {/* Top Action Bar */}
        <div className="p-4 border-b border-slate-100/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 backdrop-blur-xs relative z-20">
          {/* Mood Emoji Popover & Title Meta */}
          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Change Mood Emoji"
              className="w-10 h-10 rounded-2xl bg-pink-100/70 hover:bg-pink-200/80 text-2xl flex items-center justify-center transition-transform hover:scale-105 border border-pink-200 cursor-pointer"
            >
              {activeEntry.emoji || '🌸'}
            </button>

            {showEmojiPicker && (
              <EmojiPickerPopover
                onSelectEmoji={(emoji) => updateField('emoji', emoji)}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {new Date(activeEntry.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>•</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {new Date(activeEntry.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Icons: Templates, Scrapbook, Stickers Drawer, Favorite, Pin, AI */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Template Selector */}
            <button
              onClick={() => setShowTemplateModal(true)}
              title="Choose Mindful Template"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-pink-700 hover:bg-pink-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-pink-500" />
              <span className="hidden sm:inline">Templates</span>
            </button>

            {/* Scrapbook Mode Toggle */}
            <button
              onClick={() => setScrapbookMode(!scrapbookMode)}
              title="Toggle Scrapbook Decorator Mode"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                scrapbookMode
                  ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                  : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Scrapbook</span>
            </button>

            {/* Sticker Drawer Toggle */}
            <button
              onClick={() => setShowStickerDrawer(!showStickerDrawer)}
              title="Open Sticker & Scrapbook Library"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                showStickerDrawer
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white border-purple-200 text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stickers</span>
              {activeEntry.stickers && activeEntry.stickers.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-bold ml-0.5">
                  {activeEntry.stickers.length}
                </span>
              )}
            </button>

            {/* Favorite Button */}
            <button
              onClick={() => updateField('favorite', !activeEntry.favorite)}
              title={activeEntry.favorite ? 'Favorited' : 'Add to Favorites'}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                activeEntry.favorite
                  ? 'bg-amber-50 text-amber-500 border-amber-200'
                  : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500'
              }`}
            >
              <Star className={`w-4 h-4 ${activeEntry.favorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Pin Button */}
            <button
              onClick={() => updateField('pinned', !activeEntry.pinned)}
              title={activeEntry.pinned ? 'Pinned to top' : 'Pin to top'}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                activeEntry.pinned
                  ? 'bg-purple-50 text-purple-600 border-purple-200'
                  : 'bg-white text-slate-400 border-slate-200 hover:text-purple-600'
              }`}
            >
              <Pin className={`w-4 h-4 ${activeEntry.pinned ? 'fill-purple-300' : ''}`} />
            </button>

            {/* Archive Button */}
            <button
              onClick={() => updateField('archived', !activeEntry.archived)}
              title={activeEntry.archived ? 'Archived' : 'Archive entry'}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                activeEntry.archived
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'
              }`}
            >
              <Archive className="w-4 h-4" />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this journal entry?')) {
                  onDeleteEntry(activeEntry.id);
                }
              }}
              title="Delete Entry"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* AI Assistant Toggle */}
            <button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              title={aiPanelOpen ? 'Hide AI Assistant' : 'Show AI Assistant'}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                aiPanelOpen
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gemini</span>
            </button>
          </div>
        </div>

        {/* Scrapbook Paper Palette Bar (if Scrapbook mode open) */}
        {scrapbookMode && (
          <div className="p-3 bg-amber-50/90 border-b border-amber-200/80 flex items-center gap-3 overflow-x-auto relative z-20 animate-in slide-in-from-top-1 text-xs">
            <span className="font-bold text-amber-900 shrink-0 flex items-center gap-1">
              🎨 Scrapbook Paper:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {SCRAPBOOK_PAPERS.map((paper) => (
                <button
                  key={paper.id}
                  onClick={() => setScrapbookPaper(paper.id)}
                  className={`px-3 py-1 rounded-xl font-medium border transition-all cursor-pointer ${
                    scrapbookPaper === paper.id
                      ? 'bg-amber-900 text-white border-amber-900 shadow-xs scale-105'
                      : 'bg-white/80 border-amber-200 text-amber-900 hover:bg-white'
                  }`}
                >
                  {paper.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setScrapbookMode(false)}
              className="ml-auto text-amber-700 hover:text-amber-900 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Full Sticker Drawer with Category Filtering & Search */}
        {showStickerDrawer && (
          <div className="p-4 bg-purple-50/90 border-b border-purple-200 flex flex-col gap-3 relative z-20 animate-in slide-in-from-top-2">
            {/* Drawer Controls & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Category selector */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
                <button
                  onClick={() => setStickerDrawerCategory('all')}
                  className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                    stickerDrawerCategory === 'all'
                      ? 'bg-purple-700 text-white'
                      : 'bg-white border border-purple-200 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  All ({allStickers.length})
                </button>
                <button
                  onClick={() => setStickerDrawerCategory('favorites')}
                  className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                    stickerDrawerCategory === 'favorites'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white border border-purple-200 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  ⭐ Favs ({favoriteIds.length})
                </button>
                {STICKER_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setStickerDrawerCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                      stickerDrawerCategory === cat.id
                        ? 'bg-purple-700 text-white'
                        : 'bg-white border border-purple-200 text-purple-800 hover:bg-purple-100'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
                {customStickers.length > 0 && (
                  <button
                    onClick={() => setStickerDrawerCategory('custom')}
                    className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                      stickerDrawerCategory === 'custom'
                        ? 'bg-purple-700 text-white'
                        : 'bg-white border border-purple-200 text-purple-800 hover:bg-purple-100'
                    }`}
                  >
                    🎨 Custom ({customStickers.length})
                  </button>
                )}
              </div>

              {/* Search & Close */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stickerDrawerSearch}
                    onChange={(e) => setStickerDrawerSearch(e.target.value)}
                    placeholder="Search stickers..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-xl bg-white border border-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-400 text-slate-800"
                  />
                </div>
                <button
                  onClick={() => setShowStickerDrawer(false)}
                  className="p-1 text-purple-400 hover:text-purple-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sticker Items Grid in Drawer */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              {drawerStickers.length === 0 ? (
                <div className="text-xs text-purple-700 py-2">
                  No stickers match your filter.
                </div>
              ) : (
                drawerStickers.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddSticker(item)}
                    title={`Click to place "${item.name}" on journal`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-purple-200 hover:border-purple-400 text-xs font-semibold text-slate-800 shadow-2xs hover:scale-108 active:scale-95 transition-transform cursor-pointer shrink-0"
                  >
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-[11px] whitespace-nowrap">{item.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Journal Writing Area & Floating Sticker Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 flex flex-col p-6 overflow-y-auto relative z-10 min-h-[420px]"
          onClick={() => setSelectedPlacementId(null)}
        >
          {/* Canvas Floating Stickers Layer */}
          {activeEntry.stickers && activeEntry.stickers.length > 0 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {activeEntry.stickers.map((stk) => {
                const isSelected = selectedPlacementId === stk.id;
                const isDragging = draggingId === stk.id;
                return (
                  <div
                    key={stk.id}
                    onPointerDown={(e) => handleStickerPointerDown(stk.id, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlacementId(stk.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (stk.rotation && stk.rotation !== 0) {
                        handleStraightenSticker(stk.id);
                      } else {
                        handleRotateSticker(stk.id);
                      }
                    }}
                    title={`${stk.name || 'Sticker'} (Double-click to straighten/rotate, drag to move)`}
                    style={{
                      left: `${stk.x ?? 50}%`,
                      top: `${stk.y ?? 40}%`,
                      transform: `translate(-50%, -50%) rotate(${stk.rotation ?? 0}deg) ${
                        isDragging ? 'scale(1.18)' : isSelected ? 'scale(1.08)' : 'scale(1)'
                      }`,
                    }}
                    className={`absolute pointer-events-auto select-none touch-none transition-transform duration-75 cursor-grab active:cursor-grabbing group p-1.5 rounded-2xl ${
                      isSelected
                        ? 'ring-2 ring-purple-500 bg-white/70 backdrop-blur-xs shadow-lg'
                        : 'hover:ring-1 hover:ring-purple-300 hover:bg-white/40 hover:backdrop-blur-xs hover:shadow-md'
                    }`}
                  >
                    {/* Floating Controls for Selected or Hovered Sticker */}
                    <div
                      className={`absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-md whitespace-nowrap z-30 transition-opacity pointer-events-auto ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="max-w-[70px] truncate">{stk.name || 'Sticker'}</span>
                      {stk.rotation !== 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStraightenSticker(stk.id);
                          }}
                          title="Reset to Straight Position (0°)"
                          className="hover:text-emerald-300 p-0.5 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotateSticker(stk.id);
                        }}
                        title="Rotate (+90°)"
                        className="hover:text-amber-300 p-0.5 cursor-pointer"
                      >
                        <RotateCw className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSticker(stk.id);
                        }}
                        title="Remove Sticker"
                        className="hover:text-rose-400 p-0.5 cursor-pointer ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Visual Sticker Emoji */}
                    <span className="text-3xl sm:text-4xl drop-shadow-md block filter transition-transform">
                      {stk.emoji}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Title Input */}
          <input
            id="journal-title-input"
            type="text"
            value={activeEntry.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Title of today's thoughts..."
            className={`w-full text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight placeholder-slate-300 bg-transparent border-none focus:outline-none mb-3 relative z-10 ${
              settings.fontFamily === 'serif'
                ? 'font-serif'
                : settings.fontFamily === 'mono'
                ? 'font-mono'
                : 'font-sans'
            }`}
          />

          {/* Tags & Adorned Stickers Row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3 relative z-10">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            {activeEntry.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-50 border border-pink-200 text-pink-700"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-pink-900 text-pink-400 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}

            <div className="inline-flex items-center">
              <input
                id="journal-tag-input"
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+ tag (press Enter)"
                className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100/80 border border-slate-200 text-slate-700 focus:outline-none focus:bg-white w-28"
              />
            </div>
          </div>

          {/* Adorned Stickers Ribbon Tray */}
          {activeEntry.stickers && activeEntry.stickers.length > 0 && (
            <div className="mb-4 p-2.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center gap-2 overflow-x-auto relative z-10 animate-in fade-in">
              <div className="flex items-center gap-1 text-xs font-bold text-purple-900 shrink-0">
                <Smile className="w-3.5 h-3.5 text-purple-600" />
                <span>Adorned Stickers ({activeEntry.stickers.length}):</span>
              </div>
              <button
                onClick={handleStraightenAllStickers}
                title="Reset all stickers to straight position (0°)"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-white border border-purple-200 hover:bg-purple-100 text-purple-800 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                <RotateCcw className="w-2.5 h-2.5 text-purple-600" />
                <span>Straighten All</span>
              </button>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {activeEntry.stickers.map((stk) => {
                  const isSelected = selectedPlacementId === stk.id;
                  return (
                    <div
                      key={stk.id}
                      onClick={() => setSelectedPlacementId(stk.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-300'
                          : 'bg-white text-slate-800 border-purple-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <span className="text-base">{stk.emoji}</span>
                      <span className="text-[11px] max-w-[80px] truncate">{stk.name || 'Sticker'}</span>
                      {stk.rotation !== 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStraightenSticker(stk.id);
                          }}
                          title="Straighten to 0°"
                          className={`p-0.5 rounded hover:bg-black/10 transition-colors cursor-pointer ${
                            isSelected ? 'text-emerald-200' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotateSticker(stk.id);
                        }}
                        title="Rotate (+90°)"
                        className={`p-0.5 rounded hover:bg-black/10 transition-colors cursor-pointer ${
                          isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <RotateCw className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSticker(stk.id);
                        }}
                        title="Remove Sticker"
                        className={`p-0.5 rounded hover:bg-black/10 transition-colors cursor-pointer ${
                          isSelected ? 'text-white' : 'text-slate-400 hover:text-rose-600'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                <button
                  onClick={() => setShowStickerDrawer(true)}
                  className="px-2 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Sticker</span>
                </button>
              </div>
            </div>
          )}

          {/* Content Textarea */}
          <textarea
            ref={textareaRef}
            value={activeEntry.content}
            onChange={(e) => updateField('content', e.target.value)}
            placeholder="Write your heart out... Gemini is ready whenever you want reflection, brainstorming, or a gentle conversation."
            className={`flex-1 w-full bg-transparent border-none focus:outline-none resize-none text-slate-800 leading-relaxed placeholder-slate-300 min-h-[320px] relative z-10 ${
              settings.fontSize === 'sm'
                ? 'text-sm'
                : settings.fontSize === 'lg'
                ? 'text-lg'
                : 'text-base'
            } ${
              settings.fontFamily === 'serif'
                ? 'font-serif'
                : settings.fontFamily === 'mono'
                ? 'font-mono'
                : 'font-sans'
            }`}
          />
        </div>

        {/* Bottom Status Bar */}
        <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-50/40 relative z-20">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>~{readTimeMinutes} min read</span>
            {activeEntry.stickers && activeEntry.stickers.length > 0 && (
              <>
                <span>•</span>
                <span className="text-purple-600 font-semibold">
                  {activeEntry.stickers.length} sticker{activeEntry.stickers.length === 1 ? '' : 's'}{' '}
                  adorned
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Saving...
              </span>
            ) : syncStatus === 'offline' ? (
              <span className="text-slate-500 font-medium">📡 Saved locally (offline)</span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Check className="w-3.5 h-3.5" />
                Saved to cloud
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right AI Assistant Panel (Collapsible) */}
      {aiPanelOpen && (
        <div className="w-full lg:w-96 flex flex-col h-[550px] lg:h-auto min-h-0">
          <AiAssistantPanel
            entry={activeEntry}
            onAppendContent={(text) => updateField('content', `${activeEntry.content}${text}`)}
            onReplaceContent={(text) => updateField('content', text)}
            onUpdateTitle={(title) => updateField('title', title)}
          />
        </div>
      )}

      {/* Templates Modal */}
      <TemplatePickerModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
};
