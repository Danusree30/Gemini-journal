import React, { useState, useMemo, useEffect } from 'react';
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
  Lock,
  Unlock,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { useTheme } from '../lib/themeContext';
import { verifyPin, hashPin, generateSalt } from '../lib/crypto';

interface JournalHistoryProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onToggleFavorite: (entry: JournalEntry) => void;
  onTogglePin: (entry: JournalEntry) => void;
  onToggleArchive: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  isUnlocked?: boolean;
  onUnlock?: () => void;
  onLock?: () => void;
  onNavigateToPrivacy?: () => void;
}

export const JournalHistory: React.FC<JournalHistoryProps> = ({
  entries,
  onSelectEntry,
  onNewEntry,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  onDeleteEntry,
  isUnlocked,
  onUnlock,
  onLock,
  onNavigateToPrivacy,
}) => {
  const { palette, settings, updateSettings } = useTheme();

  // PIN lock management
  const [localUnlocked, setLocalUnlocked] = useState<boolean>(false);
  const isVaultUnlocked = isUnlocked !== undefined ? isUnlocked : localUnlocked;

  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Setup PIN state when no PIN is configured yet
  const [setupPin, setSetupPin] = useState('');
  const [confirmSetupPin, setConfirmSetupPin] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);

  const hasConfiguredPin = Boolean(settings.codelockPinHash && settings.codelockSalt);

  const handleUnlockVault = () => {
    setLocalUnlocked(true);
    onUnlock?.();
  };

  const handleLockVault = () => {
    setLocalUnlocked(false);
    setEnteredPin('');
    setPinError(null);
    onLock?.();
  };

  const checkPin = async (candidate: string) => {
    if (!settings.codelockSalt || !settings.codelockPinHash) return;
    setIsVerifying(true);
    setPinError(null);
    try {
      const isValid = await verifyPin(candidate, settings.codelockSalt, settings.codelockPinHash);
      if (isValid) {
        setPinError(null);
        setEnteredPin('');
        handleUnlockVault();
      } else {
        setPinError('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setEnteredPin('');
        }, 500);
      }
    } catch {
      setPinError('Error verifying PIN. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= 6) return;
    setPinError(null);
    const next = enteredPin + digit;
    setEnteredPin(next);

    if (next.length >= 4 && settings.codelockSalt && settings.codelockPinHash) {
      verifyPin(next, settings.codelockSalt, settings.codelockPinHash).then((valid) => {
        if (valid) {
          setPinError(null);
          setEnteredPin('');
          handleUnlockVault();
        } else if (next.length === 6) {
          setPinError('Incorrect PIN. Please try again.');
          setTimeout(() => setEnteredPin(''), 500);
        }
      });
    }
  };

  const handleBackspace = () => {
    setPinError(null);
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinError(null);
    setEnteredPin('');
  };

  // Keyboard listener for PIN lock
  useEffect(() => {
    if (isVaultUnlocked || !hasConfiguredPin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (enteredPin.length >= 4) {
          checkPin(enteredPin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVaultUnlocked, hasConfiguredPin, enteredPin, settings.codelockSalt, settings.codelockPinHash]);

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    if (!/^\d{4,6}$/.test(setupPin)) {
      setSetupError('PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (setupPin !== confirmSetupPin) {
      setSetupError('PINs do not match. Please verify.');
      return;
    }

    setIsSavingPin(true);
    try {
      const salt = generateSalt();
      const hash = await hashPin(setupPin, salt);
      await updateSettings({
        codelockEnabled: true,
        codelockPinHash: hash,
        codelockSalt: salt,
        historyPinLockEnabled: true,
      });
      setSetupPin('');
      setConfirmSetupPin('');
      handleUnlockVault();
    } catch {
      setSetupError('Failed to save security PIN. Please try again.');
    } finally {
      setIsSavingPin(false);
    }
  };

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

  // If the Vault is locked, display the secure PIN lock screen
  if (!isVaultUnlocked) {
    if (hasConfiguredPin) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full my-auto animate-in fade-in">
          <div
            className={`w-full bg-white rounded-3xl p-8 shadow-xl border border-pink-100/80 flex flex-col items-center text-center transition-transform ${
              pinError ? 'animate-shake' : ''
            }`}
          >
            {/* Vault Shield & Lock Icon */}
            <div className="relative mb-4">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center text-white text-2xl font-bold shadow-md"
                style={{ backgroundColor: palette.accent }}
              >
                <Shield className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Journal History Vault
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-6 max-w-xs leading-relaxed">
              Your previous reflections, memories, and archives are protected. Enter your PIN to view.
            </p>

            {/* Masked PIN Dots Indicator */}
            <div className="flex items-center gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    enteredPin.length > idx
                      ? pinError
                        ? 'bg-rose-500 scale-110 shadow-xs'
                        : 'bg-purple-600 scale-110 shadow-xs'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-xs text-rose-500 font-bold mb-4 flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </p>
            )}

            {isVerifying && (
              <p className="text-xs text-purple-600 font-medium mb-3 animate-pulse">
                Verifying PIN security...
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px] mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigit(digit)}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-purple-50 text-slate-800 hover:text-purple-700 text-lg font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center border border-slate-100"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center border border-slate-100"
                title="Clear entered digits"
              >
                Clear
              </button>
              <button
                onClick={() => handleDigit('0')}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-purple-50 text-slate-800 hover:text-purple-700 text-lg font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center border border-slate-100"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                title="Backspace"
                className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-base font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center border border-slate-100"
              >
                ⌫
              </button>
            </div>

            {/* Unlock Button */}
            {enteredPin.length >= 4 && (
              <button
                onClick={() => checkPin(enteredPin)}
                className="w-full max-w-[240px] py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-transform hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Vault</span>
              </button>
            )}

            {/* Footer options */}
            <div className="mt-6 pt-4 border-t border-slate-100 w-full flex justify-center">
              {onNavigateToPrivacy && (
                <button
                  onClick={onNavigateToPrivacy}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-600 font-medium transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Manage or reset PIN in Security Center</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // No PIN configured yet: Show Setup PIN view so user can configure PIN lock directly!
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full my-auto animate-in fade-in">
        <div className="w-full bg-white rounded-3xl p-8 shadow-xl border border-pink-100/80 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 shadow-sm">
            <KeyRound className="w-8 h-8" />
          </div>

          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            Protect History with a PIN
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-6 max-w-xs leading-relaxed">
            Set a 4-6 digit numeric security PIN to lock your personal journal history and reflections.
          </p>

          <form onSubmit={handleCreatePin} className="w-full space-y-3">
            <div className="space-y-2.5">
              <input
                type="password"
                maxLength={6}
                value={setupPin}
                onChange={(e) => setSetupPin(e.target.value)}
                placeholder="Enter 4-6 Digit PIN"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-center tracking-widest font-mono text-slate-800"
              />
              <input
                type="password"
                maxLength={6}
                value={confirmSetupPin}
                onChange={(e) => setConfirmSetupPin(e.target.value)}
                placeholder="Confirm PIN"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-center tracking-widest font-mono text-slate-800"
              />
            </div>

            {setupError && (
              <p className="text-xs text-rose-500 font-bold flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {setupError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSavingPin}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-transform hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSavingPin ? 'Securing Vault...' : 'Set PIN & Unlock History'}</span>
            </button>

            <button
              type="button"
              onClick={handleUnlockVault}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer"
            >
              Browse without PIN for now
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col min-h-0 overflow-y-auto space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Journal Archive & Search</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-semibold">
                {filteredEntries.length} entries
              </span>
            </h1>

            {hasConfiguredPin ? (
              <button
                onClick={handleLockVault}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                title="Lock Journal History now"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock History</span>
              </button>
            ) : (
              <button
                onClick={handleLockVault}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                title="Set PIN to protect History"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Set PIN Lock</span>
              </button>
            )}

            {onNavigateToPrivacy && (
              <button
                onClick={onNavigateToPrivacy}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                title="Manage PIN in Security Center"
              >
                <KeyRound className="w-3 h-3 text-slate-500" />
                <span>PIN Settings</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-500">
              Privately browse, search, and reflect over all your previous memories
            </p>
            {hasConfiguredPin ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                PIN Guard Active
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                PIN Not Configured
              </span>
            )}
            <label className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer select-none ml-2">
              <input
                type="checkbox"
                checked={Boolean(settings.autoLockHistoryOnLeave)}
                onChange={(e) => updateSettings({ autoLockHistoryOnLeave: e.target.checked })}
                className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span>Re-lock on tab switch</span>
            </label>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search thoughts, memories, tags, or AI summaries..."
            className="w-full pl-10 pr-10 py-2.5 text-xs rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-800 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* PIN Security Notice Banner when unconfigured */}
      {!hasConfiguredPin && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-950">Secure Your History with a PIN</p>
              <p className="text-[11px] text-amber-800">
                You are currently viewing history without PIN lock protection. Set a 4-6 digit numeric PIN to keep your past thoughts confidential.
              </p>
            </div>
          </div>
          <button
            onClick={handleLockVault}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-transform hover:scale-102 active:scale-98 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Configure PIN Now
          </button>
        </div>
      )}

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
